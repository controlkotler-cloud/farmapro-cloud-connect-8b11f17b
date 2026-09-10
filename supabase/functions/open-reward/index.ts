// =====================================================================
// open-reward: abre el cajón de la Rebotica para el usuario autenticado.
//
// - Body: { campaign_id?: uuid, cajon: number, source?: 'welcome'|'reto' }
//   (source default 'welcome').
// - Sin JWT -> 401 { redirect: '/login?modo=registro&c=<campaign_id>&cajon=<n>' }.
// - TODO lo demás (campaña, idempotencia, tier, derecho a apertura extra por
//   reto, sorteo, descuento de stock e INSERT de la apertura) lo hace UNA sola
//   función de BD, `rebotica_open_cajon`, en UNA transacción. Antes eran tres
//   pasos separados: si algo cortaba en medio (un despliegue, un timeout, o el
//   doble clic de un usuario) el stock quedaba consumido sin apertura y el
//   usuario perdía su cajón sin dejar rastro. Postgres ahora lo revierte entero.
// - No dispara email aquí (el email "premio-ganado" lo envía redeem-reward al
//   confirmarse el canje).
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Solo los dos sources que puede pedir una persona. 'quincena', 'aniversario' y 'equipo'
// están en el CHECK de la columna porque los escriben otros caminos (sorteos de equipo y
// de calendario), pero desde que el UNIQUE incluye `source` (10-09-2026) aceptarlos aquí
// regalaba TRES premios extra por campaña a cualquiera con sesión. Un source desconocido
// cae a 'welcome', que es idempotente.
const VALID_SOURCES = ["welcome", "reto"] as const;
type Source = typeof VALID_SOURCES[number];

// Códigos de negocio de rebotica_open_cajon -> [status HTTP, mensaje al usuario].
const BUSINESS_ERRORS: Record<string, [number, string]> = {
  user_invalido: [400, "Usuario inválido"],
  source_invalido: [400, "source inválido"],
  campana_no_encontrada: [404, "Campaña no encontrada"],
  campana_no_activa: [409, "La campaña no está activa"],
  campana_fuera_de_ventana: [409, "La campaña no está en su ventana de apertura"],
  sin_campana_activa: [409, "No hay campaña activa ahora mismo"],
  reto_no_completado: [409, "Todavía no has completado el reto de la semana"],
  sin_stock: [409, "Sin stock de premios disponible ahora mismo"],
};

const log = (step: string, details?: unknown) => {
  console.log(`[open-reward] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  let body: { campaign_id?: string; cajon?: number; source?: Source };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const campaignIdRaw = String(body.campaign_id ?? "").trim();
  const cajon = Number(body.cajon);
  const source: Source = (VALID_SOURCES as readonly string[]).includes(body.source ?? "")
    ? (body.source as Source)
    : "welcome";

  if (campaignIdRaw && !/^[0-9a-f-]{36}$/i.test(campaignIdRaw)) {
    return json({ error: "campaign_id inválido" }, 400);
  }
  if (!Number.isInteger(cajon) || cajon < 1 || cajon > 30) {
    return json({ error: "cajon inválido" }, 400);
  }

  // ---- Auth ----------------------------------------------------------------
  const authHeader = req.headers.get("Authorization");
  const loginRedirect = `/login?modo=registro${campaignIdRaw ? `&c=${encodeURIComponent(campaignIdRaw)}` : ""}&cajon=${cajon}`;
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized", redirect: loginRedirect }, 401);
  }
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) {
    return json({ error: "Unauthorized", redirect: loginRedirect }, 401);
  }
  const user = userData.user;
  log("user", { id: user.id, campaignIdRaw, cajon, source });

  try {
    // ---- Apertura atómica --------------------------------------------------
    const { data, error } = await supabase.rpc("rebotica_open_cajon", {
      _user_id: user.id,
      _campaign_id: campaignIdRaw || null,
      _source: source,
    });
    if (error) {
      // Un error de Postgres NO es un estado de negocio: 500 con el mensaje real.
      log("rpc error", { err: error.message });
      return json({ error: error.message }, 500);
    }

    const result = data as {
      ok?: boolean;
      error?: string;
      already?: boolean;
      campaign_id?: string;
      opening?: {
        id: string;
        opened_at: string;
        expires_at: string;
        redeemed_at: string | null;
        fulfilled_at: string | null;
        reward_type: string;
        source: string;
      } | null;
      prize?: Record<string, unknown> | null;
    } | null;

    if (!result?.ok) {
      const [status, msg] = BUSINESS_ERRORS[result?.error ?? ""] ??
        [500, "No se ha podido abrir el cajón"];
      log("rechazado", { code: result?.error ?? null, status });
      return json({ error: msg }, status);
    }

    log("premio granted", {
      userId: user.id,
      openingId: result.opening?.id,
      already: result.already === true,
    });

    return json({
      ...(result.already ? { already: true } : {}),
      reward_type: result.opening?.reward_type ?? "premio",
      opening_id: result.opening?.id,
      expires_at: result.opening?.expires_at,
      redeemed_at: result.opening?.redeemed_at ?? null,
      prize: result.prize ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { msg });
    return json({ error: msg }, 500);
  }
});
