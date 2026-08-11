import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_events",
  title: "Listar eventos",
  description:
    "Lista los próximos eventos publicados del portal farmapro (formaciones en directo, masterclasses, encuentros).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(10).describe("Número máximo de eventos a devolver."),
    include_past: z.boolean().default(false).describe("Incluir también los eventos ya celebrados."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, include_past }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("events")
      .select("id, title, description, event_type, start_date, end_date, is_online, location, is_premium, registration_url")
      .eq("is_published", true)
      .order("start_date", { ascending: true })
      .limit(limit ?? 10);

    if (!include_past) query = query.gte("start_date", new Date().toISOString());

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { events: data ?? [] },
    };
  },
});
