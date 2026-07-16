// =====================================================================
// check-subscription: valida la suscripción del usuario contra Stripe
// mapeando por Price ID (no por importes). Roles PROTEGIDOS (admin)
// NUNCA se degradan aquí. En modo beta se salta Stripe.
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { lookupPrice, PROTECTED_ROLES } from "../_shared/stripePrices.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const validationMode = modeRow?.value ? JSON.parse(modeRow.value) : 'beta';

    const { data: profile } = await supabase.from('profiles')
      .select('subscription_role, subscription_status').eq('id', user.id).maybeSingle();

    if (validationMode === 'beta') {
      log('beta mode, returning profile state');
      return json({
        subscribed: (profile?.subscription_role ?? 'freemium') !== 'freemium',
        subscription_role: profile?.subscription_role ?? 'freemium',
        subscription_status: profile?.subscription_status ?? 'trialing',
        mode: 'beta',
      });
    }

    // Roles protegidos: no tocar.
    if (profile?.subscription_role && (PROTECTED_ROLES as readonly string[]).includes(profile.subscription_role)) {
      return json({
        subscribed: true,
        subscription_role: profile.subscription_role,
        subscription_status: profile.subscription_status,
        protected: true,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    // Guard miembro de equipo: si el usuario es miembro activo de un equipo
    // activo, su rol correcto es 'equipo' (paga el titular). Nunca se degrada
    // aquí, aunque no tenga stripe_customer_id ni suscripción propia.
    const { data: teamMembership } = await supabase
      .from('team_members')
      .select('team_id, team_subscriptions!inner(status)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('team_subscriptions.status', 'active')
      .maybeSingle();

    if (customers.data.length === 0) {
      if (teamMembership) {
        log('team member without own stripe customer, keeping equipo role');
        await supabase.from('profiles').update({
          subscription_role: 'equipo',
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
        return json({ subscribed: true, subscription_role: 'equipo', subscription_status: 'active', team_member: true });
      }
      await supabase.from('profiles').update({
        subscription_role: 'freemium',
        subscription_status: 'trialing',
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      return json({ subscribed: false, subscription_role: 'freemium', subscription_status: 'trialing' });
    }

    const customerId = customers.data[0].id;
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });

    if (subs.data.length === 0) {
      if (teamMembership) {
        log('team member without own active subscription, keeping equipo role');
        await supabase.from('profiles').update({
          subscription_role: 'equipo',
          subscription_status: 'active',
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
        return json({ subscribed: true, subscription_role: 'equipo', subscription_status: 'active', team_member: true });
      }
      await supabase.from('profiles').update({
        subscription_role: 'freemium',
        subscription_status: 'canceled',
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      return json({ subscribed: false, subscription_role: 'freemium', subscription_status: 'canceled' });
    }

    const sub = subs.data[0];
    const priceId = sub.items.data[0].price.id;
    const priceInfo = lookupPrice(priceId);
    const role = priceInfo?.plan ?? profile?.subscription_role ?? 'freemium';

    await supabase.from('profiles').update({
      subscription_role: role,
      subscription_status: 'active',
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan_name: role,
      plan_id: role,
      cycle: priceInfo?.cycle ?? 'monthly',
      is_founder: priceInfo?.founder ?? false,
      status: 'active',
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end:   new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_subscription_id' });

    return json({
      subscribed: true,
      subscription_role: role,
      subscription_status: 'active',
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    });
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
