// =====================================================================
// send-portal-email: encola un email transaccional del portal farmapro
// en la cola `transactional_emails`, que despacha `process-email-queue`
// contra la API transaccional de Lovable.
//
// - Entrada: { template, to, data?, meta? }.
// - From: "Portal farmapro <noreply@notify.portal.farmapro.es>"
//   (mismo remitente y dominio que los correos de autenticación).
// - No envía de forma síncrona: ENCOLA. El despachador (cron cada 5 s) se
//   encarga del envío real, del rate limit 429, de hasta 5 reintentos y
//   de la cola de mensajes muertos.
// - Deja registro en public.portal_email_log (ok = encolado | error).
// - verify_jwt = true y, además, solo se aceptan llamadas con service role
//   (otras edges y la BD vía pg_net). Nunca se invoca desde el cliente.
//
// Histórico: hasta el 27-08-2026 esta función enviaba por la API de un
// proveedor externo. Se migró a la infraestructura de cola propia del
// portal, que ya despachaba los correos de autenticación.
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

// Mismo remitente que auth-email-hook: dominio verificado en la API de Lovable.
const SITE_NAME = 'Portal farmapro';
const FROM_DOMAIN = 'notify.portal.farmapro.es';
const SENDER_DOMAIN = 'notify.portal.farmapro.es';
const FROM = `${SITE_NAME} <noreply@${FROM_DOMAIN}>`;

const QUEUE_NAME = 'transactional_emails';

// Salvaguarda anti-bucle, no un límite de proveedor: el volumen real del
// portal son decenas de correos al mes. Si algún día se superan, es que algo
// está disparando envíos en bucle y conviene que se corte solo.
const DAILY_CAP = 2000;

const VALID_TEMPLATES: PortalTemplateName[] = [
  'bienvenida',
  'fin-prueba',
  'past-due',
  'equipo-invitacion',
  'equipo-plaza-activada',
  'rebotica-premio-ganado',
  'rebotica-premio-caduca',
  'rebotica-baul-ganador',
  'rebotica-gordo-ganador',
  'rebotica-aviso-calendario-interno',
  'promocion-solicitud-partner',
  'promocion-solicitud-usuario',
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

  // Solo callers de confianza (otras edges y la BD, siempre con service role).
  // Ningún usuario del portal puede usar esta función como relé de correo.
  const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  let esServiceRole = bearer !== '' && bearer === serviceKey;
  if (!esServiceRole && bearer) {
    try {
      const claims = JSON.parse(atob(bearer.split('.')[1] ?? ''));
      esServiceRole = claims?.role === 'service_role';
    } catch { /* token no JWT */ }
  }
  if (!esServiceRole) {
    log('forbidden caller');
    return json({ error: 'Forbidden' }, 403);
  }

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

  const toLower = to.toLowerCase();

  // A1. Lista de supresión: nunca encolamos hacia direcciones suprimidas.
  const { data: suppressed } = await supabase
    .from('suppressed_emails')
    .select('reason')
    .eq('email', toLower)
    .maybeSingle();

  if (suppressed) {
    log('suppressed recipient', { to: toLower, reason: suppressed.reason });
    await logResult(supabase, {
      template, recipient: to, subject: null, status: 'error',
      messageId: null, error: `suppressed: ${suppressed.reason ?? 'unknown'}`, attempts: 0, meta,
    });
    return json({ ok: false, suppressed: true }, 200);
  }

  // A2. Salvaguarda diaria (ver nota en DAILY_CAP).
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count: sentToday } = await supabase
    .from('portal_email_log')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'ok')
    .gte('created_at', startOfDay.toISOString());

  if ((sentToday ?? 0) >= DAILY_CAP) {
    log('daily cap reached', { sentToday });
    await logResult(supabase, {
      template, recipient: to, subject: null, status: 'error',
      messageId: null, error: 'daily_cap_reached', attempts: 0, meta,
    });
    return json({ ok: false, deferred: true }, 200);
  }

  const rendered = renderPortalTemplate(template, data ?? {});

  // A3. Encolar. El despachador `process-email-queue` (cron cada 5 s) hace el
  // envío real: gestiona el 429 con enfriamiento, reintenta hasta 5 veces y
  // mueve a `transactional_emails_dlq` lo que no sale. Aquí no reintentamos:
  // duplicaría mensajes en la cola.
  // OJO: NO se manda `run_id`. Ese campo identifica una ejecución real de la API de
  // Lovable y solo lo tienen los correos de autenticación, que llegan por un webhook
  // firmado (`auth-email-hook` lo saca del payload verificado). Inventar un UUID hace
  // que la API responda 404 run_not_found y el correo no sale — comprobado el 27-08-2026.
  // Los transaccionales genéricos van sin él, igual que `send-transactional-email` de direct.
  const messageId = crypto.randomUUID();

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: QUEUE_NAME,
    payload: {
      message_id: messageId,
      to,
      from: FROM,
      sender_domain: SENDER_DOMAIN,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      purpose: 'transactional',
      label: template,
      queued_at: new Date().toISOString(),
    },
  });

  const ok = !enqueueError;
  if (ok) {
    log('queued', { template, to, messageId });
  } else {
    log('enqueue failed', { template, to, err: enqueueError.message });
  }

  await logResult(supabase, {
    template,
    recipient: to,
    subject: rendered.subject,
    status: ok ? 'ok' : 'error',
    messageId: ok ? messageId : null,
    error: ok ? null : enqueueError.message,
    attempts: 1,
    meta,
  });

  // A4. Confirmamos el aviso de fin de prueba solo si el mensaje quedó encolado.
  if (ok && (meta as Record<string, unknown> | undefined)?.trigger === 'notify_trial_ending') {
    const m = meta as Record<string, unknown>;
    const { error: noticeErr } = await supabase
      .from('portal_trial_notice_log')
      .update({ sent_at: new Date().toISOString() })
      .eq('user_id', String(m.user_id ?? ''))
      .eq('kind', String(m.kind ?? ''));
    if (noticeErr) log('trial notice confirm failed', { err: noticeErr.message });
  }

  return json(
    ok
      ? { ok: true, queued: true, message_id: messageId }
      : { ok: false, error: enqueueError.message },
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
    messageId: string | null;
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
      message_id: row.messageId,
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
