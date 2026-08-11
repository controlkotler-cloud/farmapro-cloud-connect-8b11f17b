import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_progress",
  title: "Mi progreso",
  description:
    "Devuelve el progreso del usuario conectado en el portal farmapro: puntos, nivel, racha e insignias conseguidas.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const [{ data: profile, error: profileError }, { data: badges, error: badgesError }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, pharmacy_name, points, level, streak_days, last_activity_date")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("user_badges")
        .select("earned_at, badges(name, description)")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false }),
    ]);

    const error = profileError ?? badgesError;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const result = { profile: profile ?? null, badges: badges ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});
