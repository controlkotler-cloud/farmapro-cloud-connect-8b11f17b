// =====================================================================
// Helper Holded para el portal farmapro.
// Espeja el patrón del proyecto hermano farmapro-direct:
//  1) inserta fila en public.portal_holded_invoices con status 'pending'
//     (ignore-duplicates por source_id → si ya existía, hace SKIP).
//  2) POST https://api.holded.com/api/invoicing/v1/documents/invoice
//     header 'key'=HOLDED_API_KEY; contacto auto por email (usa CIF si existe).
//     IVA 21% INCLUIDO en total_eur → base = round(total/1.21, 2),
//     items:[{name:concepto, units:1, subtotal:base, tax:21}].
//  3) update a 'done'+holded_doc_id, o 'error' + error_message.
//  4) la factura se crea YA APROBADA (approveDoc) → Holded le asigna número
//     (docNumber, guardado en holded_doc_number) y se envía por email al
//     cliente con la plantilla HOLDED_MAIL_TEMPLATE_ID (sent_at / send_error).
//     Un fallo al numerar o enviar NO marca error: la factura existe.
//
// El importe entra siempre como total_eur con IVA incluido.
// getHoldedInvoicePdf(docId) devuelve el PDF en base64 (lo usa la edge
// holded-invoice-pdf para la descarga desde Perfil → Facturación).
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const HOLDED_API = 'https://api.holded.com/api/invoicing/v1';

// Dirección fiscal tal y como la devuelve Stripe en customer_details.address
// / invoice.customer_address. Se traduce a billAddress de Holded.
export interface HoldedAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  province?: string | null;
  countryCode?: string | null;   // ISO-2, p.ej. 'ES'
}

export interface HoldedInvoiceInput {
  sourceId: string;               // Stripe invoice.id o checkout session id (unique)
  sourceType: 'stripe_invoice' | 'stripe_checkout_session';
  userId: string | null;
  email: string;
  name?: string | null;
  cif?: string | null;
  address?: HoldedAddress | null;
  concept: string;
  totalEur: number;               // con IVA incluido
  meta?: Record<string, unknown>;
}

export interface HoldedResult {
  status: 'done' | 'skipped' | 'error';
  holdedDocId?: string;
  docNumber?: string;
  sent?: boolean;
  error?: string;
}

const log = (step: string, details?: unknown) => {
  console.log(`[holded] ${step}${details ? ' - ' + JSON.stringify(details) : ''}`);
};

function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );
}

// billAddress de Holded. Devuelve null si no hay ni calle ni CP: mandar un
// objeto vacío no aporta nada y ensucia la ficha.
function toBillAddress(addr?: HoldedAddress | null): Record<string, unknown> | null {
  if (!addr) return null;
  const street = [addr.line1, addr.line2].filter(Boolean).join(', ');
  if (!street && !addr.postalCode) return null;
  return {
    address: street || undefined,
    city: addr.city ?? undefined,
    postalCode: addr.postalCode ?? undefined,
    province: addr.province ?? undefined,
    countryCode: addr.countryCode ?? undefined,
  };
}

async function findOrCreateContact(
  email: string,
  name?: string | null,
  cif?: string | null,
  address?: HoldedAddress | null,
): Promise<string | null> {
  const key = Deno.env.get('HOLDED_API_KEY') ?? '';
  const billAddress = toBillAddress(address);

  // Buscar por email
  try {
    const res = await fetch(`${HOLDED_API}/contacts?email=${encodeURIComponent(email)}`, {
      headers: { 'key': key, 'accept': 'application/json' },
    });
    if (res.ok) {
      const list = await res.json();
      const found = Array.isArray(list) && list.length > 0 ? list[0] : null;
      if (found?.id) {
        // Completar SOLO lo que falte. Nunca pisar datos que ya tiene la ficha:
        // estos contactos los comparte el CRM con farmapro-direct.
        const patch: Record<string, unknown> = {};
        if (cif && !found.code) { patch.code = cif; patch.isperson = false; }
        if (billAddress && !found.billAddress?.address) patch.billAddress = billAddress;
        if (Object.keys(patch).length > 0) {
          try {
            const upd = await fetch(`${HOLDED_API}/contacts/${found.id}`, {
              method: 'PUT',
              headers: { 'key': key, 'content-type': 'application/json', 'accept': 'application/json' },
              body: JSON.stringify(patch),
            });
            log('contact completed', { id: found.id, ok: upd.ok, fields: Object.keys(patch) });
          } catch (e) { log('contact update failed', { err: (e as Error).message }); }
        }
        return found.id;
      }
    }
  } catch (e) { log('contact lookup failed', { err: (e as Error).message }); }

  // Crear
  const body: Record<string, unknown> = {
    name: name || email,
    email,
    type: 'client',
    isperson: !cif,
  };
  if (cif) body.code = cif;
  if (billAddress) body.billAddress = billAddress;

  const res = await fetch(`${HOLDED_API}/contacts`, {
    method: 'POST',
    headers: { 'key': key, 'content-type': 'application/json', 'accept': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    log('contact create failed', { status: res.status, data });
    return null;
  }
  return (data?.id as string) ?? null;
}

export async function createHoldedInvoice(input: HoldedInvoiceInput): Promise<HoldedResult> {
  const sb = admin();
  const key = Deno.env.get('HOLDED_API_KEY') ?? '';
  if (!key) {
    log('missing HOLDED_API_KEY');
    return { status: 'error', error: 'HOLDED_API_KEY not configured' };
  }

  // 1) idempotencia por source_id
  const { data: existing } = await sb.from('portal_holded_invoices')
    .select('id, status, holded_doc_id')
    .eq('source_id', input.sourceId).maybeSingle();
  if (existing) {
    log('already processed, skipping', { sourceId: input.sourceId, status: existing.status });
    return { status: 'skipped', holdedDocId: existing.holded_doc_id ?? undefined };
  }

  const { error: insErr } = await sb.from('portal_holded_invoices').insert({
    source_id: input.sourceId,
    source_type: input.sourceType,
    user_id: input.userId,
    email: input.email,
    concept: input.concept,
    total_eur: input.totalEur,
    status: 'pending',
    meta: input.meta ?? null,
  });
  if (insErr) {
    // Si es unique violation, ya lo procesa otro worker → skip.
    if ((insErr as { code?: string }).code === '23505') {
      log('duplicate insert race, skipping', { sourceId: input.sourceId });
      return { status: 'skipped' };
    }
    log('insert pending row failed', { err: insErr.message });
    return { status: 'error', error: insErr.message };
  }

  // 2) contacto + factura
  try {
    const contactId = await findOrCreateContact(input.email, input.name, input.cif, input.address);
    if (!contactId) throw new Error('holded contact not resolved');

    const base = Math.round((input.totalEur / 1.21) * 100) / 100;
    // Plantilla de documento "farmapro" de Holded (distinta a la de Mkpro):
    // secret HOLDED_DESIGN_ID con el id de la plantilla (24 hex, se lee de la
    // URL al editarla en Holded → Configuración → Plantillas). Sin secret, la
    // factura sale con la plantilla por defecto de la cuenta.
    const designId = (Deno.env.get('HOLDED_DESIGN_ID') ?? '').trim();
    const payload = {
      contactId,
      ...(designId ? { designId } : {}),
      // Factura definitiva desde el primer momento: numerada y contabilizada.
      approveDoc: true,
      desc: input.concept,
      date: Math.floor(Date.now() / 1000),
      notes: `Origen: portal farmapro. Ref: ${input.sourceId}`,
      items: [{
        name: input.concept,
        units: 1,
        subtotal: base,
        tax: 21,
      }],
    };

    const res = await fetch(`${HOLDED_API}/documents/invoice`, {
      method: 'POST',
      headers: { 'key': key, 'content-type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id) {
      const msg = `Holded ${res.status}: ${JSON.stringify(data).slice(0, 400)}`;
      await sb.from('portal_holded_invoices').update({
        status: 'error', error_message: msg, updated_at: new Date().toISOString(),
      }).eq('source_id', input.sourceId);
      log('invoice create failed', { msg });
      return { status: 'error', error: msg };
    }

    await sb.from('portal_holded_invoices').update({
      status: 'done', holded_doc_id: data.id, updated_at: new Date().toISOString(),
    }).eq('source_id', input.sourceId);
    log('invoice done', { sourceId: input.sourceId, holdedDocId: data.id });

    // 3) número de factura (lo asigna Holded al aprobar) y envío por email.
    const docNumber = await fetchDocNumber(key, data.id);
    const send = await sendInvoiceEmail(key, data.id, input.email);
    await sb.from('portal_holded_invoices').update({
      holded_doc_number: docNumber,
      sent_at: send.ok ? new Date().toISOString() : null,
      send_error: send.ok ? null : send.error ?? 'send failed',
      updated_at: new Date().toISOString(),
    }).eq('source_id', input.sourceId);
    log('invoice numbered+sent', { docNumber, sent: send.ok, sendError: send.error });
    return { status: 'done', holdedDocId: data.id, docNumber: docNumber ?? undefined, sent: send.ok };
  } catch (e) {
    const msg = (e as Error).message;
    await sb.from('portal_holded_invoices').update({
      status: 'error', error_message: msg, updated_at: new Date().toISOString(),
    }).eq('source_id', input.sourceId);
    log('exception', { msg });
    return { status: 'error', error: msg };
  }
}

// Número de documento (p. ej. F260484). Holded lo asigna al aprobar; si la
// lectura falla se deja null y se puede completar más tarde.
async function fetchDocNumber(key: string, docId: string): Promise<string | null> {
  try {
    const res = await fetch(`${HOLDED_API}/documents/invoice/${docId}`, {
      headers: { 'key': key, 'accept': 'application/json' },
    });
    if (!res.ok) { log('doc fetch failed', { status: res.status }); return null; }
    const doc = await res.json().catch(() => ({}));
    const n = doc?.docNumber ?? doc?.invoiceNum ?? null;
    return typeof n === 'string' && n.trim() ? n.trim() : null;
  } catch (e) { log('doc fetch exception', { err: (e as Error).message }); return null; }
}

// Envía la factura por email desde Holded (mismo patrón que farmapro-direct).
// HOLDED_MAIL_TEMPLATE_ID = plantilla de correo "farmapro"; sin secret, la
// plantilla por defecto de la cuenta.
async function sendInvoiceEmail(
  key: string, docId: string, email: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!email) return { ok: false, error: 'no email' };
  const mailTemplateId = (Deno.env.get('HOLDED_MAIL_TEMPLATE_ID') ?? '').trim();
  const body: Record<string, string> = { emails: email };
  if (mailTemplateId) body.mailTemplateId = mailTemplateId;
  try {
    const res = await fetch(`${HOLDED_API}/documents/invoice/${docId}/send`, {
      method: 'POST',
      headers: { 'key': key, 'content-type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (data && data.status === 0)) {
      return { ok: false, error: `Holded send ${res.status}: ${JSON.stringify(data).slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

// PDF de la factura en base64 (Holded v1: GET .../pdf → { status, data }).
export async function getHoldedInvoicePdf(docId: string): Promise<{ base64: string } | { error: string }> {
  const key = Deno.env.get('HOLDED_API_KEY') ?? '';
  if (!key) return { error: 'HOLDED_API_KEY not configured' };
  try {
    const res = await fetch(`${HOLDED_API}/documents/invoice/${docId}/pdf`, {
      headers: { 'key': key, 'accept': 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.data) return { error: `Holded pdf ${res.status}: ${JSON.stringify(data).slice(0, 200)}` };
    return { base64: String(data.data) };
  } catch (e) { return { error: (e as Error).message }; }
}
