-- ============================================================================
-- Cerrar el agujero de los descargables estáticos (15-09-2026)
--
-- PROBLEMA: los recursos no premium eran ficheros de public/recursos/, que
-- sirve el CDN ANTES de que exista React, sesión o RLS. La base de datos
-- decidía quién veía el BOTÓN, nunca quién bajaba el FICHERO. Con la URL
-- exacta se los bajaba cualquiera sin cuenta, y la URL ni siquiera era
-- secreta: la landing pública /descarga/:slug lee `file_url` con la anon key.
--
-- REGLA DE FRANCESC (15-09-2026): "los recursos deben tener el límite de que
-- es una cuenta creada". Cuenta gratuita basta; cuenta hace falta.
--
-- SOLUCIÓN: los ficheros pasan a un bucket PRIVADO y solo salen por URL
-- firmada de 60 s. Dos únicas puertas:
--   · con sesión -> la firma el cliente (política de abajo, rol authenticated)
--   · sin sesión -> SOLO la edge function `descarga-abierta`, que comprueba en
--     servidor que la quincena sigue abierta (open_until > now())
--
-- ORDEN DE EJECUCIÓN (importante, no cambiar):
--   1. Lovable: crea el bucket y COPIA los 69 ficheros de public/recursos/
--   2. este SQL (bloques 1, 2 y 3)
--   3. push + deploy_project del frontend nuevo
--   4. Lovable: despliega la edge function `descarga-abierta`
--   5. verificar (bloque 4)
--   6. y SOLO entonces borrar public/recursos/ del repo + push + deploy
-- Si se borra public/recursos/ antes del paso 3, las descargas dan 404.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1) El bucket, privado. Idempotente.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('recursos-portal', 'recursos-portal', false)
ON CONFLICT (id) DO UPDATE SET public = false;


-- ---------------------------------------------------------------------------
-- 2) La política: firma cualquiera CON SESIÓN, sea del plan que sea.
--
-- Ojo a lo que NO dice: no menciona el plan ni `is_premium`. Ese era justo el
-- error de antes, tener el muro atado a "es de pago" en vez de a "hay cuenta".
-- Los topes del plan gratis (3 descargas) y el acceso a lo premium los sigue
-- decidiendo la aplicación ANTES de pedir la firma; esto es solo el suelo.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "recursos_portal_lectura_autenticada" ON storage.objects;
CREATE POLICY "recursos_portal_lectura_autenticada"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'recursos-portal');


-- ---------------------------------------------------------------------------
-- 3) Mover las rutas: "/recursos/x.pdf" -> URL de Storage en el bucket nuevo.
--
-- Se deja la URL completa (no solo la ruta) porque es la forma que ya entienden
-- el cliente y la edge function, y así las filas premium de recursos-premium
-- siguen funcionando sin tocarlas.
-- ---------------------------------------------------------------------------
UPDATE public.resources
SET file_url =
      'https://jeysistgdajopfruqpbc.supabase.co/storage/v1/object/recursos-portal/'
      || regexp_replace(file_url, '^/+recursos/', ''),
    updated_at = now()
WHERE file_url LIKE '/recursos/%';


-- ---------------------------------------------------------------------------
-- 4) Verificación. Lo que hay que ver:
--    · estaticos_restantes = 0
--    · en_bucket_nuevo     = el número de filas que había apuntando a /recursos/
--    · premium_intactos    = los de recursos-premium, sin tocar
-- ---------------------------------------------------------------------------
SELECT
  count(*) FILTER (WHERE file_url LIKE '/recursos/%')              AS estaticos_restantes,
  count(*) FILTER (WHERE file_url LIKE '%/object/recursos-portal/%') AS en_bucket_nuevo,
  count(*) FILTER (WHERE file_url LIKE '%recursos-premium%')       AS premium_intactos,
  count(*)                                                        AS filas_totales
FROM public.resources;

-- Y el caso de la N28, que es el que se envía el jueves 17-09: la guía con
-- ventana abierta (se baja sin cuenta) y el Excel sin ventana (pide cuenta).
SELECT slug, file_url, open_until,
       (open_until IS NOT NULL AND open_until > now()) AS ventana_abierta
FROM public.resources
WHERE newsletter_ref = 'N28'
ORDER BY slug;
