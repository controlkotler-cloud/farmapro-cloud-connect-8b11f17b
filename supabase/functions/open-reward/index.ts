// =====================================================================
// open-reward: abre el cajón de la campaña activa para el usuario.
//
// - Titular de un equipo (o cuenta sin equipo, individual): sorteo real de
//   rebotica_prizes vía rebotica_pick_and_consume_prize (ponderado, con
//   stock, respeta el tier).
// - Miembro de un equipo que NO es el titular: sin premio directo — genera
//   1 participación por sorteo activo (El Baúl mensual, El Gordo trimestral)
//   para la farmacia (team_subscription_id), no para el usuario individual.
//   Decisión de producto 16-07-2026: el cajón con premio es 1 por farmacia.
//
// Idempotente: rebotica_openings tiene UNIQUE(user_id, campaign_id) — si ya
// abrió, devuelve lo que ya ganó en vez de volver a sortear.
// verify_jwt = true (default): requiere sesión, la lee del Authorization.
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  console.log(`[open-reward] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
};

const DEFAULT_EXPIRES_DAYS = 7;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;
    log("user", { id: user.id });

    // Campaña activa (asume 1 activa a la vez; si hay varias, la más reciente).
    const { data: campaign, error: campErr } = await supabase
      .from("rebotica_campaigns")
      .select("id")
      .eq("estado", "activa")
      .order("quincena_inicio", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (campErr) throw campErr;
    if (!campaign) return json({ error: "No hay ninguna campaña activa ahora mismo" }, 404);

    // Idempotencia: ¿ya abrió esta campaña?
    const { data: existing } = await supabase
      .from("rebotica_openings")
      .select("id, reward_type, prize_id")
      .eq("user_id", user.id)
      .eq("campaign_id", campaign.id)
      .maybeSingle();
    if (existing) {
      log("already opened", { openingId: existing.id });
      if (existing.reward_type === "premio" && existing.prize_id) {
        const { data: prize } = await supabase
          .from("rebotica_prizes")
          .select("titulo, descripcion, tipo, valor_percibido_eur")
          .eq("id", existing.prize_id)
          .maybeSingle();
        return json({ already: true, reward_type: "premio", prize });
      }
      return json({
        already: true,
        reward_type: "participacion",
        message: "Ya has abierto tu cajón de esta quincena: le diste una participación más a tu farmacia.",
      });
    }

    // Rol de equipo: ¿titular, miembro, o sin equipo?
    const { data: ownedTeam } = await supabase
      .from("team_subscriptions")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    let teamSubscriptionId: string | null = ownedTeam?.id ?? null;
    let isMemberNotOwner = false;

    if (!ownedTeam) {
      const { data: memberRow } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (memberRow) {
        teamSubscriptionId = memberRow.team_id;
        isMemberNotOwner = true;
      }
    }
    log("team role", { teamSubscriptionId, isMemberNotOwner });

    if (isMemberNotOwner) {
      const { data: opening, error: openErr } = await supabase
        .from("rebotica_openings")
        .insert({
          user_id: user.id,
          campaign_id: campaign.id,
          prize_id: null,
          reward_type: "participacion",
          team_subscription_id: teamSubscriptionId,
          expires_at: new Date(Date.now() + DEFAULT_EXPIRES_DAYS * 86_400_000).toISOString(),
          source: "equipo",
        })
        .select("id")
        .single();
      if (openErr) throw openErr;

      const now = new Date();
      const periodoBaul = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
      const periodoGordo = `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;

      const { error: partErr } = await supabase.from("rebotica_participaciones").insert([
        {
          team_subscription_id: teamSubscriptionId,
          user_id: user.id,
          opening_id: opening.id,
          sorteo_tipo: "baul",
          periodo: periodoBaul,
        },
        {
          team_subscription_id: teamSubscriptionId,
          user_id: user.id,
          opening_id: opening.id,
          sorteo_tipo: "gordo",
          periodo: periodoGordo,
        },
      ]);
      if (partErr) log("participaciones insert error (opening ya se guardó)", { err: partErr.message });

      log("participacion granted", { userId: user.id, teamSubscriptionId });
      return json({
        reward_type: "participacion",
        message: "Le has dado a tu farmacia 1 participación más para El Baúl y El Gordo de esta temporada.",
      });
    }

    // Titular de equipo, o cuenta individual: sorteo real de premio.
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_role")
      .eq("id", user.id)
      .maybeSingle();
    const tier = teamSubscriptionId ? "equipo" : profile?.subscription_role === "freemium" ? "gratis" : "plus";

    const { data: prizeId, error: pickErr } = await supabase.rpc("rebotica_pick_and_consume_prize", {
      p_campaign_id: campaign.id,
      p_tier: tier,
    });
    if (pickErr) throw pickErr;
    if (!prizeId) return json({ error: "Sin stock de premios disponible ahora mismo, inténtalo más tarde" }, 409);

    const { data: prize, error: prizeErr } = await supabase
      .from("rebotica_prizes")
      .select("titulo, descripcion, tipo, valor_percibido_eur, caducidad_dias")
      .eq("id", prizeId)
      .single();
    if (prizeErr) throw prizeErr;

    const { error: openErr2 } = await supabase.from("rebotica_openings").insert({
      user_id: user.id,
      campaign_id: campaign.id,
      prize_id: prizeId,
      reward_type: "premio",
      team_subscription_id: teamSubscriptionId,
      expires_at: new Date(Date.now() + (prize.caducidad_dias ?? DEFAULT_EXPIRES_DAYS) * 86_400_000).toISOString(),
      source: teamSubscriptionId ? "equipo" : "quincena",
    });
    if (openErr2) throw openErr2;

    log("premio granted", { userId: user.id, prizeId });
    return json({ reward_type: "premio", prize });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { msg });
    return json({ error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
