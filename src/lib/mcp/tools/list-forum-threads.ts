import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_forum_threads",
  title: "Listar hilos de la comunidad",
  description:
    "Lista los hilos más recientes del foro de la comunidad farmapro, con búsqueda opcional en el título.",
  inputSchema: {
    search: z.string().trim().max(100).optional().describe("Texto a buscar en el título del hilo."),
    limit: z.number().int().min(1).max(50).default(20).describe("Número máximo de hilos a devolver."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("forum_threads")
      .select("id, title, content, author_display_name, category_id, replies_count, views_count, is_pinned, created_at, last_reply_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);

    if (search) query = query.ilike("title", `%${search.replace(/[%,()]/g, "")}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { threads: data ?? [] },
    };
  },
});
