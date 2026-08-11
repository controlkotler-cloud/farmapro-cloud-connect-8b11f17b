import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_resources",
  title: "Listar recursos",
  description:
    "Lista los recursos descargables publicados (guías, checklists, plantillas) del portal farmapro, con búsqueda opcional.",
  inputSchema: {
    search: z.string().trim().max(100).optional().describe("Texto a buscar en el título del recurso."),
    category: z.string().trim().max(50).optional().describe("Categoría del recurso."),
    limit: z.number().int().min(1).max(50).default(20).describe("Número máximo de recursos a devolver."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("resources")
      .select("id, slug, title, description, category, type, format, is_premium, downloads_count")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);

    if (category) query = query.eq("category", category.replace(/[,()]/g, ""));
    if (search) query = query.ilike("title", `%${search.replace(/[%,()]/g, "")}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { resources: data ?? [] },
    };
  },
});
