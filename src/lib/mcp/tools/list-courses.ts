import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_courses",
  title: "Listar cursos",
  description:
    "Lista los cursos de formación publicados en el portal farmapro, con filtro opcional por categoría o búsqueda de texto en el título.",
  inputSchema: {
    search: z.string().trim().max(100).optional().describe("Texto a buscar en el título del curso."),
    category: z.string().trim().max(50).optional().describe("Categoría del curso (por ejemplo: ventas, marketing, gestion)."),
    limit: z.number().int().min(1).max(50).default(20).describe("Número máximo de cursos a devolver."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("courses")
      .select("id, slug, title, description, category, difficulty, duration_hours, is_premium, rating, total_lessons")
      .eq("is_published", true)
      .order("order_index", { ascending: true })
      .limit(limit ?? 20);

    if (category) query = query.eq("category", category.replace(/[,()]/g, ""));
    if (search) query = query.ilike("title", `%${search.replace(/[%,()]/g, "")}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { courses: data ?? [] },
    };
  },
});
