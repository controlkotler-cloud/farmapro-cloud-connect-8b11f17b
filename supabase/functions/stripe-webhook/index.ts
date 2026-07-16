// =====================================================================
// stripe-webhook: procesa eventos de Stripe para el portal.
// - Idempotencia FIRST: registra event.id antes de cualquier trabajo.
// - checkout.session.completed: asigna rol, guarda customer_id, inserta
//   fila en subscriptions, marca is_founder.
// - invoice.payment_failed: marca past_due.
// - customer.subscription.updated/deleted: sincroniza estado y degrada
//   a freemium (SALVO admin); si sale de 'equipo', desactiva el equipo
//   (deactivate_team_for_owner) antes de degradar al titular.
// verify_jwt = false: la seguridad es la firma del webhook.
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { lookupPrice, PROTECTED_ROLES } from "../_shared/stripePrices.ts";
import { createHoldedInvoice } from "../_shared/holded.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (step: string, details?: unknown) => {
  console.log(`[stripe-webhook] ${step}${details ? ' - ' + JSON.stringify(details) : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });

  // Verificación de firma
  const signature = req.headers.get('stripe-signature');
  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || "",
    );
  } catch (err) {
    log('signature verification failed', { err: (err as Error).message });
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  // ⛔ IDEMPOTENCIA FIRST: si el insert falla por unique violation, ya lo procesamos.
  const { error: dupErr } = await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type });
  if (dupErr) {
    // 23505 = unique_violation → ya procesado.
    if ((dupErr as any).code === '23505') {
      log('duplicate event ignored', { id: event.id });
      return json({ received: true, duplicate: true });
    }
    log('stripe_events insert error (continuing)', { err: dupErr.message });
  }

  try {
    log('processing', { type: event.type, id: event.id });

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripe, supabase, event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(supabase, event.data.object as Stripe.Invoice);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(stripe, supabase, event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(supabase, event.data.object as Stripe.Subscription, event.type);
        break;

      default:
        log('unhandled event type', { type: event.type });
    }

    return json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log('ERROR', { msg });
    // Devolvemos 200 para no reintentar en bucle en errores lógicos; el error ya queda logueado.
    return json({ received: true, error: msg });
  }
});

// -------------------------------------------------------------------

async function handleCheckoutCompleted(
  stripe: Stripe,
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
) {
  if (session.mode !== 'subscription') {
    log('checkout not subscription, skipping', { mode: session.mode });
    return;
  }
  const userId = session.metadata?.user_id;
  const plan   = session.metadata?.plan;
  const cycle  = session.metadata?.cycle ?? 'monthly';
  const founder = session.metadata?.founder === 'true';
  if (!userId || !plan) {
    log('checkout without user_id/plan metadata', { sessionId: session.id });
    return;
  }

  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  // Recuperar la subscripción para current_period_start/end.
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const periodStart = new Date(sub.current_period_start * 1000).toISOString();
  const periodEnd   = new Date(sub.current_period_end   * 1000).toISOString();

  // Actualizar profile.
  const { error: profErr } = await supabase.from('profiles').update({
    subscription_role: plan,
    subscription_status: 'active',
    stripe_customer_id: customerId,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);
  if (profErr) log('profile update error', { err: profErr.message });

  // Upsert en subscriptions.
  const { error: subErr } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    plan_name: plan,
    plan_id: plan,
    cycle,
    is_founder: founder,
    status: 'active',
    current_period_start: periodStart,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' });
  if (subErr) log('subscriptions upsert error', { err: subErr.message });

  // Plan Equipo: crea o reactiva el equipo del titular (9 plazas de invitación).
  // Idempotente — seguro de relanzar si el webhook se reintenta.
  if (plan === 'equipo') {
    const { error: teamErr } = await supabase.rpc('ensure_team_subscription', {
      p_owner: userId,
      p_stripe_subscription_id: subscriptionId,
    });
    if (teamErr) log('ensure_team_subscription error', { err: teamErr.message });
  }

  log('checkout completed', { userId, plan, cycle, founder });
}

async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice,
) {
  const subscriptionId = invoice.subscription as string | null;
  if (!subscriptionId) return;

  const { data: row } = await supabase
    .from('subscriptions').select('user_id').eq('stripe_subscription_id', subscriptionId).maybeSingle();

  await supabase.from('subscriptions').update({
    status: 'past_due',
    updated_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', subscriptionId);

  if (row?.user_id) {
    await supabase.from('profiles').update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    }).eq('id', row.user_id);

    // Email past-due (fire-and-forget; el fallo no interrumpe el webhook).
    try {
      const { data: prof } = await supabase.from('profiles')
        .select('full_name, email').eq('id', row.user_id).maybeSingle();
      const to = (prof as any)?.email;
      if (to) {
        await supabase.functions.invoke('send-portal-email', {
          body: {
            template: 'past-due',
            to,
            data: { nombre: (prof as any)?.full_name ?? '' },
            meta: { trigger: 'stripe-webhook', event: 'invoice.payment_failed', subscription_id: subscriptionId },
          },
        });
      }
    } catch (e) { log('past-due email dispatch failed', { err: (e as Error).message }); }

    // Notificación in-app.
    await supabase.from('notifications').insert({
      user_id: row.user_id,
      type: 'billing',
      title: 'Problema con tu pago',
      message: 'No hemos podido cobrar tu suscripción. Actualiza tu método de pago para no perder el acceso.',
      target_url: '/perfil?tab=facturacion',
      is_read: false,
    }).then(({ error }) => { if (error) log('notif insert err', { err: error.message }); });
  }
  log('invoice.payment_failed processed', { subscriptionId });
}

async function handleSubscriptionChange(
  supabase: ReturnType<typeof createClient>,
  sub: Stripe.Subscription,
  eventType: string,
) {
  const subscriptionId = sub.id;

  // Buscar user_id de nuestra fila.
  const { data: row } = await supabase
    .from('subscriptions').select('user_id')
    .eq('stripe_subscription_id', subscriptionId).maybeSingle();

  // Estado normalizado.
  let newStatus: string = sub.status; // active | past_due | canceled | unpaid | trialing | ...
  if (eventType === 'customer.subscription.deleted') newStatus = 'canceled';

  await supabase.from('subscriptions').update({
    status: newStatus,
    current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
    current_period_end:   sub.current_period_end   ? new Date(sub.current_period_end   * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', subscriptionId);

  if (!row?.user_id) {
    log('subscription change without user row', { subscriptionId });
    return;
  }

  // Determinar rol resultante a partir del Price ID (si sigue activo).
  const priceId = sub.items.data[0]?.price.id;
  const priceInfo = priceId ? lookupPrice(priceId) : null;
  const willDowngrade = ['canceled', 'unpaid', 'incomplete_expired'].includes(newStatus);

  // Cargar perfil para respetar admin.
  const { data: profile } = await supabase.from('profiles')
    .select('subscription_role').eq('id', row.user_id).maybeSingle();
  const currentRole = profile?.subscription_role;

  if (currentRole && (PROTECTED_ROLES as readonly string[]).includes(currentRole)) {
    log('skipping downgrade for protected role', { userId: row.user_id, role: currentRole });
    return;
  }

  let newRole: string;
  let newProfileStatus: string;
  if (willDowngrade) {
    newRole = 'freemium';
    newProfileStatus = 'canceled';
  } else if (priceInfo) {
    newRole = priceInfo.plan;
    newProfileStatus = newStatus === 'active' ? 'active' : newStatus;
  } else {
    // Sin info de price → solo actualizar estado, no tocar rol.
    await supabase.from('profiles').update({
      subscription_status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', row.user_id);
    return;
  }

  // Salir de Equipo (cancelación o downgrade a otro plan): desactivar el equipo
  // ANTES de degradar al titular, para que los miembros pierdan el acceso.
  if (currentRole === 'equipo' && newRole !== 'equipo') {
    const { error: deactivateErr } = await supabase.rpc('deactivate_team_for_owner', { p_owner: row.user_id });
    if (deactivateErr) log('deactivate_team_for_owner error', { err: deactivateErr.message });
  }

  await supabase.from('profiles').update({
    subscription_role: newRole,
    subscription_status: newProfileStatus,
    updated_at: new Date().toISOString(),
  }).eq('id', row.user_id);

  log('subscription change applied', { userId: row.user_id, newRole, newStatus });
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
