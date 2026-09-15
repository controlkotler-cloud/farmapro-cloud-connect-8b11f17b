-- ============================================================================
-- N28 · Los dos descargables de la quincena (17-09-2026)
--
-- REGLA DE ENTREGA (Francesc, 15-09-2026). Los dos materiales de cada Impulso
-- NO se entregan igual, y esto es lo que hay que replicar en N29 y siguientes:
--
--   · La GUÍA PDF es el descargable gratuito de la quincena. Lleva el slug
--     corto y público (el que viaja en el botón del email) y `open_until` a la
--     fecha de la siguiente newsletter: durante esos 15 días se baja desde
--     /descarga/<slug> sin cuenta y sin dejar ningún dato. Después solo vive
--     dentro del portal.
--   · El EXCEL (la herramienta) NO se regala. Vive dentro del portal desde el
--     primer día, con `open_until` a NULL, y se abre con enlace directo
--     /recursos?r=<slug>, que exige cuenta. La cuenta gratuita basta.
--
-- Por qué: la guía es la carta de presentación de la quincena y la herramienta
-- es lo que justifica el alta. No podemos regalarlo todo.
--
-- `is_newsletter = true` en los DOS: ninguno consume el tope de 3 descargas
-- del plan Gratis. Lo que se pide por el Excel es el alta, no una suscripción.
--
-- OJO, LÍMITE CONOCIDO: los ficheros de public/recursos/ son estáticos y
-- cualquiera con la URL exacta se los baja sin cuenta. El muro del Excel es
-- real en la interfaz, pero su URL no debe publicarse en ninguna pieza.
--
-- ORDEN DE EJECUCIÓN (ya se pagó una vez con los de la N26, publicados 12 días
-- apuntando a un 404):
--   1. push de los commits con los ficheros de public/recursos/
--   2. deploy_project (el push NO despliega los estáticos por sí solo)
--   3. curl -sI https://portal.farmapro.es/recursos/impulso-n28-*  -> 200
--   4. y SOLO entonces, ejecutar este fichero.
-- ============================================================================

INSERT INTO public.resources
  (title, slug, description, category, type, format, file_url,
   is_premium, is_published, is_newsletter, newsletter_ref, open_until)
VALUES
  (
    -- GRATUITO DE LA QUINCENA: slug corto y público, con ventana.
    'La rentabilidad oculta: guía de los cinco ratios',
    'cuenta-resultados-bolsillo',
    'Los cinco ratios explicados uno a uno: de dónde sacar cada dato en tu programa de gestión, los cuatro errores de cálculo más frecuentes y el circuito de veinte minutos al mes para dejarlos hechos.',
    'impulso', 'guia', 'pdf',
    '/recursos/impulso-n28-cuenta-resultados-bolsillo-guia.pdf',
    false, true, true, 'N28', '2026-10-01 08:00:00+02'
  ),
  (
    -- HERRAMIENTA: sin ventana (open_until NULL), solo dentro del portal.
    'Cuenta de resultados de bolsillo (Excel)',
    'fp-imp-n28-cuenta-resultados-excel',
    'Metes cuatro datos al mes (ventas por familia, coste de esas ventas, gastos fijos y valor del stock) y te devuelve los cinco ratios calculados, con el histórico mes a mes y el gráfico de tendencia.',
    'impulso', 'herramienta', 'xls',
    '/recursos/impulso-n28-cuenta-resultados-bolsillo.xlsx',
    false, true, true, 'N28', NULL
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

-- Verificación: la guía con ventana abierta, el Excel sin ventana.
SELECT slug, title, format::text, file_url, is_published, is_newsletter,
       newsletter_ref, open_until,
       (open_until IS NOT NULL AND open_until > now()) AS ventana_abierta
FROM public.resources
WHERE newsletter_ref = 'N28'
ORDER BY type::text;
