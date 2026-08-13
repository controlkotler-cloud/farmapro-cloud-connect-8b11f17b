// =====================================================================
// request-promotion: circuito de solicitud de una promoción de partner.
// El cliente solo manda { promotion_id, telefono?, mensaje?, consent }.
// Todo lo demás (identidad, datos de la farmacia, destinatarios, envío)
// se resuelve aquí con service role. El cliente nunca decide a quién se
// escribe ni con qué contenido.
// =====================================================================

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONSENT_VERSION = 'promo-cesion-v1';
const COPIA_INTERNA = 'control@mkpro.es';
const MAX_POR_USUARIO_DIA = 10;

const log = (step: string, details?: unknown) =>
  console.log(`[request-promotion] ${step}${details ? ' - ' + JSON.stringify(details) : ''}`);

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );

  // --- Identidad del solicitante a partir del JWT (nunca del body)
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'No autenticado' }, 401);

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return json({ error: 'No autenticado' }, 401);

  let body: { promotion_id?: string; telefono?: string; mensaje?: string; consent?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Cuerpo no válido' }, 400);
  }

  const promotionId = String(body.promotion_id ?? '').trim();
  if (!promotionId) return json({ error: 'Falta la promoción' }, 400);
  if (body.consent !== true) return json({ error: 'Falta el consentimiento' }, 400);

  const telefono = String(body.telefono ?? '').trim().slice(0, 30);
  const mensaje = String(body.mensaje ?? '').trim().slice(0, 1000);

  // --- Promoción: debe existir, estar activa, vigente y tener partner_email
  const { data: promo, error: promoErr } = await admin
    .from('promotions')
    .select('id, title, company_name, partner_email, is_active, valid_until, discount_details, terms_conditions')
    .eq('id', promotionId)
    .maybeSingle();

  if (promoErr) {
    log('promo lookup error', { err: promoErr.message });
    return json({ error: 'No hemos podido cargar la promoción' }, 500);
  }
  if (!promo || !promo.is_active) return json({ error: 'Promoción no disponible' }, 404);
  if (promo.valid_until && new Date(promo.valid_until as string) < new Date()) {
    return json({ error: 'Esta promoción ya ha caducado' }, 410);
  }
  if (!promo.partner_email) return json({ error: 'Esta promoción no admite solicitudes' }, 400);

  // --- Antifraude simple: una solicitud por promoción y tope diario
  const { data: previa } = await admin
    .from('promotion_requests')
    .select('referencia')
    .eq('user_id', user.id)
    .eq('promotion_id', promotionId)
    .neq('estado', 'rechazada')
    .maybeSingle();

  if (previa) {
    return json({ ok: true, duplicada: true, referencia: previa.referencia }, 200);
  }

  const desde = new Date(Date.now() - 86_400_000).toISOString();
  const { count: hoy } = await admin
    .from('promotion_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', desde);

  if ((hoy ?? 0) >= MAX_POR_USUARIO_DIA) {
    return json({ error: 'Has hecho demasiadas solicitudes hoy. Inténtalo mañana.' }, 429);
  }

  // --- Datos del solicitante: del perfil, nunca del cliente
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email, pharmacy_name, pharmacy_city')
    .eq('id', user.id)
    .maybeSingle();

  const email = (profile?.email ?? user.email ?? '').trim();
  if (!email) return json({ error: 'Tu cuenta no tiene email' }, 400);
  const nombre = (profile?.full_name ?? '').trim();
  const farmacia = (profile?.pharmacy_name ?? '').trim();
  const ciudad = (profile?.pharmacy_city ?? '').trim();
  if (!farmacia || !ciudad) {
    return json({ error: 'Completa el nombre y la ciudad de tu farmacia antes de solicitar la promoción' }, 400);
  }

  // --- Referencia + registro
  const { data: refData, error: refErr } = await admin.rpc('next_promotion_reference');
  if (refErr || !refData) {
    log('reference error', { err: refErr?.message });
    return json({ error: 'No hemos podido registrar la solicitud' }, 500);
  }
  const referencia = String(refData);

  const { error: insertErr } = await admin.from('promotion_requests').insert({
    promotion_id: promo.id,
    user_id: user.id,
    referencia,
    nombre: nombre || email,
    email,
    farmacia: farmacia || null,
    ciudad: ciudad || null,
    telefono: telefono || null,
    mensaje: mensaje || null,
    consent_texto_version: CONSENT_VERSION,
    partner_email: promo.partner_email,
    estado: 'enviada',
  });

  if (insertErr) {
    log('insert error', { err: insertErr.message });
    return json({ error: 'No hemos podido registrar la solicitud' }, 500);
  }

  // --- Emails (partner, copia interna, acuse al usuario)
  const datos = {
    referencia,
    promocionTitulo: promo.title,
    companyName: promo.company_name,
    solicitanteNombre: nombre,
    solicitanteEmail: email,
    solicitanteFarmacia: farmacia,
    solicitanteCiudad: ciudad,
    solicitanteTelefono: telefono,
    mensaje,
    promocionOferta: (promo.discount_details as string | null) ?? '',
    promocionCondiciones: (promo.terms_conditions as string | null) ?? '',
    promocionValidaHasta: (promo.valid_until as string | null) ?? '',
  };

  const enviar = (template: string, to: string, data: Record<string, unknown>) =>
    admin.functions.invoke('send-portal-email', {
      body: { template, to, data, meta: { trigger: 'promotion_request', referencia } },
    });

  const results = await Promise.all([
    enviar('promocion-solicitud-partner', promo.partner_email as string, datos),
    enviar('promocion-solicitud-partner', COPIA_INTERNA, datos),
    enviar('promocion-solicitud-usuario', email, { ...datos, nombre }),
  ]);

  // Solo el envío al partner es crítico: si falla, marcamos para revisión manual.
  const partnerFallo = !!results[0].error;
  if (partnerFallo) {
    log('partner email failed', { referencia, err: results[0].error?.message });
    await admin.from('promotion_requests').update({ estado: 'error_envio' }).eq('referencia', referencia);
  }

  return json({ ok: true, referencia, aviso_enviado: !partnerFallo }, 200);
});
