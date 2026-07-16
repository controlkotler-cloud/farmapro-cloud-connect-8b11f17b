// =====================================================================
// open-reward: abre el cajón de la Rebotica para el usuario autenticado.
//
// - Body: { campaign_id: uuid, cajon: number, source?: 'welcome'|'quincena'|
//   'aniversario'|'equipo'|'reto' } (source default 'welcome').
// - Sin JWT -> 401 { redirect: '/login?modo=registro&c=<campaign_id>&cajon=<n>' }.
// - Valida campaña activa y en rango de fechas.
// - Idempotente: UNIQUE(user_id, campaign_id). Si ya abrió, devuelve el premio.
// - Sorteo ponderado por peso entre premios con stock_restante>0 y tier
//   ('todos' o el del usuario). Solo peso>0 (los peso=0 los reserva el cron
//   de calendario). Decremento ATÓMICO vía RPC rebotica_pick_and_consume_prize.
// - No dispara email aquí (el email "premio-ganado" lo envía redeem-reward
//   al confirmarse el canje).
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_SOURCES = ["welcome", "quincena", "aniversario", "equipo", "reto"] as const;
type Source = typeof VALID_SOURCES[number];

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
    // ---- Campaña activa y en rango ----------------------------------------
    const today = new Date().toISOString().slice(0, 10);
    let campaign: { id: string; estado: string; quincena_inicio: string; quincena_fin: string } | null = null;

    if (campaignIdRaw) {
      const { data } = await supabase
        .from("rebotica_campaigns")
        .select("id, estado, quincena_inicio, quincena_fin")
        .eq("id", campaignIdRaw)
        .maybeSingle();
      campaign = data;
      if (!campaign) return json({ error: "Campaña no encontrada" }, 404);
      if (campaign.estado !== "activa") {
        return json({ error: "La campaña no está activa" }, 409);
      }
      if (campaign.quincena_inicio > today || campaign.quincena_fin < today) {
        return json({ error: "La campaña no está en su ventana de apertura" }, 409);
      }
    } else {
      // Sin campaign_id: resuelve la campaña activa cuya ventana incluye hoy;
      // si hubiera varias, la de quincena_inicio más reciente.
      const { data } = await supabase
        .from("rebotica_campaigns")
        .select("id, estado, quincena_inicio, quincena_fin")
        .eq("estado", "activa")
        .lte("quincena_inicio", today)
        .gte("quincena_fin", today)
        .order("quincena_inicio", { ascending: false })
        .limit(1)
        .maybeSingle();
      campaign = data;
      if (!campaign) return json({ error: "No hay campaña activa ahora mismo" }, 409);
    }

    // ---- Idempotencia ------------------------------------------------------
    const { data: existing } = await supabase
      .from("rebotica_openings")
      .select("id, prize_id, opened_at, expires_at, redeemed_at")
      .eq("user_id", user.id)
      .eq("campaign_id", campaign.id)
      .maybeSingle();

    if (existing) {
      const { data: prize } = await supabase
        .from("rebotica_prizes")
        .select("id, titulo, descripcion, tipo, valor_percibido_eur, partner_id")
        .eq("id", existing.prize_id)
        .maybeSingle();
      return json({
        already: true,
        reward_type: "premio",
        opening_id: existing.id,
        expires_at: existing.expires_at,
        redeemed_at: existing.redeemed_at,
        prize,
      });
    }

    // ---- Tier del usuario --------------------------------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_role")
      .eq("id", user.id)
      .maybeSingle();

    const { data: memberRow } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const role = profile?.subscription_role ?? "freemium";
    const tier: "gratis" | "plus" | "equipo" =
      memberRow || role === "equipo"
        ? "equipo"
        : role === "freemium"
        ? "gratis"
        : "plus";
    log("tier", { tier, role, hasTeam: !!memberRow });

    // ---- Sorteo ponderado + decremento atómico (reintentos por carrera) ---
    let prizeId: string | null = null;
    for (let attempt = 0; attempt < 5 && !prizeId; attempt++) {
      const { data, error } = await supabase.rpc("rebotica_pick_and_consume_prize", {
        p_campaign_id: campaign.id,
        p_tier: tier,
      });
      if (error) {
        log("rpc error", { attempt, err: error.message });
        break;
      }
      prizeId = (data as string | null) ?? null;
      if (prizeId) break;
    }
    if (!prizeId) {
      return json({ error: "Sin stock de premios disponible ahora mismo" }, 409);
    }

    // ---- Insert opening ----------------------------------------------------
    const { data: prize, error: prizeErr } = await supabase
      .from("rebotica_prizes")
      .select("id, titulo, descripcion, tipo, valor_percibido_eur, caducidad_dias, partner_id")
      .eq("id", prizeId)
      .single();
    if (prizeErr) throw prizeErr;

    const caducidadDias = prize.caducidad_dias ?? 7;
    const expiresAt = new Date(Date.now() + caducidadDias * 86_400_000).toISOString();

    const { data: opening, error: openErr } = await supabase
      .from("rebotica_openings")
      .insert({
        user_id: user.id,
        campaign_id: campaign.id,
        prize_id: prizeId,
        expires_at: expiresAt,
        source,
      })
      .select("id, expires_at")
      .single();
    if (openErr) throw openErr;

    log("premio granted", { userId: user.id, prizeId, openingId: opening.id });
    return json({
      opening_id: opening.id,
      expires_at: opening.expires_at,
      prize,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { msg });
    return json({ error: msg }, 500);
  }
});
