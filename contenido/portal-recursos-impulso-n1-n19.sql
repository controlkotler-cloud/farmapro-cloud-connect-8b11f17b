-- =====================================================================
-- farmapro portal — RECURSOS Impulso N1–N19 (descargables reales)
-- =====================================================================
-- Conecta los 20 descargables de la carpeta "descargables hasta n20",
-- copiados al repo en farmapro-portal/public/recursos/ (se sirven en /recursos/...).
-- Categoría 'impulso', is_premium=false, is_published=true, formato pdf.
--
-- REQUISITO: la categoría 'impulso' ya debe existir (ALTER TYPE ejecutado).
-- Idempotente: borra por slug (fp-imp-n%) y reinserta. Además elimina el
-- recurso antiguo 'fp-imp-catalogo-servicios' (docx) porque queda sustituido
-- por 'N19 · 12 servicios que fidelizan' (pdf).
-- Rollback: DELETE FROM public.resources WHERE slug LIKE 'fp-imp-n%';
-- =====================================================================

DELETE FROM public.resources WHERE slug LIKE 'fp-imp-n%';
DELETE FROM public.resources WHERE slug = 'fp-imp-catalogo-servicios';

INSERT INTO public.resources
  (title, slug, description, category, type, format, file_url,
   is_published, is_premium, downloads_count, download_count)
VALUES
  ('Checklist: 10 señales de alarma en tu farmacia','fp-imp-n01-senales-alarma',
   'Diez señales que avisan de que algo no va bien (margen que cae, stock parado, equipo desmotivado) y qué revisar en cada una.',
   'impulso','checklist','pdf','/recursos/impulso-n01-senales-alarma.pdf',true,false,0,0),

  ('El coste real: equipo propio vs. agencia','fp-imp-n02-coste-real',
   'Compara con números el coste real de resolver el marketing con personal interno frente a una agencia especializada.',
   'impulso','guia','pdf','/recursos/impulso-n02-coste-real.pdf',true,false,0,0),

  ('Distribución estratégica por categorías de alto margen','fp-imp-n03-categorias-alto-margen',
   'Cómo organizar surtido y espacio dando prioridad a las categorías que más aportan al margen de la farmacia.',
   'impulso','guia','pdf','/recursos/impulso-n03-categorias-alto-margen.pdf',true,false,0,0),

  ('Plan de incentivos para tu equipo','fp-imp-n04-incentivos',
   'Marco para diseñar incentivos que motiven al equipo de la farmacia sin disparar los costes.',
   'impulso','guia','pdf','/recursos/impulso-n04-incentivos.pdf',true,false,0,0),

  ('Checklist: clasificación de inventario por rotación','fp-imp-n05-inventario-rotacion',
   'Clasifica el inventario por rotación (A/B/C) para reducir stock parado y mejorar la tesorería.',
   'impulso','checklist','pdf','/recursos/impulso-n05-inventario-rotacion.pdf',true,false,0,0),

  ('Posicionamiento local paso a paso','fp-imp-n06-posicionamiento-local',
   'Guía para mejorar la visibilidad local de tu farmacia en Google y en el barrio, paso a paso.',
   'impulso','guia','pdf','/recursos/impulso-n06-posicionamiento-local.pdf',true,false,0,0),

  ('Autodiagnóstico de madurez digital','fp-imp-n07-madurez-digital',
   'Evalúa el nivel de madurez digital de tu farmacia y obtén un plan de evolución personalizado.',
   'impulso','guia','pdf','/recursos/impulso-n07-madurez-digital.pdf',true,false,0,0),

  ('Alerta temprana de clientes en riesgo','fp-imp-n08-clientes-riesgo',
   'Sistema para detectar a tiempo a los clientes que dejan de venir y actuar antes de perderlos.',
   'impulso','guia','pdf','/recursos/impulso-n08-clientes-riesgo.pdf',true,false,0,0),

  ('Planograma de alta conversión','fp-imp-n09-planograma',
   'Cómo diseñar el planograma de la farmacia para que el recorrido del cliente venda más.',
   'impulso','guia','pdf','/recursos/impulso-n09-planograma.pdf',true,false,0,0),

  ('Agenda semanal para titulares','fp-imp-n10-agenda-semanal',
   'Plantilla de agenda semanal para que el titular organice gestión, equipo y mostrador sin que se lo coma el día a día.',
   'impulso','plantilla','pdf','/recursos/impulso-n10-agenda-semanal.pdf',true,false,0,0),

  ('Checklist: 12 elementos del escaparate estacional','fp-imp-n11-escaparate-checklist',
   'Los 12 elementos imprescindibles que no pueden faltar en un escaparate estacional que atrae y vende.',
   'impulso','checklist','pdf','/recursos/impulso-n11-escaparate-checklist.pdf',true,false,0,0),

  ('Plantilla: 4 escaparates al año','fp-imp-n11-escaparates-plantilla',
   'Plantilla para planificar con antelación los cuatro escaparates estacionales del año.',
   'impulso','plantilla','pdf','/recursos/impulso-n11-escaparates-plantilla.pdf',true,false,0,0),

  ('Herramientas digitales imprescindibles','fp-imp-n12-herramientas-digitales',
   'Selección de herramientas digitales útiles y asequibles para el día a día de la farmacia.',
   'impulso','guia','pdf','/recursos/impulso-n12-herramientas-digitales.pdf',true,false,0,0),

  ('Complementos por necesidad del cliente','fp-imp-n13-complementos-naturales',
   'Orientación para recomendar complementos según la necesidad del cliente, siempre con el consejo del farmacéutico por delante.',
   'impulso','guia','pdf','/recursos/impulso-n13-complementos-naturales.pdf',true,false,0,0),

  ('Guía rápida de diferenciación','fp-imp-n14-diferenciacion',
   'Ideas concretas para diferenciar tu farmacia de la competencia más cercana.',
   'impulso','guia','pdf','/recursos/impulso-n14-diferenciacion.pdf',true,false,0,0),

  ('Tu farmacia como referente digital','fp-imp-n15-referente-digital',
   'Cómo construir la presencia digital de la farmacia hasta convertirla en un referente local.',
   'impulso','guia','pdf','/recursos/impulso-n15-referente-digital.pdf',true,false,0,0),

  ('30 ideas de contenido para redes','fp-imp-n16-30-ideas-contenido',
   'Treinta ideas de contenido para las redes de tu farmacia, listas para crear en pocos minutos.',
   'impulso','guia','pdf','/recursos/impulso-n16-30-ideas-contenido.pdf',true,false,0,0),

  ('Plan de transformación digital','fp-imp-n17-plan-transformacion',
   'Hoja de ruta para abordar la transformación digital de la farmacia por fases, sin agobios.',
   'impulso','guia','pdf','/recursos/impulso-n17-plan-transformacion.pdf',true,false,0,0),

  ('Del clic al mostrador','fp-imp-n18-clic-al-mostrador',
   'Cómo convertir la visibilidad online en visitas y ventas reales en el mostrador.',
   'impulso','guia','pdf','/recursos/impulso-n18-clic-al-mostrador.pdf',true,false,0,0),

  ('12 servicios que fidelizan','fp-imp-n19-12-servicios',
   'Doce servicios profesionales que tu farmacia puede ofrecer para fidelizar y diferenciarse.',
   'impulso','guia','pdf','/recursos/impulso-n19-12-servicios.pdf',true,false,0,0);

-- Verificación:
-- SELECT title, file_url FROM public.resources WHERE slug LIKE 'fp-imp-n%' ORDER BY slug;
-- Recursos sin contenido real (para revisar/rellenar):
-- SELECT id, title, category, file_url FROM public.resources
--  WHERE file_url IS NULL OR file_url = '' OR file_url LIKE '%PENDIENTE%' OR file_url NOT LIKE '/recursos/%';
