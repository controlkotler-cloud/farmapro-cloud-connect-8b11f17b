-- ============================================================================
-- N28 · Los dos descargables de la quincena (17-09-2026 a 01-10-2026)
--
-- Primera quincena que estrena la ventana abierta sin cuenta
-- (contenido/ventana-descargables-impulso-2026-09-15.sql). Mientras
-- open_until esté en el futuro, /descarga/cuenta-resultados-bolsillo los
-- sirve a cualquiera sin registro y sin gastar ninguna de las 3 descargas del
-- plan Gratis (is_newsletter = true exime del tope). Pasado el 1 de octubre,
-- cuando salga la N29, la página deja de servirlos y solo viven dentro del
-- portal, con el resto.
--
-- SLUGS: el Excel lleva slug corto y público (`cuenta-resultados-bolsillo`)
-- porque es el que viaja en el botón del email y el que se comparte. La guía
-- mantiene la convención interna `fp-imp-nXX-*`. Regla para las siguientes
-- quincenas: slug corto al descargable principal, convención al acompañante.
--
-- ORDEN DE EJECUCIÓN (importante, ya se pagó una vez con los de la N26, que
-- estuvieron 12 días publicados apuntando a un 404):
--   1. push de los commits con los ficheros de public/recursos/
--   2. deploy_project (el push NO despliega los estáticos por sí solo)
--   3. curl -sI https://portal.farmapro.es/recursos/impulso-n28-*.xlsx  -> 200
--   4. y SOLO entonces, ejecutar este fichero.
-- ============================================================================

INSERT INTO public.resources
  (title, slug, description, category, type, format, file_url,
   is_premium, is_published, is_newsletter, newsletter_ref, open_until)
VALUES
  (
    'Cuenta de resultados de bolsillo (Excel)',
    'cuenta-resultados-bolsillo',
    'Metes cuatro datos al mes (ventas por familia, coste de esas ventas, gastos fijos y valor del stock) y te devuelve los cinco ratios calculados, con el histórico mes a mes y el gráfico de tendencia.',
    'impulso', 'herramienta', 'xls',
    '/recursos/impulso-n28-cuenta-resultados-bolsillo.xlsx',
    false, true, true, 'N28', '2026-10-01 08:00:00+02'
  ),
  (
    'La rentabilidad oculta: guía de los cinco ratios',
    'fp-imp-n28-cuenta-resultados-guia',
    'De dónde sacar cada dato en tu programa de gestión, los cuatro errores de cálculo más frecuentes y el circuito de veinte minutos al mes.',
    'impulso', 'guia', 'pdf',
    '/recursos/impulso-n28-cuenta-resultados-bolsillo-guia.pdf',
    false, true, true, 'N28', '2026-10-01 08:00:00+02'
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

-- Verificación
SELECT slug, title, format::text, file_url, is_published, is_newsletter,
       newsletter_ref, open_until,
       (open_until > now()) AS ventana_abierta
FROM public.resources
WHERE newsletter_ref = 'N28'
ORDER BY type::text;
