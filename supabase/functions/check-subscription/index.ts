// =====================================================================
// check-subscription: valida la suscripción del usuario contra Stripe
// mapeando por Price ID (no por importes). Roles PROTEGIDOS (admin)
// NUNCA se degradan aquí. En modo beta se salta Stripe.
//
// Esta función solo SUBE o confirma un plan; nunca baja a nadie (07-10-2026).
// Las bajas son de stripe-webhook (customer.subscription.updated/deleted) y
// del fin de cada concesión. Motivo: la prueba gratis no tiene suscripción en
// Stripe y las concesiones (portal_grants) son suscripciones en `trialing`;
// antes, sin suscripción `active`, se escribía freemium/canceled y un regalado
// activado se quedaba sin su plan.
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { lookupPrice, PROTECTED_ROLES } from "../_shared/stripePrices.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Estados de Stripe que dan acceso. `trialing` incluye las concesiones. */
const LIVE_STATUSES = ['active', 'trialing', 'past_due'];

/** Orden de los roles para no bajar nunca: un plan más alto no se pisa con uno menor. */
const ROLE_RANK: Record<string, number> = {
  freemium: 0, estudiante: 0, plus: 1, premium: 1, profesional: 1, equipo: 2, admin: 3,
};

const log = (step: string, details?: unknown) => {
  console.log(`[check-subscription] ${step}${details ? ' - ' + JSON.stringify(details) : ''}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user?.email) return json({ error: 'Unauthorized' }, 401);
    const user = userData.user;

    // Modo beta: no consultamos Stripe.
    const { data: modeRow } = await supabase.from('system_settings')
      .select('value').eq('key', 'validation_mode').maybeSingle();
    const validationMode = readMode(modeRow?.value);

    const { data: profile } = await supabase.from('profiles')
      .select('subscription_role, subscription_status').eq('id', user.id).maybeSingle();
    const currentRole = profile?.subscription_role ?? 'freemium';

    // Lo que hay en el perfil, sin tocarlo.
    const asIs = (extra: Record<string, unknown> = {}) => json({
      subscribed: currentRole !== 'freemium',
      subscription_role: currentRole,
      subscription_status: profile?.subscription_status ?? null,
      ...extra,
    });

    if (validationMode === 'beta') {
      log('beta mode, returning profile state');
      return asIs({ mode: 'beta' });
    }

    // Roles protegidos: no tocar.
    if ((PROTECTED_ROLES as readonly string[]).includes(currentRole)) {
      return asIs({ subscribed: true, protected: true });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    // Guard miembro de equipo: si el usuario es miembro activo de un equipo
    // activo, su rol correcto es 'equipo' (paga el titular), aunque no tenga
    // stripe_customer_id ni suscripción propia.
    const { data: teamMembership } = await supabase
      .from('team_members')
      .select('team_id, team_subscriptions!inner(status)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('team_subscriptions.status', 'active')
      .maybeSingle();

    const customerId = customers.data[0]?.id ?? null;
    let sub: Stripe.Subscription | undefined;
    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });
      sub = subs.data.find((s) => LIVE_STATUSES.includes(s.status));
    }

    if (!sub) {
      if (teamMembership && (ROLE_RANK[currentRole] ?? 0) < ROLE_RANK.equipo) {
        log('team member without own live subscription, setting equipo role');
        await supabase.from('profiles').update({
          subscription_role: 'equipo',
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
        return json({ subscribed: true, subscription_role: 'equipo', subscription_status: 'active', team_member: true });
      }
      // Sin suscripción viva en Stripe: no se baja a nadie (ver cabecera).
      log('no live stripe subscription, profile left as is', { role: currentRole });
      return asIs({ stripe: customerId ? 'no_live_subscription' : 'no_customer' });
    }

    const priceId = sub.items.data[0].price.id;
    const priceInfo = lookupPrice(priceId);
    const stripeRole = priceInfo?.plan ?? currentRole;
    const role = (ROLE_RANK[currentRole] ?? 0) > (ROLE_RANK[stripeRole] ?? 0) ? currentRole : stripeRole;
    // Mismos valores que toDbStatus() de stripe-webhook para estos tres estados.
    const status = sub.status;

    await supabase.from('profiles').update({
      subscription_role: role,
      subscription_status: status,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan_name: stripeRole,
      plan_id: stripeRole,
      cycle: priceInfo?.cycle ?? 'monthly',
      is_founder: priceInfo?.founder ?? false,
      status: sub.status,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end:   new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_subscription_id' });

    return json({
      subscribed: true,
      subscription_role: role,
      subscription_status: status,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log('ERROR', { msg });
    return json({ error: msg }, 500);
  }
});

/**
 * `system_settings.value` es jsonb y supabase-js lo entrega ya parseado
 * ('beta' | 'active'). Antes se hacía JSON.parse sobre ese texto y fallaba
 * en los dos modos. Se acepta también un texto JSON por si se guarda así.
 */
function readMode(raw: unknown): string {
  if (typeof raw !== 'string') return 'beta';
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : raw;
  } catch {
    return raw;
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
