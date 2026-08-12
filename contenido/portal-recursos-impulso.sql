-- =====================================================================
-- farmapro portal — RECURSOS categoría "Impulso" (descargables reales)
-- =====================================================================
-- Conecta los descargables ya creados en el proyecto farmapro Impulso, que
-- se han copiado al repo en farmapro-portal/public/recursos/ (se sirven en
-- /recursos/...). Todos is_published=true e is_premium=false (valor abierto).
--
-- REQUISITO: ejecutar ANTES la migración que añade la categoría 'impulso'
--   (supabase/migrations/20260618120000_resource_category_impulso.sql), o el
--   ALTER TYPE: ALTER TYPE public.resource_category ADD VALUE IF NOT EXISTS 'impulso';
--
-- Idempotente: borra por slug (prefijo fp-imp-) y reinserta.
-- Rollback: DELETE FROM public.resources WHERE slug LIKE 'fp-imp-%';
-- =====================================================================

DELETE FROM public.resources WHERE slug LIKE 'fp-imp-%';

INSERT INTO public.resources
  (title, slug, description, category, type, format, file_url,
   is_published, is_premium, downloads_count, download_count)
VALUES
  ('10 herramientas digitales para tu farmacia',
   'fp-imp-bienvenida-herramientas',
   'Guía de bienvenida con 10 herramientas digitales prácticas (y gratuitas o económicas) que cualquier farmacia puede empezar a usar hoy para ganar tiempo, comunicar mejor y vender más. El punto de partida ideal si empiezas en lo digital.',
   'impulso', 'guia', 'pdf',
   '/recursos/impulso-bienvenida-10-herramientas-digitales.pdf',
   true, false, 0, 0),

  ('Catálogo de 12 servicios profesionales',
   'fp-imp-catalogo-servicios',
   'Catálogo con 12 servicios profesionales que tu farmacia puede ofrecer para diferenciarse y generar ingresos recurrentes, con ideas de implantación. Editable para adaptarlo a tu farmacia.',
   'impulso', 'guia', 'docs',
   '/recursos/impulso-catalogo-12-servicios-profesionales.docx',
   true, false, 0, 0),

  ('Las 5 conversaciones que mejoran tu equipo',
   'fp-imp-5-conversaciones',
   'Guía sobre las cinco conversaciones clave que todo responsable debería tener con su equipo de farmacia: expectativas, desarrollo, feedback, reconocimiento y futuro. Con guion para cada una.',
   'impulso', 'guia', 'pdf',
   '/recursos/impulso-5-conversaciones-equipo.pdf',
   true, false, 0, 0),

  ('Plantilla de reunión 1 a 1 con tu equipo',
   'fp-imp-plantilla-reunion-1a1',
   'Plantilla lista para usar que estructura las reuniones individuales (1 a 1) con cada persona del equipo: temas, seguimiento de acuerdos y próximos pasos. Para que las reuniones sirvan de algo.',
   'impulso', 'plantilla', 'xls',
   '/recursos/impulso-plantilla-reunion-1a1.xlsx',
   true, false, 0, 0),

  ('Planificador de 12 campañas anuales',
   'fp-imp-planificador-campanas',
   'Planificador para organizar las campañas comerciales y de salud estacional de todo el año, mes a mes: temática, categorías, escaparate y acciones. La base para no improvisar el calendario.',
   'impulso', 'plantilla', 'pdf',
   '/recursos/impulso-planificador-12-campanas.pdf',
   true, false, 0, 0),

  ('Seguimiento de KPIs de campañas',
   'fp-imp-seguimiento-kpis',
   'Hoja de cálculo para medir el resultado de cada campaña de la farmacia: ventas, unidades, ticket medio y comparativa con el periodo anterior. Para saber qué campañas repetir.',
   'impulso', 'plantilla', 'xls',
   '/recursos/impulso-seguimiento-kpis-campanas.xlsx',
   true, false, 0, 0),

  ('Dashboard del titular: las 5 palancas',
   'fp-imp-dashboard-5-palancas',
   'Cuadro de mando en Excel para que el titular vea de un vistazo las 5 palancas de rentabilidad de la farmacia y su evolución. Introduce tus datos y obtén la foto de tu negocio.',
   'impulso', 'plantilla', 'xls',
   '/recursos/impulso-dashboard-titular-5-palancas.xlsx',
   true, false, 0, 0),

  ('Guía: diagnóstico de las 5 palancas',
   'fp-imp-diagnostico-guia',
   'Guía que explica las 5 palancas de rentabilidad de una farmacia y cómo diagnosticar en cuáles tienes margen de mejora. El acompañante perfecto del autodiagnóstico en Excel.',
   'impulso', 'guia', 'pdf',
   '/recursos/impulso-diagnostico-5-palancas-guia.pdf',
   true, false, 0, 0),

  ('Autodiagnóstico de las 5 palancas (Excel)',
   'fp-imp-diagnostico-xls',
   'Autodiagnóstico en Excel para evaluar las 5 palancas de tu farmacia respondiendo unas preguntas y obtener una puntuación por área. Identifica por dónde empezar a mejorar.',
   'impulso', 'plantilla', 'xls',
   '/recursos/impulso-diagnostico-5-palancas.xlsx',
   true, false, 0, 0);

-- Verificación:
-- SELECT title, file_url FROM public.resources WHERE slug LIKE 'fp-imp-%' ORDER BY title;
