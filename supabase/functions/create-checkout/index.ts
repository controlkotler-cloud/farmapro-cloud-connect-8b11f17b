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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });

    // Reutiliza customer si existe.
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const origin = req.headers.get('origin') ?? Deno.env.get('APP_URL') ?? 'https://portal.farmapro.es';

    // ============================================================
    // RAMA PACKS DE IMÁGENES (pago único)
    // ============================================================
    if (isPack) {
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
