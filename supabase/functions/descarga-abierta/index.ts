// =====================================================================
// descarga-abierta: firma la descarga GRATUITA de la quincena de Impulso,
// para gente SIN cuenta.
//
// - Body: { slug: string }
// - Devuelve { url } con una URL firmada de 60 segundos, o 403 si la ventana
//   de esa quincena ya se cerró.
// - verify_jwt = false a propósito: la promesa de Impulso desde N1 es que el
//   descargable de la quincena se baja sin crear cuenta y sin dejar datos.
//
// POR QUÉ EXISTE (15-09-2026)
// Los descargables eran ficheros estáticos de public/recursos/, servidos por
// el CDN antes de que existiese React, sesión o RLS. La base de datos decidía
// quién veía el BOTÓN, nunca quién podía bajar el FICHERO: con la URL exacta
// se lo bajaba cualquiera, para siempre, aunque la quincena hubiese cerrado
// hacía meses. Ahora el fichero vive en un bucket privado y esta función es la
// ÚNICA puerta sin sesión que hay, con la ventana comprobada en servidor.
//
// Lo que esta función NO hace, a propósito:
// - No sirve nada premium (`is_premium = true` queda fuera del filtro).
// - No sirve nada sin ventana (`open_until IS NULL` = herramienta de portal,
//   esa pide cuenta desde el primer día, regla Francesc 15-09-2026).
// - No mira nada que venga del cliente salvo el slug. La fecha la pone
//   Postgres con now(), no el navegador.
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Segundos que vive la URL firmada. Lo justo para que el navegador la abra. */
const VIGENCIA_FIRMA = 60;

/** Bucket por defecto para las filas heredadas con file_url "/recursos/x.pdf". */
const BUCKET_POR_DEFECTO = "recursos-portal";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Saca bucket y ruta de un file_url, igual que hace src/lib/descargas.ts. */
const refDeStorage = (fileUrl: string): { bucket: string; path: string } => {
  const enStorage = fileUrl.match(
    /\/storage\/v1\/object\/(?:public\/|sign\/|authenticated\/)?([^/]+)\/(.+)$/,
  );
  if (enStorage) return { bucket: enStorage[1], path: enStorage[2] };
  const limpio = fileUrl.replace(/^\/+/, "");
  if (limpio.startsWith("recursos/")) {
    return { bucket: BUCKET_POR_DEFECTO, path: limpio.slice("recursos/".length) };
  }
  return { bucket: BUCKET_POR_DEFECTO, path: limpio };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  let slug: unknown;
  try {
    ({ slug } = await req.json());
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  if (typeof slug !== "string" || !slug.trim()) {
    return json({ error: "Falta el slug" }, 400);
  }

  // Service role: es quien puede leer la fila y firmar en un bucket privado.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // La ventana la decide Postgres, no el cliente: open_until > now().
  const { data, error } = await supabase
    .from("resources")
    .select("file_url, open_until")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_premium", false)
    .gt("open_until", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("descarga-abierta: error consultando el recurso", error);
    return json({ error: "Error consultando el recurso" }, 500);
  }
  if (!data?.file_url) {
    // Mismo mensaje para "no existe", "cerrada" y "no es gratis": no interesa
    // que desde fuera se pueda distinguir un caso de otro.
    return json(
      { error: "Esta descarga no está disponible sin cuenta. Está dentro del portal." },
      403,
    );
  }

  const { bucket, path } = refDeStorage(data.file_url);
  const { data: firma, error: errorFirma } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, VIGENCIA_FIRMA);

  if (errorFirma || !firma?.signedUrl) {
    console.error("descarga-abierta: no se pudo firmar", { bucket, path, errorFirma });
    return json({ error: "No se pudo preparar la descarga" }, 500);
  }

  return json({ url: firma.signedUrl });
});
