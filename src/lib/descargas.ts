import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// Entrega de los ficheros de `resources`. Punto único: nadie más construye
// la URL de una descarga.
//
// POR QUÉ EXISTE ESTE FICHERO (15-09-2026)
// Hasta hoy los descargables no premium eran ficheros estáticos de
// `public/recursos/`. Eso los servía el CDN ANTES de que existiese React,
// sesión o RLS: la base de datos decidía quién veía el BOTÓN, nunca quién
// podía bajar el FICHERO. Con la URL exacta se los bajaba cualquiera sin
// cuenta, y la URL no era ni secreta (la landing pública /descarga/:slug lee
// `file_url` con la anon key, así que estaba a un vistazo de distancia).
//
// Regla de Francesc, 15-09-2026: "los recursos deben tener el límite de que es
// una cuenta creada". Así que ahora los ficheros viven en un bucket PRIVADO de
// Storage y solo salen por URL firmada de 60 segundos. Publicar una de esas
// URLs no sirve de nada: cuando alguien la abra, ya ha caducado.
//
// Dos caminos, y solo dos:
//  · CON sesión  -> `urlFirmada`: firma el propio cliente contra Storage. La
//    política del bucket firma a `authenticated`, sin mirar el plan: la cuenta
//    gratuita basta, que es justo la regla. Quién puede pedirlo (topes del
//    plan gratis, premium, premios de la Rebotica) lo sigue decidiendo
//    Recursos.tsx ANTES de llamar aquí.
//  · SIN sesión  -> `urlAbierta`: solo la landing /descarga/:slug, y la firma
//    la emite la edge function `descarga-abierta`, que comprueba EN SERVIDOR
//    que la ventana de la quincena sigue abierta (`open_until > now()`). Al
//    cerrarse la quincena deja de firmar sola, sin que nadie toque nada.
// ---------------------------------------------------------------------------

/** Bucket privado donde viven los descargables que no son premium. */
export const BUCKET_RECURSOS = 'recursos-portal';

/** Segundos que vive una URL firmada. Lo justo para que el navegador la abra. */
const VIGENCIA_FIRMA = 60;

/**
 * Saca bucket y ruta de un `file_url`. Soporta las tres formas que conviven en
 * la tabla: URL completa de Storage (privada o pública), "bucket/fichero" y las
 * rutas heredadas "/recursos/fichero.pdf" de la época estática.
 */
export const refDeStorage = (fileUrl: string): { bucket: string; path: string } => {
  const enStorage = fileUrl.match(
    /\/storage\/v1\/object\/(?:public\/|sign\/|authenticated\/)?([^/]+)\/(.+)$/,
  );
  if (enStorage) return { bucket: enStorage[1], path: enStorage[2] };

  // Heredado: "/recursos/fichero.pdf" -> bucket por defecto, mismo nombre.
  const limpio = fileUrl.replace(/^\/+/, '');
  if (limpio.startsWith('recursos/')) {
    return { bucket: BUCKET_RECURSOS, path: limpio.slice('recursos/'.length) };
  }
  return { bucket: BUCKET_RECURSOS, path: limpio };
};

/**
 * URL firmada para un usuario CON sesión. Devuelve null si Storage la niega
 * (sin sesión, o el fichero no está donde dice la fila).
 */
export const urlFirmada = async (fileUrl: string): Promise<string | null> => {
  const { bucket, path } = refDeStorage(fileUrl);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, VIGENCIA_FIRMA);
  if (error || !data?.signedUrl) {
    console.error('No se pudo firmar la descarga:', error);
    return null;
  }
  return data.signedUrl;
};

/**
 * URL firmada para la ventana pública de la quincena, SIN sesión. La decisión
 * de si procede o no es del servidor: aquí no se mira `open_until` porque un
 * campo del cliente no protege nada.
 */
export const urlAbierta = async (slug: string): Promise<string | null> => {
  const { data, error } = await supabase.functions.invoke('descarga-abierta', {
    body: { slug },
  });
  if (error || !data?.url) {
    console.error('No se pudo abrir la descarga pública:', error ?? data);
    return null;
  }
  return data.url as string;
};

/**
 * Navega a una descarga abriendo la ventana DENTRO del gesto del clic: si se
 * espera al await antes de abrirla, Safari y los bloqueadores la matan.
 * Devuelve true si la descarga salió.
 */
export const lanzarDescarga = async (
  obtenerUrl: () => Promise<string | null>,
  win: Window | null,
): Promise<boolean> => {
  const url = await obtenerUrl();
  if (!url) {
    win?.close();
    return false;
  }
  if (win) win.location.href = url;
  else window.location.href = url;
  return true;
};
