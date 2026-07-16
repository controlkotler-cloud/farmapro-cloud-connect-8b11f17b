// =====================================================================
// send-portal-email: envía un email transaccional del portal farmapro
// vía la API transaccional de Mailrelay (POST /send_emails).
//
// - Entrada: { template, to, data?, meta? }.
// - From: "Equipo farmapro <somos@farmapro.es>" (dominio ya autenticado).
// - Reintenta 1 vez si falla la llamada HTTP o la respuesta no es 2xx.
// - Deja registro en public.portal_email_log (ok|error).
// - verify_jwt = false: la invocan otras edges con service role, la BD
//   (pg_net desde triggers/cron) y no se expone al cliente.
// =====================================================================

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  renderPortalTemplate,
  type PortalTemplateName,
  type PortalTemplateData,
} from '../_shared/portalEmailTemplates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM_EMAIL = 'somos@farmapro.es';
const FROM_NAME = 'Equipo farmapro';

const VALID_TEMPLATES: PortalTemplateName[] = [
  'bienvenida',
  'fin-prueba',
  'past-due',
  'equipo-invitacion',
  'equipo-plaza-activada',
];

const log = (step: string, details?: unknown) => {
  console.log(`[send-portal-email] ${step}${details ? ' - ' + JSON.stringify(details) : ''}`);
};

interface SendBody {
  template: PortalTemplateName;
  to: string;
  data?: PortalTemplateData;
  meta?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  let body: SendBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { template, to, data, meta } = body ?? ({} as SendBody);

  if (!template || !VALID_TEMPLATES.includes(template)) {
    return json({ error: `Invalid template. Valid: ${VALID_TEMPLATES.join(', ')}` }, 400);
  }
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return json({ error: 'Invalid "to" email' }, 400);
  }

  const mailrelayBase = Deno.env.get('MAILRELAY_API_BASE') ?? '';
  const mailrelayKey = Deno.env.get('MAILRELAY_API_KEY') ?? '';
  if (!mailrelayBase || !mailrelayKey) {
    log('missing Mailrelay secrets');
    await logResult(supabase, {
      template, recipient: to, subject: null, status: 'error',
      mailrelayId: null, error: 'MAILRELAY secrets not configured', attempts: 0, meta,
    });
    return json({ error: 'MAILRELAY secrets not configured' }, 500);
  }

  const rendered = renderPortalTemplate(template, data ?? {});

  const payload = {
    from: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: to }],
    subject: rendered.subject,
    html_part: rendered.html,
    text_part: rendered.text,
  };

  let attempt = 0;
  let lastError = '';
  let mailrelayId: string | null = null;
  let ok = false;

  while (attempt < 2 && !ok) {
    attempt += 1;
    try {
      const res = await fetch(`${mailrelayBase.replace(/\/+$/, '')}/send_emails`, {
        method: 'POST',
        headers: {
          'X-AUTH-TOKEN': mailrelayKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        lastError = `HTTP ${res.status}: ${text.slice(0, 500)}`;
        log('mailrelay non-2xx', { attempt, status: res.status, body: text.slice(0, 300) });
      } else {
        // Mailrelay suele responder { data: { id: ... } } o similar; guardamos lo que venga.
        try {
          const parsed = JSON.parse(text);
          mailrelayId = String(
            parsed?.data?.id ?? parsed?.id ?? parsed?.message_id ?? parsed?.data?.message_id ?? '',
          ) || null;
        } catch { /* respuesta no-JSON, ignorar */ }
        ok = true;
        log('sent', { template, to, attempt, mailrelayId });
      }
    } catch (err) {
      lastError = (err as Error).message;
      log('mailrelay exception', { attempt, err: lastError });
    }
  }

  await logResult(supabase, {
    template,
    recipient: to,
    subject: rendered.subject,
    status: ok ? 'ok' : 'error',
    mailrelayId,
    error: ok ? null : lastError,
    attempts: attempt,
    meta,
  });

  return json(
    ok
      ? { ok: true, mailrelay_id: mailrelayId, attempts: attempt }
      : { ok: false, error: lastError, attempts: attempt },
    ok ? 200 : 502,
  );
});

async function logResult(
  supabase: ReturnType<typeof createClient>,
  row: {
    template: string;
    recipient: string;
    subject: string | null;
    status: 'ok' | 'error';
    mailrelayId: string | null;
    error: string | null;
    attempts: number;
    meta?: Record<string, unknown>;
  },
) {
  try {
    await supabase.from('portal_email_log').insert({
      template: row.template,
      recipient: row.recipient,
      subject: row.subject,
      status: row.status,
      mailrelay_id: row.mailrelayId,
      error: row.error,
      attempts: row.attempts,
      meta: row.meta ?? null,
    });
  } catch (err) {
    log('portal_email_log insert failed', { err: (err as Error).message });
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
