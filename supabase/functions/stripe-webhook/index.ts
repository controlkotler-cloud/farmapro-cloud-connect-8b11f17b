// =====================================================================
// stripe-webhook: procesa eventos de Stripe para el portal.
// - Idempotencia FIRST: registra event.id antes de cualquier trabajo.
// - checkout.session.completed: asigna rol, guarda customer_id, inserta
//   fila en subscriptions, marca is_founder.
// - invoice.payment_failed: marca past_due.
// - customer.subscription.updated/deleted: sincroniza estado y degrada
//   a freemium (SALVO admin); si sale de 'equipo', desactiva el equipo
//   (deactivate_team_for_owner) antes de degradar al titular; si entra en
//   'equipo' por cambio de plan, crea/reactiva el equipo; sincroniza
//   plan/cycle/is_founder de subscriptions y la metadata de Stripe con el
//   Price real (cambios de plan hechos en el portal de Stripe).
// verify_jwt = false: la seguridad es la firma del webhook.
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { lookupPrice, PROTECTED_ROLES } from "../_shared/stripePrices.ts";
import { createHoldedInvoice } from "../_shared/holded.ts";

// Stripe address (snake_case) → HoldedAddress. Sirve igual para
// session.customer_details.address y para invoice.customer_address.
function toStripeAddress(a: any) {
  if (!a) return null;
  return {
    line1: a.line1 ?? null,
    line2: a.line2 ?? null,
    city: a.city ?? null,
    postalCode: a.postal_code ?? null,
    province: a.state ?? null,
    countryCode: a.country ?? null,
  };
}

// El NIF y la razón social que el cliente teclea en el checkout valen para
// todas las facturas siguientes: se guardan en profiles si estaban vacíos.
// Nunca pisa un dato que ya existe.
async function backfillFiscalData(
  supabase: any,
  userId: string | null,
  cif: string | null,
  name: string | null,
) {
  if (!userId || (!cif && !name)) return;
  try {
    const { data: prof } = await supabase.from('profiles')
      .select('cif, full_name').eq('id', userId).maybeSingle();
    const patch: Record<string, unknown> = {};
    if (cif && !prof?.cif) patch.cif = cif;
    if (name && !prof?.full_name) patch.full_name = name;
    if (Object.keys(patch).length === 0) return;
    patch.updated_at = new Date().toISOString();
    await supabase.from('profiles').update(patch).eq('id', userId);
    log('fiscal data backfilled', { userId, fields: Object.keys(patch) });
  } catch (e) {
    log('fiscal backfill failed', { err: (e as Error).message });
  }
}

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

  // ⛔ IDEMPOTENCIA EN DOS TIEMPOS: reclamar ahora, confirmar al final.
  const { error: dupErr } = await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type, completed_at: null });
  if (dupErr) {
    if ((dupErr as any).code === '23505') {
      const { data: existing } = await supabase
        .from('stripe_events').select('completed_at').eq('id', event.id).maybeSingle();
      if ((existing as any)?.completed_at) {
        log('duplicate event already completed, ignoring', { id: event.id });
        return json({ received: true, duplicate: true });
      }
      log('previous attempt incomplete, reprocessing', { id: event.id });
    } else {
      log('stripe_events insert error, asking Stripe to retry', { err: dupErr.message });
      return json({ received: false, error: dupErr.message }, 500);
    }
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
        await handleSubscriptionChange(stripe, supabase, event.data.object as Stripe.Subscription, event.type);
        break;

      default:
        log('unhandled event type', { type: event.type });
    }

    // Confirmamos el procesamiento correcto del evento.
    await supabase.from('stripe_events')
      .update({ completed_at: new Date().toISOString(), last_error: null })
      .eq('id', event.id);

    return json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log('ERROR', { msg });
    // Dejamos completed_at a null y guardamos el error: devolvemos 500 para que Stripe reintente.
    await supabase.from('stripe_events')
      .update({ last_error: msg })
      .eq('id', event.id);
    return json({ received: false, error: msg }, 500);
  }

});

// -------------------------------------------------------------------

async function handleCheckoutCompleted(
  stripe: Stripe,
  supabase: any,
  session: Stripe.Checkout.Session,
) {
  // Rama PACKS de imágenes (pago único). No mezclamos con suscripción.
  if (session.mode === 'payment') {
    if (session.metadata?.origen !== 'portal') {
      log('payment session not from portal, skipping', { sessionId: session.id, origen: session.metadata?.origen });
      return;
    }
    const rawPack = session.metadata?.pack_credits;
    const packCredits = rawPack ? parseInt(rawPack, 10) : NaN;
    const userIdPack = session.metadata?.user_id;
    if (!userIdPack || !Number.isFinite(packCredits) || packCredits <= 0) {
      log('payment session without pack_credits/user_id, skipping', { sessionId: session.id });
      return;
    }

    // Sumar créditos (atómico, service role). Idempotente por sesión de Stripe:
    // un reintento del webhook NO vuelve a sumar (fix 07-09-2026).
    const { data: grantData, error: creditErr } = await supabase.rpc('add_image_credits_once', {
      p_user: userIdPack, p_credits: packCredits, p_ref: session.id,
    });
    if (creditErr) {
      // NO se traga: si respondiéramos 200 aquí, el pago quedaría cobrado y sin
      // créditos, y Stripe no reintentaría nunca. Lanzar deja completed_at a
      // null y devuelve 500, que es justo lo que provoca el reintento.
      log('add_image_credits_once error', { err: creditErr.message, sessionId: session.id });
      throw new Error(`add_image_credits_once failed for ${userIdPack}: ${creditErr.message}`);
    }
    log('pack credits granted', {
      sessionId: session.id,
      granted: (grantData as { granted?: boolean } | null)?.granted ?? null,
      balance: (grantData as { balance?: number } | null)?.balance ?? null,
    });

    // Factura Holded (pack). Total con IVA incluido = amount_total/100.
    try {
      const email = session.customer_details?.email
        ?? (session.customer_email as string | undefined)
        ?? '';
      const { data: prof } = await supabase.from('profiles')
        .select('full_name, cif, email').eq('id', userIdPack).maybeSingle();

      // Datos fiscales: manda lo que el cliente puso en el checkout de Stripe;
      // el perfil es el respaldo. El NIF ya suele venir del registro.
      const details = (session as any).customer_details;
      const stripeCif = details?.tax_ids?.[0]?.value ?? null;
      const stripeName = details?.name ?? null;
      await backfillFiscalData(supabase, userIdPack, stripeCif, stripeName);
      const total = ((session.amount_total ?? 0) / 100);
      if (total === 0) {
        log('zero-amount checkout session, skipping Holded (no document, no email)', { sessionId: session.id });
      } else {
        await createHoldedInvoice({
          sourceId: session.id,
          sourceType: 'stripe_checkout_session',
          userId: userIdPack,
          email: (prof as any)?.email ?? email,
          name: stripeName ?? (prof as any)?.full_name ?? null,
          cif: (prof as any)?.cif ?? stripeCif ?? null,
          address: toStripeAddress(details?.address),
          concept: `Portal farmapro · Pack ${packCredits} imágenes IAFarma`,
          totalEur: total,
          meta: { pack_credits: packCredits, origen: 'portal' },
        });
      }
    } catch (e) { log('holded pack invoice failed', { err: (e as Error).message }); }

    log('pack purchase applied', { userId: userIdPack, packCredits });
    return;
  }

  if (session.mode !== 'subscription') {
    log('checkout mode not handled', { mode: session.mode });
    return;
  }
  if (session.metadata?.origen !== 'portal') {
    log('subscription session not from portal, skipping', { sessionId: session.id, origen: session.metadata?.origen });
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

  // Guard: no degradar/sobrescribir roles protegidos (admin) desde el webhook.
  const { data: currentProfile } = await supabase.from('profiles')
    .select('subscription_role').eq('id', userId).maybeSingle();
  const currentRole = (currentProfile as any)?.subscription_role;
  const isProtected = currentRole && (PROTECTED_ROLES as readonly string[]).includes(currentRole);

  if (isProtected) {
    log('protected role, skipping profile role change', { userId, role: currentRole });
    const { error: profErr } = await supabase.from('profiles').update({
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);
    if (profErr) throw new Error(`profile customer_id update failed: ${profErr.message}`);
  } else {
    const { error: profErr } = await supabase.from('profiles').update({
      subscription_role: plan,
      subscription_status: toDbStatus(sub.status),
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);
    if (profErr) throw new Error(`profile update failed: ${profErr.message}`);
  }

  // Upsert en subscriptions.
  const { error: subErr } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    plan_name: plan,
    plan_id: plan,
    cycle,
    is_founder: founder,
    status: toDbStatus(sub.status),
    current_period_start: periodStart,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' });
  if (subErr) throw new Error(`subscriptions upsert failed: ${subErr.message}`);

  // Plan Equipo: crea o reactiva el equipo del titular (9 plazas de invitación).
  // Idempotente — seguro de relanzar si el webhook se reintenta.
  if (plan === 'equipo') {
    const { error: teamErr } = await supabase.rpc('ensure_team_subscription', {
      p_owner: userId,
      p_stripe_subscription_id: subscriptionId,
    });
    if (teamErr) throw new Error(`ensure_team_subscription failed: ${teamErr.message}`);
  }

  log('checkout completed', { userId, plan, cycle, founder });
}

async function handleInvoicePaymentFailed(
  supabase: any,
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
    }).then(({ error }: any) => { if (error) log('notif insert err', { err: error.message }); });
  }
  log('invoice.payment_failed processed', { subscriptionId });
}

async function handleInvoicePaid(
  stripe: Stripe,
  supabase: any,
  invoice: Stripe.Invoice,
) {
  // Solo facturamos suscripciones aquí (los packs se facturan en checkout.session.completed).
  const subscriptionId = invoice.subscription as string | null;
  if (!subscriptionId) {
    log('invoice.paid without subscription, skipping', { id: invoice.id });
    return;
  }

  // Recuperar la subscripción para leer metadata (origen, plan, cycle, founder).
  let sub: Stripe.Subscription | null = null;
  try { sub = await stripe.subscriptions.retrieve(subscriptionId); }
  catch (e) { log('subscription retrieve failed', { err: (e as Error).message }); }

  const origen = sub?.metadata?.origen ?? invoice.metadata?.origen;
  if (origen !== 'portal') {
    log('invoice.paid not from portal, skipping Holded', { subscriptionId, origen });
    return;
  }

  // El Price de la suscripción manda sobre la metadata: tras un cambio de plan
  // en el portal de Stripe la metadata puede llegar aún con el plan antiguo
  // (customer.subscription.updated y invoice.paid no tienen orden garantizado).
  const subPriceId = sub?.items?.data?.[0]?.price?.id ?? null;
  const priceInfo = subPriceId ? lookupPrice(subPriceId) : null;
  const plan = (priceInfo?.plan ?? sub?.metadata?.plan ?? '') as string;
  const cycle = (priceInfo?.cycle ?? sub?.metadata?.cycle ?? 'monthly') as string;
  const founder = priceInfo?.founder ?? (sub?.metadata?.founder === 'true');
  const userId = (sub?.metadata?.user_id as string | undefined) ?? null;
  const isPlanChange = invoice.billing_reason === 'subscription_update';

  const planLabel = plan === 'plus' ? 'Plus' : plan === 'equipo' ? 'Equipo' : plan;
  const cycleLabel = cycle === 'yearly' ? 'anual' : 'mensual';
  const concept = `Suscripción portal farmapro · Plan ${planLabel} (${cycleLabel}${founder ? ', precio fundador' : ''})${isPlanChange ? ' · cambio de plan, diferencia prorrateada' : ''}`;

  const total = ((invoice.amount_paid ?? invoice.amount_due ?? 0) / 100);
  // Periodos de cortesía (grants) y prorrateos a cero: Stripe emite una
  // factura de 0,00 € que no genera ingreso. No se inserta fila en
  // portal_holded_invoices, no se crea documento en Holded y no se envía
  // correo (evita documentos numerados tipo F260487 a 0,00 €).
  if (total === 0) {
    log('zero-amount invoice, skipping Holded (no document, no email)', {
      invoiceId: invoice.id,
      subscriptionId,
      billingReason: invoice.billing_reason,
    });
    return;
  }

  // Referidos: nunca debe bloquear Holded ni provocar reintentos de Stripe.
  try {
    await processReferralRewards(stripe, supabase, userId, subscriptionId);
  } catch (e) {
    log('referral processing failed', { userId, subscriptionId, err: (e as Error).message });
  }

  const email = invoice.customer_email
    ?? invoice.customer_address?.line1  // fallback (raro)
    ?? '';

  // Datos del perfil para nombre/CIF.
  let name: string | null = null;
  let cif: string | null = null;
  let profEmail: string | null = null;
  if (userId) {
    const { data: prof } = await supabase.from('profiles')
      .select('full_name, cif, email').eq('id', userId).maybeSingle();
    name = (prof as any)?.full_name ?? null;
    cif = (prof as any)?.cif ?? null;
    profEmail = (prof as any)?.email ?? null;
  }

  // Stripe manda en la propia factura lo que el cliente rellenó en el
  // checkout. Si el perfil no tenía NIF o nombre, este es el bueno.
  const invAny = invoice as any;
  const stripeCif = invAny.customer_tax_ids?.[0]?.value ?? null;
  const stripeName = invAny.customer_name ?? null;
  cif = cif ?? stripeCif;
  name = name ?? stripeName;
  await backfillFiscalData(supabase, userId, stripeCif, stripeName);

  await createHoldedInvoice({
    sourceId: invoice.id,
    sourceType: 'stripe_invoice',
    userId,
    email: profEmail ?? (email as string),
    name,
    cif,
    address: toStripeAddress(invAny.customer_address),
    concept,
    totalEur: total,
    meta: { plan, cycle, founder, subscription_id: subscriptionId, origen: 'portal' },
  });

  log('invoice.paid processed', { invoiceId: invoice.id, subscriptionId, plan, cycle, founder });
}



async function handleSubscriptionChange(
  stripe: Stripe,
  supabase: any,
  sub: Stripe.Subscription,
  eventType: string,
) {
  const subscriptionId = sub.id;

  // Buscar user_id de nuestra fila.
  const { data: row } = await supabase
    .from('subscriptions').select('user_id')
    .eq('stripe_subscription_id', subscriptionId).maybeSingle();

  // Filtro suave: si no lleva metadata de portal y tampoco tenemos fila, no es nuestra.
  if (sub.metadata?.origen !== 'portal' && !row) {
    log('subscription not from portal and unknown, skipping', { subscriptionId, origen: sub.metadata?.origen });
    return;
  }

  // Estado crudo de Stripe (para lógica) y estado mapeado al enum (para BD).
  let rawStatus: string = sub.status; // active | past_due | canceled | unpaid | trialing | ...
  if (eventType === 'customer.subscription.deleted') rawStatus = 'canceled';
  const dbStatus = toDbStatus(rawStatus);

  const { error: subUpdErr } = await supabase.from('subscriptions').update({
    status: dbStatus,
    current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
    current_period_end:   sub.current_period_end   ? new Date(sub.current_period_end   * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', subscriptionId);
  if (subUpdErr) throw new Error(`subscriptions update failed: ${subUpdErr.message}`);

  if (!row?.user_id) {
    log('subscription change without user row', { subscriptionId });
    return;
  }

  // Determinar rol resultante a partir del Price ID (si sigue activo).
  const priceId = sub.items.data[0]?.price.id;
  const priceInfo = priceId ? lookupPrice(priceId) : null;
  const willDowngrade = ['canceled', 'unpaid', 'incomplete_expired'].includes(rawStatus);

  // Cargar perfil para respetar admin.
  const { data: profile } = await supabase.from('profiles')
    .select('subscription_role, plan_comp_until').eq('id', row.user_id).maybeSingle();
  const currentRole = (profile as any)?.subscription_role as string | undefined;

  if (currentRole && (PROTECTED_ROLES as readonly string[]).includes(currentRole)) {
    log('skipping downgrade for protected role', { userId: row.user_id, role: currentRole });
    return;
  }

  // Premio de la Rebotica en curso ("1 mes de Equipo" sobre un Plus de pago):
  // el rol lo gestiona el cron rebotica-comp-expire hasta plan_comp_until. Una
  // renovación mensual NO debe pisarlo (cancelación/impago sí, más abajo).
  const compUntil = profile?.plan_comp_until ? new Date(profile.plan_comp_until as string) : null;
  if (compUntil && compUntil.getTime() > Date.now() && !['canceled', 'unpaid', 'incomplete_expired'].includes(rawStatus)) {
    log('skipping role sync: rebotica comp active', { userId: row.user_id, role: currentRole, until: compUntil.toISOString() });
    return;
  }

  let newRole: string;
  let newProfileStatus: string;
  if (willDowngrade) {
    newRole = 'freemium';
    newProfileStatus = 'canceled';
  } else if (priceInfo) {
    newRole = priceInfo.plan;
    newProfileStatus = rawStatus === 'active' ? 'active' : dbStatus;
  } else {
    // Sin info de price → solo actualizar estado, no tocar rol.
    const { error: profStatusErr } = await supabase.from('profiles').update({
      subscription_status: dbStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', row.user_id);
    if (profStatusErr) throw new Error(`profile status update failed: ${profStatusErr.message}`);
    return;
  }

  // Cambio de plan (Plus ⇄ Equipo, mensual ⇄ anual) hecho desde el portal de
  // Stripe: la fila de subscriptions y la metadata de Stripe seguían diciendo
  // el plan de la compra original. El Price es la verdad; se sincroniza todo.
  if (priceInfo && !willDowngrade) {
    const { error: planErr } = await supabase.from('subscriptions').update({
      plan_id: priceInfo.plan,
      plan_name: priceInfo.plan,
      cycle: priceInfo.cycle,
      is_founder: priceInfo.founder,
      updated_at: new Date().toISOString(),
    }).eq('stripe_subscription_id', subscriptionId);
    if (planErr) throw new Error(`subscriptions plan sync failed: ${planErr.message}`);

    const meta = sub.metadata ?? {};
    if (meta.plan !== priceInfo.plan || meta.cycle !== priceInfo.cycle || meta.founder !== String(priceInfo.founder)) {
      try {
        await stripe.subscriptions.update(subscriptionId, {
          metadata: { ...meta, origen: 'portal', plan: priceInfo.plan, cycle: priceInfo.cycle, founder: String(priceInfo.founder) },
        });
        log('subscription metadata synced to price', { subscriptionId, plan: priceInfo.plan, cycle: priceInfo.cycle });
      } catch (e) {
        log('subscription metadata sync failed', { err: (e as Error).message });
      }
    }
  }

  // Salir de Equipo (cancelación o downgrade a otro plan): desactivar el equipo
  // ANTES de degradar al titular, para que los miembros pierdan el acceso.
  if (currentRole === 'equipo' && newRole !== 'equipo') {
    const { error: deactivateErr } = await supabase.rpc('deactivate_team_for_owner', { p_owner: row.user_id });
    if (deactivateErr) log('deactivate_team_for_owner error', { err: deactivateErr.message });
  }

  const { error: profFinalErr } = await supabase.from('profiles').update({
    subscription_role: newRole,
    subscription_status: newProfileStatus,
    updated_at: new Date().toISOString(),
  }).eq('id', row.user_id);
  if (profFinalErr) throw new Error(`profile role update failed: ${profFinalErr.message}`);

  // Entrar en Equipo por cambio de plan (no por checkout): crear o reactivar
  // el equipo del titular igual que hace checkout.session.completed.
  if (newRole === 'equipo' && currentRole !== 'equipo') {
    const { error: teamErr } = await supabase.rpc('ensure_team_subscription', {
      p_owner: row.user_id,
      p_stripe_subscription_id: subscriptionId,
    });
    if (teamErr) throw new Error(`ensure_team_subscription failed: ${teamErr.message}`);
    log('team ensured after plan change', { userId: row.user_id });
  }

  log('subscription change applied', { userId: row.user_id, newRole, rawStatus, dbStatus });
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toDbStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active': return 'active';
    case 'trialing': return 'trialing';
    case 'past_due':
    case 'incomplete': return 'past_due';
    case 'unpaid':
    case 'incomplete_expired': return 'expired';
    case 'canceled':
    case 'paused': return 'canceled';
    default: return 'expired';
  }
}


// =====================================================================
// Referidos del portal (07-10-2026). Ver docs/spec-referidos-portal-2026-10-07.md.
// =====================================================================
const REFERRAL_COUPON = 'REFERIDO-1MES';
const REFERRAL_TRIAL_DAYS = 30;

async function processReferralRewards(
  stripe: Stripe,
  supabase: any,
  userId: string | null,
  subscriptionId: string | null,
) {
  if (!userId) return;

  // 1. Primera factura pagada de la invitada (atómico e idempotente).
  const { data: marked, error: markErr } = await supabase
    .from('portal_referrals')
    .update({ paid_at: new Date().toISOString() })
    .eq('referred_id', userId)
    .is('paid_at', null)
    .eq('reward_status', 'pendiente')
    .select('id, referrer_id');
  if (markErr) throw new Error(`mark paid failed: ${markErr.message}`);
  for (const row of (marked ?? []) as Array<{ id: string; referrer_id: string }>) {
    log('referral paid', { referralId: row.id, referredId: userId, referrerId: row.referrer_id, subscriptionId });
    await rewardReferrer(stripe, supabase, row.referrer_id, row.id);
  }

  // 2. Premio pendiente más antiguo de quien paga ahora (uno por factura).
  const { data: pending, error: pendErr } = await supabase
    .from('portal_referrals')
    .select('id')
    .eq('referrer_id', userId)
    .eq('reward_status', 'pendiente')
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: true })
    .limit(1);
  if (pendErr) throw new Error(`pending lookup failed: ${pendErr.message}`);
  const oldest = (pending ?? [])[0] as { id: string } | undefined;
  if (oldest) await rewardReferrer(stripe, supabase, userId, oldest.id);
}

async function rewardReferrer(stripe: Stripe, supabase: any, referrerId: string, referralId: string) {
  // a. Cupo anual.
  const { data: quota, error: quotaErr } = await supabase.rpc('portal_referral_quota_left', { p_referrer: referrerId });
  if (quotaErr) throw new Error(`quota rpc failed: ${quotaErr.message}`);
  if (Number(quota ?? 0) <= 0) {
    await supabase.from('portal_referrals')
      .update({ reward_status: 'descartado', motivo_descarte: 'tope_anual' })
      .eq('id', referralId);
    log('referral quota reached', { referralId, referrerId });
    return;
  }

  // b. Suscripción que recibe el premio.
  let subId: string | null = null;
  const { data: ownSub } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', referrerId)
    .in('status', ['active', 'trialing'])
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  subId = (ownSub?.stripe_subscription_id as string | null) ?? null;

  if (!subId) {
    const { data: member } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', referrerId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    if (member?.team_id) {
      const { data: team } = await supabase
        .from('team_subscriptions')
        .select('stripe_subscription_id, status')
        .eq('id', member.team_id)
        .maybeSingle();
      if (team?.status === 'active' && team.stripe_subscription_id) subId = team.stripe_subscription_id as string;
    }
  }

  // c. Cupón sobre la suscripción.
  if (subId) {
    const sub = await stripe.subscriptions.retrieve(subId);
    const anySub = sub as any;
    const hasDiscount = !!anySub.discount || (Array.isArray(anySub.discounts) && anySub.discounts.length > 0);
    if (hasDiscount) {
      log('referral reward pending', { referralId, referrerId, subId, reason: 'subscription_has_discount' });
      return;
    }
    try {
      await stripe.coupons.retrieve(REFERRAL_COUPON);
    } catch (e) {
      if ((e as any)?.code === 'resource_missing') {
        await stripe.coupons.create({
          id: REFERRAL_COUPON, percent_off: 100, duration: 'once', name: 'Invitación farmapro: 1 mes gratis',
        });
      } else {
        throw e;
      }
    }
    await stripe.subscriptions.update(subId, { coupon: REFERRAL_COUPON });
    await supabase.from('portal_referrals').update({
      reward_status: 'aplicado', reward_kind: 'cupon', reward_ref: subId, rewarded_at: new Date().toISOString(),
    }).eq('id', referralId);
    log('referral reward applied', { referralId, referrerId, kind: 'cupon', subId });
    return;
  }

  // d. Prueba gratuita vigente: +30 días.
  const { data: authData } = await supabase.auth.admin.getUserById(referrerId);
  const createdAt = authData?.user?.created_at as string | undefined;
  const { data: prof } = await supabase.from('profiles').select('trial_ends_at').eq('id', referrerId).maybeSingle();
  if (createdAt) {
    const trialEnd = Math.max(
      new Date(createdAt).getTime() + 30 * 86_400_000,
      prof?.trial_ends_at ? new Date(prof.trial_ends_at).getTime() : 0,
    );
    if (trialEnd > Date.now()) {
      const newEnd = new Date(trialEnd + REFERRAL_TRIAL_DAYS * 86_400_000).toISOString();
      const { error: profErr } = await supabase.from('profiles').update({ trial_ends_at: newEnd }).eq('id', referrerId);
      if (profErr) throw new Error(`trial extend failed: ${profErr.message}`);
      await supabase.from('portal_referrals').update({
        reward_status: 'aplicado', reward_kind: 'prueba', reward_ref: newEnd, rewarded_at: new Date().toISOString(),
      }).eq('id', referralId);
      log('referral reward applied', { referralId, referrerId, kind: 'prueba', newEnd });
      return;
    }
  }

  // e. Queda pendiente hasta que R pague.
  log('referral reward pending', { referralId, referrerId, reason: 'no_subscription_no_trial' });
}
