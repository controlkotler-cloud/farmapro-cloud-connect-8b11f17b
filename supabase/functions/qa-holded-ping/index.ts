// Diagnóstico temporal: llama a Holded /contacts?limit=1 y devuelve status + longitud/prefijo de la key.
// NO expone la key. Se borra al terminar la Tanda C.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async () => {
  const raw = Deno.env.get("HOLDED_API_KEY") ?? "";
  const trimmed = raw.trim();
  const info = {
    length: raw.length,
    trimmed_length: trimmed.length,
    has_whitespace_edges: raw !== trimmed,
    has_quotes: /^["']|["']$/.test(raw),
    prefix: trimmed.slice(0, 4),
    suffix: trimmed.slice(-4),
  };
  const res = await fetch("https://api.holded.com/api/invoicing/v1/contacts?limit=1", {
    headers: { "key": trimmed, "accept": "application/json" },
  });
  const body = await res.text();
  return new Response(JSON.stringify({ info, holded_status: res.status, body: body.slice(0, 300) }), {
    headers: { "content-type": "application/json" },
  });
});
