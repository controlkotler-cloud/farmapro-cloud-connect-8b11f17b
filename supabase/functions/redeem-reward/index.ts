// =====================================================================
// redeem-reward: canjea (marca como usado) una apertura de Rebotica del
// usuario autenticado. Requiere JWT.
//
// Body: { opening_id: uuid, partner_optin?: boolean, partner_optin_texto_version?: string }
//
// - Verifica que la apertura es del usuario y NO está caducada ni canjeada.
// - Si el premio es de partner (prize.partner_id != null), exige
//   partner_optin === true y partner_optin_texto_version (texto de consent
//   mostrado en UI). Escribe fila en consent_ledger (tipo 'partner_optin',
//   source 'canje').
// - Marca redeemed_at = now().
// - Dispara email rebotica-premio-ganado al usuario vía send-portal-email.
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = Deno.env.get("APP_URL") ?? "https://portal.farmapro.es";

const log = (step: string, details?: unknown) => {
  console.log(`[redeem-reward] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
  const user = userData.user;

  let body: { opening_id?: string; partner_optin?: boolean; partner_optin_texto_version?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  const openingId = String(body.opening_id ?? "").trim();
  if (!openingId || !/^[0-9a-f-]{36}$/i.test(openingId)) {
    return json({ error: "opening_id inválido" }, 400);
  }

  try {
    const { data: opening, error: openErr } = await supabase
      .from("rebotica_openings")
      .select("id, user_id, prize_id, redeemed_at, expires_at, opened_at, campaign_id")
      .eq("id", openingId)
      .maybeSingle();
    if (openErr) throw openErr;
    if (!opening) return json({ error: "Apertura no encontrada" }, 404);
    if (opening.user_id !== user.id) return json({ error: "No autorizado" }, 403);
    if (opening.redeemed_at) return json({ error: "Ya canjeado", redeemed_at: opening.redeemed_at }, 409);
    if (new Date(opening.expires_at).getTime() < Date.now()) {
      return json({ error: "El premio ha caducado" }, 410);
    }

    const { data: prize, error: prizeErr } = await supabase
      .from("rebotica_prizes")
      .select("id, titulo, descripcion, partner_id, tipo, caducidad_dias")
      .eq("id", opening.prize_id)
      .single();
    if (prizeErr) throw prizeErr;

    // Si es de partner: exigir opt-in explícito y registrar en consent_ledger.
    if (prize.partner_id) {
      if (body.partner_optin !== true) {
        return json({
          error: "partner_optin_required",
          message: "Este premio es de un partner. Debes aceptar el opt-in para canjearlo.",
        }, 400);
      }
      const textoVersion = (body.partner_optin_texto_version ?? "").trim();
      if (!textoVersion) {
        return json({ error: "Falta partner_optin_texto_version" }, 400);
      }
      const { error: cErr } = await supabase.from("consent_ledger").insert({
        user_id: user.id,
        email: user.email ?? "",
        tipo: "partner_optin",
        texto_version: textoVersion,
        source: "canje",
      });
      if (cErr) log("consent insert failed", { err: cErr.message });
    }

    // Marca canjeado.
    const now = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("rebotica_openings")
      .update({ redeemed_at: now })
      .eq("id", opening.id)
      .is("redeemed_at", null);
    if (updErr) throw updErr;

    // Nombre del usuario para el email.
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    // Dispara email rebotica-premio-ganado (fire-and-forget, no bloquea la respuesta).
    supabase.functions.invoke("send-portal-email", {
      body: {
        template: "rebotica-premio-ganado",
        to: user.email,
        data: {
          nombre: profile?.full_name ?? undefined,
          premioTitulo: prize.titulo,
          premioDescripcion: prize.descripcion ?? undefined,
          esPartner: !!prize.partner_id,
          expiresAt: opening.expires_at,
          canjeUrl: `${APP_URL}/rebotica`,
        },
        meta: { trigger: "redeem-reward", opening_id: opening.id },
      },
    }).catch((e) => log("email dispatch error", { err: (e as Error).message }));

    log("redeemed", { openingId: opening.id, userId: user.id });
    return json({ ok: true, redeemed_at: now, prize });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { msg });
    return json({ error: msg }, 500);
  }
});
