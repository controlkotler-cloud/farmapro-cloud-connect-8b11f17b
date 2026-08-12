-- =====================================================================
-- farmapro portal — RECURSOS + SIEMBRA DE COMUNIDAD (listo para ejecutar)
-- =====================================================================
-- Este script siembra contenido inicial para el lanzamiento del portal:
--   A) 12 RECURSOS descargables repartidos por las 5 categorías de negocio.
--   B) SIEMBRA DE COMUNIDAD: categorías del foro (si está vacío) + 8 hilos
--      de conversación + respuestas de ejemplo en algunos hilos.
--
-- ---------------------------------------------------------------------
-- CÓMO EJECUTARLO
--   Pegar este script entero en el editor SQL (vía Lovable / Supabase SQL)
--   y ejecutarlo. Es una sola transacción dentro de un bloque PL/pgSQL
--   (DO $$ ... $$), por lo que o entra todo o no entra nada.
--
-- IDEMPOTENCIA (se puede re-ejecutar tantas veces como se quiera)
--   - RECURSOS: se borran primero por su slug (prefijo 'fp-rec-') y se
--     vuelven a insertar. Resultado: siempre una sola copia limpia.
--   - HILOS del foro: se borran primero por su título exacto (y, en
--     cascada, sus respuestas) y se vuelven a insertar.
--   - CATEGORÍAS del foro: solo se insertan SI la tabla está vacía
--     (salvaguarda para no duplicar categorías ya creadas en producción).
--     Aun así, cada categoría se busca/crea por slug de forma segura.
--
-- ROLLBACK / DESHACER por completo
--   -- Recursos sembrados aquí:
--   DELETE FROM public.resources WHERE slug LIKE 'fp-rec-%';
--   -- Hilos sembrados aquí (las respuestas caen en cascada):
--   DELETE FROM public.forum_threads WHERE title IN (
--     'Cómo organizáis los turnos del equipo en verano',
--     'Vuestra mejor idea de escaparate este mes',
--     '¿Cómo gestionáis las reseñas negativas en Google?',
--     'Plantilla de inventario: ¿cada cuánto hacéis recuento?',
--     'Atención al cliente mayor: trucos que os funcionan',
--     'Cambios en el margen de parafarmacia: ¿lo notáis?',
--     'Cómo motiváis al equipo sin subir sueldos',
--     'Preséntate: ¿quién hay al otro lado del mostrador?'
--   );
--   -- Categorías (solo si quieres borrarlas; ojo si tienen otros hilos):
--   DELETE FROM public.forum_categories
--    WHERE slug IN ('gestion','marketing-ventas','atencion-cliente',
--                   'novedades-sector','presentaciones');
--
-- NOTAS DE CONTENIDO Y VOZ
--   - "farmapro" siempre en minúsculas. Castellano de España (vosotros).
--   - Contenido de NEGOCIO de farmacia (gestión, ventas, atención,
--     marketing, liderazgo), NUNCA clínico ni sanitario. Sin promesas
--     de salud (código deontológico).
--   - Cifras siempre con fuente o etiquetadas como "estimación sectorial".
--   - Sin emojis.
--
-- GOTCHAS DEL ESQUEMA (verificados contra
--   src/integrations/supabase/types.ts del repo conectado a Lovable):
--   * resources tiene DOS columnas de contador:
--       - downloads_count  (integer NOT NULL, default 0)  <- la principal
--       - download_count   (integer NULLABLE)             <- duplicada/legacy
--     Se rellenan AMBAS a 0 para evitar incoherencias entre vistas.
--   * resources.slug es NOT NULL y único -> se usa para la idempotencia.
--   * resource_type (enum) admite: pdf, video, infografia, plantilla,
--     guia, otro, protocolo, calculadora, checklist, manual, herramienta.
--     -> 'checklist' SÍ existe como tipo nativo (se usa directamente).
--   * resource_category (enum) admite: ventas, marketing, gestion,
--     liderazgo, atencion, otros, finanzas, digital. Aquí se usan las 5
--     pedidas: ventas, marketing, gestion, liderazgo, atencion.
--   * resources.format (enum resource_format) es NULLABLE: pdf/docs/url/
--     xls/video. Se rellena de forma coherente con el tipo cuando aplica.
--   * forum_threads.author_id y forum_replies.author_id son FK a
--     profiles(id) y NOT NULL -> se resuelve el autor por subselect
--     (admin si existe; si no, el perfil más antiguo). Ver nota abajo.
--   * forum_threads.last_reply_at: en los hilos con respuesta se fija a
--     la fecha de la última respuesta para que el orden del foro sea real.
-- =====================================================================

DO $$
DECLARE
  -- Autor de toda la siembra de comunidad. Como por ahora solo existen
  -- cuentas internas, se usa el admin (user_roles.role='admin'); si no
  -- hubiera, el perfil más antiguo. LUEGO SE PUEDEN REASIGNAR AUTORES.
  v_author_id uuid;

  -- IDs de categoría del foro (se resuelven/crean más abajo).
  v_cat_gestion       uuid;
  v_cat_marketing     uuid;
  v_cat_atencion      uuid;
  v_cat_novedades     uuid;
  v_cat_presenta      uuid;

  -- IDs de los hilos que llevan respuesta (para enlazar forum_replies).
  v_th_turnos    uuid := gen_random_uuid();
  v_th_escapar   uuid := gen_random_uuid();
  v_th_resenas   uuid := gen_random_uuid();
  v_th_presenta  uuid := gen_random_uuid();
BEGIN

  -- ===================================================================
  -- A) RECURSOS
  -- ===================================================================
  -- A.0) Limpieza idempotente: borrar los recursos sembrados aquí.
  DELETE FROM public.resources WHERE slug LIKE 'fp-rec-%';

  -- A.1) Inserción de los 12 recursos.
  --   IMPORTANTE: file_url es un PLACEHOLDER. Hay que SUBIR el archivo real
  --   (a Supabase Storage o donde corresponda) y sustituir la ruta por la
  --   URL definitiva. Mientras tanto el recurso aparece pero no descarga.
  --   Contadores (downloads_count y download_count) a 0 en todos.
  INSERT INTO public.resources
    (title, slug, description, category, type, format, file_url,
     is_published, is_premium, downloads_count, download_count)
  VALUES
  -- ---------------- GESTIÓN (3) ----------------
  ('Checklist de apertura y cierre de la farmacia',
   'fp-rec-checklist-apertura-cierre',
   'Lista de comprobación para que cualquier persona del equipo abra y cierre la farmacia sin olvidos: caja, alarma, neveras, frigorífico de termolábiles, repaso de pendientes y traspaso de turno. Pensada para plastificar y dejar en la trastienda.',
   'gestion', 'checklist', 'pdf',
   '/recursos/checklist-apertura-cierre.pdf',
   true, false, 0, 0),

  ('Plantilla de cuadrante de turnos mensual',
   'fp-rec-plantilla-cuadrante-turnos',
   'Hoja de cálculo para organizar el cuadrante mensual del equipo: turnos de mañana y tarde, guardias, vacaciones y descansos, con recuento automático de horas por persona. Editable y lista para imprimir.',
   'gestion', 'plantilla', 'xls',
   '/recursos/plantilla-cuadrante-turnos.xlsx',
   true, false, 0, 0),

  ('Guía: cómo preparar el inventario anual sin caos',
   'fp-rec-guia-inventario-anual',
   'Guía paso a paso para planificar el recuento de inventario de la farmacia: cómo dividir el trabajo por secciones, qué revisar antes de empezar, cómo cuadrar diferencias y cómo dejarlo documentado para el año siguiente. Enfoque de gestión, no contable.',
   'gestion', 'guia', 'pdf',
   '/recursos/guia-inventario-anual.pdf',
   true, false, 0, 0),

  -- ---------------- VENTAS (3) ----------------
  ('Guion de venta cruzada ética para el mostrador',
   'fp-rec-guion-venta-cruzada',
   'Guion práctico con frases reales para recomendar productos complementarios sin presionar al cliente: cómo detectar la necesidad, cómo proponer una sola cosa bien explicada y cómo cerrar respetando la decisión. Coherente con el código deontológico.',
   'ventas', 'guia', 'pdf',
   '/recursos/guion-venta-cruzada.pdf',
   true, false, 0, 0),

  ('Plantilla de seguimiento de ticket medio',
   'fp-rec-plantilla-ticket-medio',
   'Hoja de cálculo para registrar y seguir la evolución del ticket medio y del número de unidades por venta de tu farmacia, mes a mes. Incluye gráficas automáticas para ver tendencias y detectar qué campañas funcionan.',
   'ventas', 'plantilla', 'xls',
   '/recursos/plantilla-ticket-medio.xlsx',
   true, false, 0, 0),

  ('Checklist de campaña estacional en el lineal',
   'fp-rec-checklist-campana-estacional',
   'Lista de comprobación para montar una campaña de temporada (vuelta al cole, verano, gripe, alergias) en el lineal y el escaparate: selección de producto, cartelería, formación exprés del equipo y medición de resultados. Sin promesas de salud.',
   'ventas', 'checklist', 'pdf',
   '/recursos/checklist-campana-estacional.pdf',
   true, false, 0, 0),

  -- ---------------- MARKETING (2) ----------------
  ('Plantilla de calendario de contenidos para redes',
   'fp-rec-plantilla-calendario-redes',
   'Plantilla mensual para planificar las publicaciones de la farmacia en redes sociales: temas por semana, tipo de contenido, fechas señaladas del calendario y reparto de responsabilidades del equipo. Pensada para no improvisar.',
   'marketing', 'plantilla', 'xls',
   '/recursos/plantilla-calendario-redes.xlsx',
   true, false, 0, 0),

  ('Infografía: anatomía de una ficha de Google bien optimizada',
   'fp-rec-infografia-ficha-google',
   'Infografía de una página que resume los elementos clave de una ficha de Google Business Profile de farmacia que funciona: horario correcto, fotos, categoría, reseñas y publicaciones. Ideal para tenerla a mano al revisar la ficha.',
   'marketing', 'infografia', 'pdf',
   '/recursos/infografia-ficha-google.pdf',
   true, false, 0, 0),

  -- ---------------- ATENCIÓN (2) ----------------
  ('Guía de atención al cliente mayor en el mostrador',
   'fp-rec-guia-atencion-cliente-mayor',
   'Guía con pautas prácticas para atender a personas mayores en la farmacia: ritmo de la conversación, claridad al explicar pautas de uso, accesibilidad y trato cercano. Enfoque de servicio y comunicación, no clínico.',
   'atencion', 'guia', 'pdf',
   '/recursos/guia-atencion-cliente-mayor.pdf',
   true, false, 0, 0),

  ('Checklist para gestionar una queja en el mostrador',
   'fp-rec-checklist-gestion-quejas',
   'Lista de comprobación con los pasos para resolver una queja o reclamación en el mostrador sin que escale: escuchar, validar, dar una solución concreta y registrar el caso para que no se repita. Mantiene la calma del equipo y del cliente.',
   'atencion', 'checklist', 'pdf',
   '/recursos/checklist-gestion-quejas.pdf',
   true, false, 0, 0),

  -- ---------------- LIDERAZGO (2) ----------------
  ('Plantilla de guion para reuniones de equipo',
   'fp-rec-plantilla-reuniones-equipo',
   'Plantilla para preparar y conducir reuniones breves y útiles con el equipo de la farmacia: orden del día, objetivos, acuerdos y responsables. Pensada para que las reuniones duren poco y sirvan de algo.',
   'liderazgo', 'plantilla', 'docs',
   '/recursos/plantilla-reuniones-equipo.docx',
   true, false, 0, 0),

  ('Guía para dar feedback al equipo sin generar tensión',
   'fp-rec-guia-feedback-equipo',
   'Guía práctica para el titular o responsable: cómo dar feedback de mejora a una persona del equipo de forma concreta y respetuosa, cómo reconocer lo que va bien y cómo hacer seguimiento. Liderazgo cercano para farmacias pequeñas.',
   'liderazgo', 'guia', 'pdf',
   '/recursos/guia-feedback-equipo.pdf',
   true, false, 0, 0);

  RAISE NOTICE 'Recursos sembrados: % filas con slug fp-rec-*',
    (SELECT COUNT(*) FROM public.resources WHERE slug LIKE 'fp-rec-%');

  -- ===================================================================
  -- B) SIEMBRA DE COMUNIDAD
  -- ===================================================================

  -- B.0) Resolver el autor de la siembra (FK a profiles, NOT NULL).
  --      admin si existe; si no, el perfil más antiguo.
  --      LUEGO SE PUEDEN REASIGNAR AUTORES a usuarios reales.
  v_author_id := COALESCE(
    (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1),
    (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1)
  );

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION
      'No hay ningún perfil/usuario en la base de datos: crea al menos una cuenta (idealmente admin) antes de sembrar el foro.';
  END IF;

  -- B.1) CATEGORÍAS del foro.
  --      Solo se siembran de golpe SI la tabla está vacía, para no chocar
  --      con categorías ya creadas en producción. Si ya hay categorías,
  --      este bloque no inserta nada (salvaguarda anti-duplicados).
  IF NOT EXISTS (SELECT 1 FROM public.forum_categories) THEN
    INSERT INTO public.forum_categories (name, slug, description, color, icon, order_index, is_active, is_premium) VALUES
      ('Gestión',            'gestion',          'Organización del día a día de la farmacia: turnos, inventario, procesos y productividad.', '#2563eb', 'briefcase',     1, true, false),
      ('Marketing y Ventas', 'marketing-ventas', 'Cómo atraer y fidelizar clientes, campañas, escaparate, redes y venta en el mostrador.',  '#16a34a', 'megaphone',     2, true, false),
      ('Atención al Cliente','atencion-cliente', 'Trato en el mostrador, comunicación, quejas y experiencia del cliente.',                  '#9333ea', 'heart-handshake',3, true, false),
      ('Novedades del Sector','novedades-sector','Cambios normativos, tendencias y novedades que afectan a la farmacia comunitaria.',       '#ea580c', 'newspaper',     4, true, false),
      ('Presentaciones',     'presentaciones',   'Preséntate a la comunidad de farmapro y conoce a otros profesionales.',                   '#0891b2', 'users',         5, true, false);
    RAISE NOTICE 'Categorías de foro sembradas (la tabla estaba vacía).';
  ELSE
    RAISE NOTICE 'forum_categories ya tenía datos: no se insertan categorías nuevas.';
  END IF;

  -- B.2) Resolver los IDs de categoría por slug (existan de antes o recién
  --      creadas). Si por lo que sea el portal usa otros slugs, se hace un
  --      fallback por nombre (ILIKE) y, en último término, a la 1ª categoría.
  v_cat_gestion := COALESCE(
    (SELECT id FROM public.forum_categories WHERE slug = 'gestion' LIMIT 1),
    (SELECT id FROM public.forum_categories WHERE name ILIKE '%gesti%' LIMIT 1),
    (SELECT id FROM public.forum_categories ORDER BY order_index LIMIT 1)
  );
  v_cat_marketing := COALESCE(
    (SELECT id FROM public.forum_categories WHERE slug = 'marketing-ventas' LIMIT 1),
    (SELECT id FROM public.forum_categories WHERE name ILIKE '%marketing%' LIMIT 1),
    v_cat_gestion
  );
  v_cat_atencion := COALESCE(
    (SELECT id FROM public.forum_categories WHERE slug = 'atencion-cliente' LIMIT 1),
    (SELECT id FROM public.forum_categories WHERE name ILIKE '%atenci%' LIMIT 1),
    v_cat_gestion
  );
  v_cat_novedades := COALESCE(
    (SELECT id FROM public.forum_categories WHERE slug = 'novedades-sector' LIMIT 1),
    (SELECT id FROM public.forum_categories WHERE name ILIKE '%novedad%' LIMIT 1),
    v_cat_gestion
  );
  v_cat_presenta := COALESCE(
    (SELECT id FROM public.forum_categories WHERE slug = 'presentaciones' LIMIT 1),
    (SELECT id FROM public.forum_categories WHERE name ILIKE '%present%' LIMIT 1),
    v_cat_gestion
  );

  -- B.3) Limpieza idempotente de los HILOS sembrados (por título exacto).
  --      Las respuestas (forum_replies) caen en cascada por la FK.
  DELETE FROM public.forum_threads WHERE title IN (
    'Cómo organizáis los turnos del equipo en verano',
    'Vuestra mejor idea de escaparate este mes',
    '¿Cómo gestionáis las reseñas negativas en Google?',
    'Plantilla de inventario: ¿cada cuánto hacéis recuento?',
    'Atención al cliente mayor: trucos que os funcionan',
    'Cambios en el margen de parafarmacia: ¿lo notáis?',
    'Cómo motiváis al equipo sin subir sueldos',
    'Preséntate: ¿quién hay al otro lado del mostrador?'
  );

  -- B.4) HILOS (8). Tres de ellos llevan id fijo porque tendrán respuestas.
  --      author_id resuelto arriba; reasignable a usuarios reales después.

  -- Hilo 1 — Gestión (con respuestas)
  INSERT INTO public.forum_threads (id, title, content, author_id, category_id, is_pinned, last_reply_at)
  VALUES (
    v_th_turnos,
    'Cómo organizáis los turnos del equipo en verano',
    'Se acerca el verano y siempre es un quebradero de cabeza cuadrar vacaciones del equipo con los días de más trabajo. ¿Cómo lo hacéis vosotros? ¿Cerráis algún turno, contratáis refuerzo, repartís las vacaciones por sorteo...? Me interesa especialmente cómo lo gestionáis en farmacias de equipo pequeño (2-3 personas), que es donde menos margen hay. Cualquier truco es bienvenido.',
    v_author_id, v_cat_gestion, true, NULL
  );

  -- Hilo 2 — Marketing y Ventas (con respuestas)
  INSERT INTO public.forum_threads (id, title, content, author_id, category_id, last_reply_at)
  VALUES (
    v_th_escapar,
    'Vuestra mejor idea de escaparate este mes',
    'Abro hilo para compartir ideas de escaparate. Cuesta sacar tiempo para pensarlo, así que va bien inspirarse entre todos. ¿Qué habéis montado este mes y qué tal ha funcionado? Si podéis, contad el tema, cómo lo habéis resuelto con poco presupuesto y si habéis notado movimiento en esos productos. Yo empiezo en una respuesta.',
    v_author_id, v_cat_marketing, NULL
  );

  -- Hilo 3 — Atención al Cliente (con respuestas)
  INSERT INTO public.forum_threads (id, title, content, author_id, category_id, last_reply_at)
  VALUES (
    v_th_resenas,
    '¿Cómo gestionáis las reseñas negativas en Google?',
    'El otro día nos cayó una reseña de una estrella por un malentendido con un pedido. Respondimos con educación, pero me quedó la duda de si lo hicimos bien. ¿Cómo respondéis vosotros a una reseña negativa? ¿Contestáis siempre, dejáis pasar las que son injustas, intentáis llevar la conversación a privado...? Me gustaría tener un criterio claro para el equipo.',
    v_author_id, v_cat_atencion, NULL
  );

  -- Hilo 4 — Gestión (sin respuestas)
  INSERT INTO public.forum_threads (title, content, author_id, category_id)
  VALUES (
    'Plantilla de inventario: ¿cada cuánto hacéis recuento?',
    'Estoy intentando ordenar el tema del inventario y no tengo claro cada cuánto conviene hacer recuento. ¿Lo hacéis una vez al año, por secciones a lo largo del año, recuento continuo...? ¿Y qué herramienta usáis, el propio programa de gestión o algo aparte? Hay una plantilla de seguimiento en la sección de Recursos del portal, pero me interesa sobre todo vuestra rutina real.',
    v_author_id, v_cat_gestion
  );

  -- Hilo 5 — Atención al Cliente (sin respuestas)
  INSERT INTO public.forum_threads (title, content, author_id, category_id)
  VALUES (
    'Atención al cliente mayor: trucos que os funcionan',
    'Buena parte de quienes entran por la puerta son personas mayores, y la forma de atenderlas marca la diferencia en cómo nos perciben. ¿Qué cosas hacéis para que se sientan bien atendidas? Pienso en cosas prácticas: ritmo de la conversación, cómo explicáis las pautas para que no haya dudas, accesibilidad en el local... Compartamos lo que de verdad funciona en el mostrador.',
    v_author_id, v_cat_atencion
  );

  -- Hilo 6 — Novedades del Sector (sin respuestas)
  INSERT INTO public.forum_threads (title, content, author_id, category_id)
  VALUES (
    'Cambios en el margen de parafarmacia: ¿lo notáis?',
    'Llevo un tiempo con la sensación de que el margen de algunas categorías de parafarmacia se ha ido estrechando, entre precios de la distribución y la competencia online. ¿Vosotros lo estáis notando? ¿Habéis cambiado la estrategia de surtido o de precios por esto? No busco datos cerrados (cada farmacia es un mundo), sino contrastar percepciones del sector.',
    v_author_id, v_cat_novedades
  );

  -- Hilo 7 — Liderazgo -> se ubica en Gestión (no hay categoría Liderazgo
  -- en el foro pedido; el contenido encaja en Gestión del equipo).
  INSERT INTO public.forum_threads (title, content, author_id, category_id)
  VALUES (
    'Cómo motiváis al equipo sin subir sueldos',
    'No siempre se puede subir el sueldo, pero sí se puede cuidar al equipo de otras maneras. ¿Qué os funciona para mantener la motivación? Reconocimiento, formación, turnos más flexibles, repartir mejor las tareas que nadie quiere... Me interesa lo que de verdad notáis que cambia el ambiente, no la teoría. Gracias de antemano.',
    v_author_id, v_cat_gestion
  );

  -- Hilo 8 — Presentaciones (con respuesta de bienvenida)
  INSERT INTO public.forum_threads (id, title, content, author_id, category_id, is_pinned, last_reply_at)
  VALUES (
    v_th_presenta,
    'Preséntate: ¿quién hay al otro lado del mostrador?',
    'Damos la bienvenida a la comunidad de farmapro. Este es el hilo para presentarse: cuéntanos quién eres, dónde está tu farmacia (sin datos personales si no quieres), cuánto tiempo llevas en esto y qué te gustaría encontrar aquí. Cuanto mejor nos conozcamos, más útil será todo lo que compartamos. ¡Bienvenido o bienvenida!',
    v_author_id, v_cat_presenta, true, NULL
  );

  -- B.5) RESPUESTAS (forum_replies) en algunos hilos.
  --      author_id = mismo autor interno (reasignable después).
  --      Se actualiza last_reply_at del hilo a la fecha de la última respuesta.

  -- Respuestas al Hilo 1 (turnos en verano) — 2 respuestas
  INSERT INTO public.forum_replies (thread_id, content, author_id, created_at) VALUES
    (v_th_turnos,
     'En nuestro caso (somos tres) repartimos las vacaciones en bloques de dos semanas y nunca coinciden dos personas a la vez. Lo cerramos en febrero para todo el año y así no hay sorpresas. En la quincena de agosto reducimos el horario de tarde, que es cuando menos gente entra, y nos cuadra bastante bien.',
     v_author_id, NOW() - INTERVAL '2 days'),
    (v_th_turnos,
     'Nosotros tiramos de una persona de refuerzo en julio y agosto, normalmente alguien que ya ha trabajado antes con nosotros y conoce la casa. Sale a cuenta porque evita quemar al equipo fijo justo antes del otoño, que viene cargado. La plantilla de cuadrante que hay en Recursos nos ha venido bien para verlo todo de un vistazo.',
     v_author_id, NOW() - INTERVAL '1 day');

  -- Respuestas al Hilo 2 (escaparate) — 1 respuesta
  INSERT INTO public.forum_replies (thread_id, content, author_id, created_at) VALUES
    (v_th_escapar,
     'Este mes hemos montado un escaparate de fotoprotección con un fondo sencillo de tonos arena y un par de carteles hechos en una herramienta de diseño gratuita. Coste casi cero. No tengo datos cerrados, pero sí notamos que entró bastante gente preguntando por la zona del escaparate, así que algo mueve. Lo importante fue tenerlo limpio y con un solo mensaje claro.',
     v_author_id, NOW() - INTERVAL '6 hours');

  -- Respuestas al Hilo 3 (reseñas negativas) — 1 respuesta
  INSERT INTO public.forum_replies (thread_id, content, author_id, created_at) VALUES
    (v_th_resenas,
     'Mi criterio es responder siempre, también a las negativas, de forma breve y educada, y ofrecer seguir hablando en privado o por teléfono. La respuesta no es tanto para quien se queja como para quien la lee después. Lo que evito es entrar al trapo o dar detalles del caso en público. Con eso, una reseña negativa bien gestionada hasta da buena imagen.',
     v_author_id, NOW() - INTERVAL '3 hours');

  -- Respuesta al Hilo 8 (presentaciones) — 1 respuesta de bienvenida
  INSERT INTO public.forum_replies (thread_id, content, author_id, created_at) VALUES
    (v_th_presenta,
     'Abro yo las presentaciones. Llevo años detrás del mostrador en una farmacia de barrio y lo que más me interesa de farmapro es compartir ideas de gestión y de atención con gente que vive lo mismo en el día a día. Encantado de leeros. ¡Animaos a presentaros!',
     v_author_id, NOW() - INTERVAL '12 hours');

  -- B.6) Coherencia: fijar last_reply_at al máximo created_at de cada hilo
  --      que tenga respuestas (para que el orden del foro sea realista).
  UPDATE public.forum_threads t
     SET last_reply_at = sub.max_created
    FROM (
      SELECT thread_id, MAX(created_at) AS max_created
        FROM public.forum_replies
       GROUP BY thread_id
    ) sub
   WHERE t.id = sub.thread_id
     AND t.id IN (v_th_turnos, v_th_escapar, v_th_resenas, v_th_presenta);

  RAISE NOTICE 'Comunidad sembrada: % hilos, % respuestas (autor: %).',
    (SELECT COUNT(*) FROM public.forum_threads WHERE author_id = v_author_id),
    (SELECT COUNT(*) FROM public.forum_replies  WHERE author_id = v_author_id),
    v_author_id;

END $$;

-- =====================================================================
-- VERIFICACIÓN RÁPIDA (opcional, ejecutar tras el bloque anterior)
-- =====================================================================
-- -- Recursos por categoría:
-- SELECT category, COUNT(*) AS n, COUNT(*) FILTER (WHERE is_premium) AS premium
--   FROM public.resources
--  WHERE slug LIKE 'fp-rec-%'
--  GROUP BY category
--  ORDER BY category;
--
-- -- Recordatorio de archivos PENDIENTES de subir:
-- SELECT slug, file_url
--   FROM public.resources
--  WHERE slug LIKE 'fp-rec-%' AND file_url LIKE '%PENDIENTE%'
--  ORDER BY slug;
--
-- -- Hilos por categoría + nº de respuestas:
-- SELECT fc.name AS categoria, ft.title,
--        (SELECT COUNT(*) FROM public.forum_replies fr WHERE fr.thread_id = ft.id) AS respuestas
--   FROM public.forum_threads ft
--   JOIN public.forum_categories fc ON fc.id = ft.category_id
--  WHERE ft.title IN (
--     'Cómo organizáis los turnos del equipo en verano',
--     'Vuestra mejor idea de escaparate este mes',
--     '¿Cómo gestionáis las reseñas negativas en Google?',
--     'Plantilla de inventario: ¿cada cuánto hacéis recuento?',
--     'Atención al cliente mayor: trucos que os funcionan',
--     'Cambios en el margen de parafarmacia: ¿lo notáis?',
--     'Cómo motiváis al equipo sin subir sueldos',
--     'Preséntate: ¿quién hay al otro lado del mostrador?')
--  ORDER BY fc.name, ft.title;
-- =====================================================================
