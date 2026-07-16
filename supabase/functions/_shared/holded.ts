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
//
// El importe entra siempre como total_eur con IVA incluido.
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const HOLDED_API = 'https://api.holded.com/api/invoicing/v1';

export interface HoldedInvoiceInput {
  sourceId: string;               // Stripe invoice.id o checkout session id (unique)
  sourceType: 'stripe_invoice' | 'stripe_checkout_session';
  userId: string | null;
  email: string;
  name?: string | null;
  cif?: string | null;
  concept: string;
  totalEur: number;               // con IVA incluido
  meta?: Record<string, unknown>;
}

export interface HoldedResult {
  status: 'done' | 'skipped' | 'error';
  holdedDocId?: string;
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

async function findOrCreateContact(email: string, name?: string | null, cif?: string | null): Promise<string | null> {
  const key = Deno.env.get('HOLDED_API_KEY') ?? '';
  // Buscar por email
  try {
    const res = await fetch(`${HOLDED_API}/contacts?email=${encodeURIComponent(email)}`, {
      headers: { 'key': key, 'accept': 'application/json' },
    });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0 && list[0]?.id) return list[0].id;
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
    const contactId = await findOrCreateContact(input.email, input.name, input.cif);
    if (!contactId) throw new Error('holded contact not resolved');

    const base = Math.round((input.totalEur / 1.21) * 100) / 100;
    const payload = {
      contactId,
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
    return { status: 'done', holdedDocId: data.id };
  } catch (e) {
    const msg = (e as Error).message;
    await sb.from('portal_holded_invoices').update({
      status: 'error', error_message: msg, updated_at: new Date().toISOString(),
    }).eq('source_id', input.sourceId);
    log('exception', { msg });
    return { status: 'error', error: msg };
  }
}
