// =====================================================================
// create-checkout: genera una Stripe Checkout Session para Plus o Equipo.
// Body: { plan: 'plus'|'equipo', cycle: 'monthly'|'yearly' }.
// Elige el Price de lanzamiento si quedan plazas fundador (recuento REAL
// en public.founder_count), si no cae al Price regular. IVA incluido.
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { pickSubscriptionPrice, IMAGE_PACK_PRICES, type PlanId, type Cycle } from "../_shared/stripePrices.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FOUNDER_TOTAL = 100;

const log = (step: string, details?: unknown) => {
  console.log(`[create-checkout] ${step}${details ? ' - ' + JSON.stringify(details) : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({} as any));
    const pack = body.pack as number | undefined;
    const plan = body.plan as PlanId;
    const cycle = (body.cycle ?? 'monthly') as Cycle;

    const isPack = typeof pack === 'number';
    if (!isPack) {
      if (!['plus', 'equipo'].includes(plan)) {
        return json({ error: 'Invalid plan (expected plus|equipo)' }, 400);
      }
      if (!['monthly', 'yearly'].includes(cycle)) {
        return json({ error: 'Invalid cycle (expected monthly|yearly)' }, 400);
      }
    } else if (!IMAGE_PACK_PRICES[pack]) {
      return json({ error: 'Invalid pack (expected 20|50|100)' }, 400);
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user?.email) return json({ error: 'Unauthorized' }, 401);
    const user = userData.user;
    log('user', { id: user.id, email: user.email });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });

    // Reutiliza customer si existe.
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    // Perfil: rol (gate de packs), customer guardado y datos fiscales.
    const { data: profile } = await admin
      .from('profiles')
      .select('subscription_role, stripe_customer_id, cif, full_name')
      .eq('id', user.id)
      .maybeSingle();
    const profileCif = ((profile?.cif as string | null) ?? '').trim() || null;

    // El CIF/NIF se pide obligatorio y validado en el registro, así que casi
    // siempre lo tenemos ya: se lo adjuntamos al customer de Stripe para que el
    // checkout no se lo vuelva a pedir (Stripe oculta el campo cuando el
    // customer ya tiene un tax_id). Si el perfil no lo tiene —altas anteriores
    // a que el campo existiera— el checkout lo pedirá en pantalla.
    if (customerId && profileCif) {
      try {
        const taxIds = await stripe.customers.listTaxIds(customerId, { limit: 1 });
        if (taxIds.data.length === 0) {
          await stripe.customers.createTaxId(customerId, { type: 'es_cif', value: profileCif });
          log('tax id attached', { customerId });
        }
      } catch (e) {
        // Un NIF que Stripe no valide nunca puede tumbar el cobro.
        log('tax id attach failed', { err: (e as Error).message });
      }
    }

    // Datos de facturación obligatorios en TODAS las modalidades: sin dirección
    // fiscal y NIF no sale una factura española válida en Holded.
    const billingFields = {
      billing_address_collection: 'required' as const,
      tax_id_collection: { enabled: true },
      ...(customerId ? { customer_update: { name: 'auto' as const, address: 'auto' as const } } : {}),
    };

    const origin = req.headers.get('origin') ?? Deno.env.get('APP_URL') ?? 'https://portal.farmapro.es';

    // ============================================================
    // RAMA PACKS DE IMÁGENES (pago único)
    // ============================================================
    if (isPack) {
      // Los packs solo tienen sentido sobre un plan de pago (así se anuncian en
      // Precios e ImageWorkspace). Sin este guard, un usuario gratis podía
      // comprarlos desde la consola aunque la UI no se lo ofreciera.
      const PAID_ROLES = ['plus', 'equipo', 'premium', 'profesional', 'admin'];
      const packRole = (profile?.subscription_role as string | null) ?? null;
      if (!packRole || !PAID_ROLES.includes(packRole)) {
        return json({ error: 'Los packs de imágenes están disponibles con los planes Plus y Equipo. Hazte Plus para recargar créditos.' }, 403);
      }

      const packPriceId = IMAGE_PACK_PRICES[pack!];
      if (packPriceId.startsWith('TODO_')) {
        return json({ error: `Stripe Price ID no configurado (${packPriceId})` }, 500);
      }
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [{ price: packPriceId, quantity: 1 }],
        mode: 'payment',
        allow_promotion_codes: true,
        ...billingFields,
        success_url: `${origin}/asistente-creativo?pack=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${origin}/asistente-creativo?pack=cancelled`,
        metadata: {
          origen: 'portal',
          user_id: user.id,
          pack_credits: String(pack),
        },
      });
      log('pack session created', { id: session.id, pack });
      return json({ url: session.url, pack });
    }

    // ============================================================
    // RAMA SUSCRIPCIÓN (Plus / Equipo)
    // ============================================================

    // Guard antiduplicado: si ya hay suscripción viva, al portal de cliente.
    const existingCustomerId = (profile?.stripe_customer_id as string | null) ?? customerId;

    if (existingCustomerId) {
      const subs = await stripe.subscriptions.list({ customer: existingCustomerId, status: 'all', limit: 100 });
      const live = subs.data.filter(
        (s) => ['active', 'trialing', 'past_due'].includes(s.status) && s.metadata?.origen === 'portal',
      );
      if (live.length > 0) {
        const portal = await stripe.billingPortal.sessions.create({
          customer: existingCustomerId,
          return_url: `${origin}/perfil?checkout=success`,
        });
        log('existing subscription, redirecting to portal', { customer: existingCustomerId });
        return json({ url: portal.url, mode: 'portal' });
      }
    }

    const { data: fc } = await admin.from('founder_count').select('spots_taken').maybeSingle();
    const spotsTaken = (fc?.spots_taken ?? 0) as number;
    const founderSpotsLeft = Math.max(0, FOUNDER_TOTAL - spotsTaken);


    let priceId: string; let founder: boolean;
    try {
      ({ priceId, founder } = pickSubscriptionPrice(plan, cycle, founderSpotsLeft));
    } catch (e) {
      return json({ error: (e as Error).message }, 400);
    }
    if (priceId.startsWith('TODO_')) {
      return json({ error: `Stripe Price ID no configurado (${priceId}).` }, 500);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      ...billingFields,
      success_url: `${origin}/perfil?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/precios?checkout=cancelled`,
      metadata: {
        origen: 'portal',
        user_id: user.id,
        plan,
        cycle,
        founder: String(founder),
      },
      subscription_data: {
        metadata: {
          origen: 'portal',
          user_id: user.id,
          plan,
          cycle,
          founder: String(founder),
        },
      },
    });

    log('session created', { id: session.id, priceId, founder });
    return json({ url: session.url, founder, founderSpotsLeft });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log('ERROR', { msg });
    return json({ error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
