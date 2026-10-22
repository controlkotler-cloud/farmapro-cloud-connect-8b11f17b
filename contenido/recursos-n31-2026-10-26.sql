-- ============================================================================
-- N31 · Los dos descargables de la quincena (EJECUTADO 22-10-2026 al montar N31, publicado como N30)
--
-- Misma regla de entrega que N28-N32 (patron: recursos-n32-2026-11-09.sql):
--   · La GUIA PDF es el gratuito de la quincena: slug corto y publico
--     (`categorias-dueno`, el que viaja en el boton del email a /descarga/categorias-dueno)
--     y `open_until` a la fecha de la siguiente newsletter (N32, jueves
--     12-11-2026 08:00 en Madrid = 07:00 UTC, horario de invierno). Sin cuenta
--     hasta entonces; despues solo dentro del portal.
--   · El EXCEL NO se regala: `open_until` NULL, se abre con
--     /recursos?r=fp-imp-n31-ficha-categoria y exige cuenta (la gratuita basta).
--   · `is_newsletter = true` en los dos: ninguno consume el tope de 3 del plan
--     Gratis.
--   · `is_published = true` desde el montaje (22-10), igual que N30 (09-10); antes decia
--     montar el envio, no antes.
--   · Columnas reales de `resources` (comprobadas 22-10): title, slug,
--     description, category, type, format, file_url, is_premium, is_published,
--     is_newsletter, newsletter_ref, open_until. No existe `free_until`.
--   · Slugs comprobados por SELECT el 22-10: `categorias-dueno` y `fp-imp-n31-ficha-categoria`
--     no existen todavia.
--
-- ORDEN DE EJECUCION:
--   1. subir los dos ficheros al bucket privado `recursos-portal` (chat de
--      Lovable con los adjuntos; la anon key da 403; el mensaje lleva "No
--      toques codigo, no corrijas errores de build aunque los veas, no
--      redespliegues nada"), con ESTOS nombres en el bucket:
--        impulso-n31-categorias-dueno-guia.pdf   (562.214 bytes)
--        impulso-n31-ficha-categoria.xlsx        (14.498 bytes)
--   2. comprobar EN SERVIDOR, nunca con curl al dominio:
--      SELECT name, (metadata->>'size')::bigint FROM storage.objects
--      WHERE bucket_id='recursos-portal' AND name LIKE 'impulso-n31-%';
--      tamanos iguales a los locales.
--   3. y SOLO entonces, ejecutar este fichero.
--   4. (ya no aplica: se publica al montar, como N30)
--      UPDATE public.resources SET is_published = true WHERE newsletter_ref = 'N31';
--   5. copiar este fichero a farmapro-portal/contenido/ cuando se ejecute.
-- ============================================================================

INSERT INTO public.resources
  (title, slug, description, category, type, format, file_url,
   is_premium, is_published, is_newsletter, newsletter_ref, open_until)
VALUES
  (
    -- GRATUITO DE LA QUINCENA: slug corto y publico, con ventana hasta N32.
    'Cada categoría, un dueño: guía para repartir responsables en tu equipo',
    'categorias-dueno',
    'Cómo repartir las categorías sin repartir el caos: criterio para elegir al responsable de cada una, qué se le pide, cómo hacer el seguimiento con una reunión mensual de quince minutos, hoja de registro y un ejemplo relleno marcado como inventado.',
    'impulso', 'guia', 'pdf',
    'https://jeysistgdajopfruqpbc.supabase.co/storage/v1/object/recursos-portal/impulso-n31-categorias-dueno-guia.pdf',
    false, true, true, 'N31', '2026-11-12 07:00:00+00'
  ),
  (
    -- HERRAMIENTA: sin ventana (open_until NULL), solo dentro del portal.
    'Ficha de categoría: responsable, objetivo del trimestre, presupuesto de surtido, exposición y registro de reuniones (Excel)',
    'fp-imp-n31-ficha-categoria',
    'Una ficha por categoría con responsable, objetivo del trimestre, presupuesto de surtido y criterio de exposición, más un resumen que avisa de las categorías sin reunión reciente o con la revisión vencida y el registro de las reuniones mensuales.',
    'impulso', 'herramienta', 'xls',
    'https://jeysistgdajopfruqpbc.supabase.co/storage/v1/object/recursos-portal/impulso-n31-ficha-categoria.xlsx',
    false, true, true, 'N31', NULL
  )
ON CONFLICT (slug) DO UPDATE SET
  title          = EXCLUDED.title,
  description    = EXCLUDED.description,
  category       = EXCLUDED.category,
  type           = EXCLUDED.type,
  format         = EXCLUDED.format,
  file_url       = EXCLUDED.file_url,
  is_premium     = EXCLUDED.is_premium,
  is_published   = EXCLUDED.is_published,
  is_newsletter  = EXCLUDED.is_newsletter,
  newsletter_ref = EXCLUDED.newsletter_ref,
  open_until     = EXCLUDED.open_until,
  updated_at     = now();

-- Verificacion: la guia con ventana abierta, el Excel sin ventana.
SELECT slug, title, format::text, file_url, is_published, is_newsletter,
       newsletter_ref, open_until,
       (open_until IS NOT NULL AND open_until > now()) AS ventana_abierta
FROM public.resources
WHERE newsletter_ref = 'N31'
ORDER BY type::text;
