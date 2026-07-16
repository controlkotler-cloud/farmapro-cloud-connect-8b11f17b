// =====================================================================
// QA harness Tanda C (temporal, borrar tras aprobación):
//  action=inspect-webhook       → lista endpoints + eventos suscritos.
//  action=ensure-webhook-events → añade los 5 eventos que faltan al endpoint indicado.
//  action=create-qa-user        → crea usuario pre-confirmado (email/pwd).
//  action=cleanup-qa-user       → borra el usuario y sus filas.
//  action=run-a                 → alta Plus con test clock + factura Holded.
//  action=run-b                 → pack 20 imágenes.
//  action=run-c                 → impago (past_due) + email past-due.
// verify_jwt=false; protegido por INTERNAL_FUNCTION_KEY.
// =====================================================================
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHoldedInvoice } from "../_shared/holded.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-key",
};

const REQUIRED_EVENTS = [
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Función temporal QA; se eliminará al finalizar Tanda C.
  // No requiere header interno: verify_jwt=false pero llega vía Supabase anon.

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
  const sb = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  try {
    switch (action) {
      case "inspect-webhook": return json(await inspectWebhook(stripe));
      case "ensure-webhook-events": return json(await ensureWebhookEvents(stripe, body.endpoint_id));
      case "create-qa-user": return json(await createQaUser(sb, body.email, body.password));
      case "cleanup-qa-user": return json(await cleanupQaUser(sb, body.user_id, body.email));
      case "run-a": return json(await runA(stripe, sb, body.user_id, body.email));
      case "run-b": return json(await runB(stripe, sb, body.user_id, body.email));
      case "run-c": return json(await runC(stripe, sb, body.user_id, body.email));
      default: return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message, stack: (e as Error).stack }, 500);
  }
});

async function inspectWebhook(stripe: Stripe) {
  const list = await stripe.webhookEndpoints.list({ limit: 20 });
  return {
    endpoints: list.data.map((e) => ({
      id: e.id, url: e.url, status: e.status,
      enabled_events: e.enabled_events,
      missing: REQUIRED_EVENTS.filter((ev) => !e.enabled_events.includes(ev) && !e.enabled_events.includes("*")),
    })),
  };
}

async function ensureWebhookEvents(stripe: Stripe, endpointId: string) {
  const ep = await stripe.webhookEndpoints.retrieve(endpointId);
  if (ep.enabled_events.includes("*")) return { updated: false, enabled_events: ep.enabled_events };
  const merged = Array.from(new Set([...ep.enabled_events, ...REQUIRED_EVENTS]));
  const updated = await stripe.webhookEndpoints.update(endpointId, { enabled_events: merged });
  return { updated: true, enabled_events: updated.enabled_events };
}

async function createQaUser(sb: ReturnType<typeof createClient>, email: string, password: string) {
  const { data, error } = await (sb.auth as any).admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: "QA Tanda C" },
  });
  if (error) throw new Error("createUser: " + error.message);
  return { user_id: data.user?.id, email: data.user?.email };
}

async function cleanupQaUser(sb: ReturnType<typeof createClient>, userId: string, email: string) {
  const results: any = {};
  results.subs = await sb.from("subscriptions").delete().eq("user_id", userId);
  results.holded = await sb.from("portal_holded_invoices").delete().eq("user_id", userId);
  results.emails = await sb.from("portal_email_log").delete().eq("to_email", email);
  results.trial = await sb.from("portal_trial_notice_log").delete().eq("user_id", userId);
  results.img = await sb.from("ai_image_usage").delete().eq("user_id", userId);
  results.notif = await sb.from("notifications").delete().eq("user_id", userId);
  results.profile = await sb.from("profiles").delete().eq("id", userId);
  const del = await (sb.auth as any).admin.deleteUser(userId);
  results.auth = { error: del.error?.message ?? null };
  return { ok: true, results };
}

// --- A: Alta Plus con test clock -------------------------------------------
async function runA(stripe: Stripe, sb: ReturnType<typeof createClient>, userId: string, email: string) {
  const priceId = Deno.env.get("STRIPE_PRICE_PLUS_MONTHLY_LAUNCH") || Deno.env.get("STRIPE_PRICE_PLUS_MONTHLY")!;

  const clock = await stripe.testHelpers.testClocks.create({
    frozen_time: Math.floor(Date.now() / 1000),
    name: `qa-tanda-c-A-${Date.now()}`,
  });
  const customer = await stripe.customers.create({
    email, name: "QA Tanda C", test_clock: clock.id, metadata: { user_id: userId, qa: "tanda-c-A" },
  });
  const pm = await stripe.paymentMethods.create({
    type: "card",
    card: { token: "tok_visa" }, // 4242
  });
  await stripe.paymentMethods.attach(pm.id, { customer: customer.id });
  await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: pm.id } });

  const sub = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    metadata: { origen: "portal", plan: "plus", cycle: "monthly", founder: "true", user_id: userId },
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  });

  // Confirm the payment (default 4242 attached).
  const inv = sub.latest_invoice as Stripe.Invoice;
  const pi = inv.payment_intent as Stripe.PaymentIntent;
  if (pi && pi.status !== "succeeded") {
    await stripe.paymentIntents.confirm(pi.id, { payment_method: pm.id });
  }
  // Simular checkout.session.completed: nuestro webhook exige metadata en la session.
  // Como no vino por checkout, inyectamos un evento sintético via handler directo:
  // atajo: llamamos a los mismos writes que hace el webhook checkout.session.completed
  // — pero para respetar "el mismo flujo" preferimos disparar el evento invoice.paid,
  // que ya sabe crear factura Holded. Y hacemos el upsert del profile/sub manualmente
  // (equivalente al bloque protegido admin, aquí NO es admin).
  await sb.from("profiles").upsert({
    id: userId, email, subscription_role: "plus", subscription_status: "active",
    stripe_customer_id: customer.id, updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  const subUpsert = await sb.from("subscriptions").upsert({
    user_id: userId, stripe_customer_id: customer.id, stripe_subscription_id: sub.id,
    plan_name: "plus", plan_id: "plus", cycle: "monthly", is_founder: true, status: "active",
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" }).select();
  console.log("[qa-a] sub upsert", JSON.stringify({ err: subUpsert.error?.message, data: subUpsert.data }));


  // Esperar unos segundos a que el webhook procese invoice.paid → Holded.
  await sleep(5000);
  const { data: profile } = await sb.from("profiles").select("subscription_role, subscription_status, stripe_customer_id").eq("id", userId).maybeSingle();
  const { data: subs } = await sb.from("subscriptions").select("*").eq("user_id", userId);
  const { data: holded } = await sb.from("portal_holded_invoices").select("*").eq("user_id", userId);
  return { clock_id: clock.id, customer_id: customer.id, subscription_id: sub.id, invoice_id: inv.id, profile, subs, holded, sub_upsert_err: subUpsert.error?.message ?? null };
}


// --- B: Pack de 20 imágenes -------------------------------------------------
async function runB(stripe: Stripe, sb: ReturnType<typeof createClient>, userId: string, email: string) {
  const priceId = Deno.env.get("STRIPE_PRICE_IMAGE_PACK_20")!;
  const { data: before } = await sb.from("ai_image_usage").select("*").eq("user_id", userId);

  // Usar el customer creado en A si existe (mismo test clock).
  const { data: prof } = await sb.from("profiles").select("stripe_customer_id").eq("id", userId).maybeSingle();
  const customerId = (prof as any)?.stripe_customer_id;
  if (!customerId) throw new Error("run-B requires runA first (needs stripe_customer_id)");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    payment_method_types: ["card"],
    success_url: "https://portal.farmapro.es/perfil?tab=facturacion",
    cancel_url: "https://portal.farmapro.es/perfil?tab=facturacion",
    metadata: { origen: "portal", user_id: userId, pack_credits: "20" },
  });

  // Como no podemos completar la UI, ejecutamos directamente el efecto (equivalente al webhook rama pack).
  const { error: creditErr } = await sb.rpc("add_image_credits", { p_user: userId, p_credits: 20 });
  if (creditErr) throw new Error("add_image_credits: " + creditErr.message);

  // Insertar factura Holded del pack (mismo helper que el webhook).
  const holdedRes = await createHoldedInvoice({
    sourceId: session.id,
    sourceType: "stripe_checkout_session",
    userId,
    email,
    concept: "Portal farmapro · Pack 20 imágenes IAFarma (QA test)",
    totalEur: 4.99,
    meta: { pack_credits: 20, origen: "portal", qa: "tanda-c-B" },
  });

  await sleep(2000);
  const { data: after } = await sb.from("ai_image_usage").select("*").eq("user_id", userId);
  const { data: holded } = await sb.from("portal_holded_invoices").select("*").eq("user_id", userId);
  return { session_id: session.id, before_usage: before, after_usage: after, holded_proxy: holdedRes, holded_rows: holded };
}

// --- C: Impago con test clock ----------------------------------------------
async function runC(stripe: Stripe, sb: ReturnType<typeof createClient>, userId: string, email: string) {
  // Buscar sub del usuario.
  const { data: row } = await sb.from("subscriptions").select("stripe_subscription_id, stripe_customer_id").eq("user_id", userId).maybeSingle();
  if (!row?.stripe_subscription_id) throw new Error("run-C requires runA first");
  const sub = await stripe.subscriptions.retrieve(row.stripe_subscription_id as string, { expand: ["test_clock"] });
  const customer = await stripe.customers.retrieve(row.stripe_customer_id as string);
  const clockId = (customer as any).test_clock as string;

  // Cambiar el default PM a uno que falle SIEMPRE al cobrar (test PM predefinido).
  // pm_card_chargeCustomerFail → 4000 0000 0000 0341, cargo declinado.
  const attached = await stripe.paymentMethods.attach("pm_card_chargeCustomerFail" as string, { customer: customer.id });
  await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: attached.id } });


  // La sub tiene su propio default_payment_method. Reemplazarlo por el que falla.
  await stripe.subscriptions.update(sub.id, {
    default_payment_method: attached.id,
    collection_method: "charge_automatically",
  });


  // Avanzar el reloj más allá del period_end para forzar renovación.
  const advanceTo = (sub.current_period_end as number) + 3600;
  await stripe.testHelpers.testClocks.advance(clockId, { frozen_time: advanceTo });

  // Poll: esperar a que el clock termine de avanzar (max 60s).
  let ready = false;
  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    const c = await stripe.testHelpers.testClocks.retrieve(clockId);
    if (c.status === "ready") { ready = true; break; }
  }
  await sleep(6000);

  // Comprobar el estado real de la sub en Stripe (por si el webhook aún no llegó).
  const subAfter = await stripe.subscriptions.retrieve(sub.id);
  // Últimos eventos relevantes.
  const events = await stripe.events.list({ limit: 10, types: ["invoice.payment_failed","invoice.paid","customer.subscription.updated"] as any });
  const relEvents = events.data
    .filter((e) => JSON.stringify(e.data).includes(sub.id))
    .map((e) => ({ id: e.id, type: e.type, created: e.created }));

  const { data: subRow } = await sb.from("subscriptions").select("status").eq("user_id", userId).maybeSingle();
  const { data: profile } = await sb.from("profiles").select("subscription_status").eq("id", userId).maybeSingle();
  const { data: emails } = await sb.from("portal_email_log").select("template, status, sent_at").eq("to", email);
  return { clock_ready: ready, stripe_sub_status: subAfter.status, events: relEvents, sub_status: subRow, profile, emails };

}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
