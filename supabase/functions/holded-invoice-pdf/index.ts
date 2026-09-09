// =====================================================================
// holded-invoice-pdf: descarga de una factura del portal desde
// Perfil → Facturación → Mis facturas.
// Body: { id } (portal_holded_invoices.id). Comprueba que la fila es del
// usuario autenticado (user_id, o email si la fila es anterior al user_id)
// y devuelve { pdfBase64, filename } con el PDF que genera Holded.
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getHoldedInvoicePdf } from "../_shared/holded.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "No autenticado" }, 401);
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "No autenticado" }, 401);
    const user = userData.user;

    const { id } = await req.json().catch(() => ({}));
    if (!id || typeof id !== "string") return json({ error: "Falta id" }, 400);

    const { data: row } = await admin.from("portal_holded_invoices")
      .select("id, user_id, email, holded_doc_id, holded_doc_number, status, created_at")
      .eq("id", id).maybeSingle();
    if (!row || row.status !== "done" || !row.holded_doc_id) {
      return json({ error: "Factura no disponible" }, 404);
    }
    const owns = row.user_id === user.id
      || (!row.user_id && !!user.email && row.email?.toLowerCase() === user.email.toLowerCase());
    if (!owns) return json({ error: "Factura no disponible" }, 404);

    const pdf = await getHoldedInvoicePdf(row.holded_doc_id);
    if ("error" in pdf) {
      console.log(`[holded-invoice-pdf] ${pdf.error}`);
      return json({ error: "No se pudo obtener el PDF" }, 502);
    }
    const label = row.holded_doc_number
      ? row.holded_doc_number.replace(/[^A-Za-z0-9_-]/g, "")
      : `portal-${String(row.created_at).slice(0, 10)}`;
    return json({ pdfBase64: pdf.base64, filename: `factura-${label}.pdf` });
  } catch (e) {
    console.log(`[holded-invoice-pdf] exception ${(e as Error).message}`);
    return json({ error: "Error interno" }, 500);
  }
});
