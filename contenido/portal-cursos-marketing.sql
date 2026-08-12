-- =====================================================================
-- farmapro portal — CURSOS DE MARKETING (listos para ejecutar)
-- =====================================================================
-- Tres cursos completos de la categoría "marketing", curados a mano en la
-- voz de farmapro. Siguen EXACTAMENTE la plantilla validada en producción
-- (portal-curso-muestra.sql) y el plan de contenido (portal-plan-contenido.md).
--
--   1) fp-mk-marketing-farmacia-desde-cero        — principiante
--   2) fp-mk-redes-sociales-google-business        — intermedio
--   3) fp-mk-fidelizacion-crm-recurrencia          — avanzado
--
-- Cada curso contiene:
--   - 1 fila en public.courses con is_published = true
--       * JSONB courses.course_modules  <-- LO QUE LEE LA WEB
--         (cada módulo: id estable, title, content HTML, duration, video_url,
--          downloadable_resources). Clave "duration", NO "duration_minutes".
--       * Columnas duplicadas duration_hours / duration_minutes coherentes.
--   - Espejo relacional opcional en course_modules / course_lessons
--     (higiene de datos; la web del alumno NO lo lee hoy).
--   - 1 quiz en course_quizzes con is_active = true Y is_published = true.
--   - 5 preguntas con question Y question_text rellenas, options (JSONB) y
--     correct_answer sincronizados con quiz_question_options
--     (exactamente una is_correct = true por pregunta; índice 0-based).
--
-- ---------------------------------------------------------------------
-- CÓMO EJECUTARLO
--   Pegar este script entero en el editor SQL (vía Lovable / Supabase SQL).
--   Son tres bloques PL/pgSQL independientes (un DO $$ ... $$ por curso).
--
-- IDEMPOTENCIA / ROLLBACK
--   Cada bloque BORRA primero el curso con su slug (y, en cascada, módulos,
--   lecciones, quizzes, preguntas y opciones), así que se puede re-ejecutar
--   tantas veces como se quiera: deja siempre una sola copia limpia.
--
--   Para DESHACER por completo estos tres cursos:
--     DELETE FROM public.courses
--      WHERE slug IN (
--        'fp-mk-marketing-farmacia-desde-cero',
--        'fp-mk-redes-sociales-google-business',
--        'fp-mk-fidelizacion-crm-recurrencia'
--      );
--   El ON DELETE CASCADE se encarga del resto.
--
-- NOTAS DE CONTENIDO
--   - Contenido de NEGOCIO (marketing de farmacia), NO clínico. Sin promesas
--     sanitarias. Cifras etiquetadas como "estimación sectorial".
--   - "farmapro" en minúsculas. Castellano de España (vosotros).
--   - El HTML de cada módulo se sanea con DOMPurify y se pinta en .prose.
--   - instructor = "Laura Domínguez" (contenido formativo).
-- =====================================================================


-- =====================================================================
-- CURSO 1 — marketing / principiante
-- "Marketing de farmacia desde cero: lo básico que sí mueve la caja"
-- slug: fp-mk-marketing-farmacia-desde-cero
-- =====================================================================
DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  -- IDs estables de los módulos (se usan en el JSONB que lee la web; el
  -- progreso por módulo se guarda por este id, así que deben ser únicos).
  v_mod1_id text := 'm1-que-es-marketing-farmacia';
  v_mod2_id text := 'm2-escaparate-que-para';
  v_mod3_id text := 'm3-carteleria-que-se-lee';
  v_mod4_id text := 'm4-calendario-estacional';

  -- IDs de filas relacionales (espejo opcional)
  r_mod1 uuid := gen_random_uuid();
  r_mod2 uuid := gen_random_uuid();
  r_mod3 uuid := gen_random_uuid();
  r_mod4 uuid := gen_random_uuid();

  -- IDs de preguntas del quiz
  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
  q5 uuid := gen_random_uuid();
BEGIN

  -- 0) Limpieza idempotente
  DELETE FROM public.courses
   WHERE slug = 'fp-mk-marketing-farmacia-desde-cero';

  -- 1) CURSO
  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'Marketing de farmacia desde cero: lo básico que sí mueve la caja',
    'fp-mk-marketing-farmacia-desde-cero',
    'Marketing de farmacia sin humo y sin presupuestos imposibles. Aprende lo básico que de verdad mueve la caja: un escaparate que para a la gente, una cartelería que se lee de un vistazo y un calendario estacional para no llegar siempre tarde a la temporada. Pensado para titulares y equipos que parten de cero y quieren resultados con lo que ya tienen en la farmacia, sin agencia y sin invertir de más.',
    'marketing',
    'principiante',
    1,            -- duration_hours
    50,           -- duration_minutes
    'Laura Domínguez',
    true,         -- is_published
    false,        -- is_premium (gratis para registrados)
    true,         -- is_featured
    10,           -- order_index
    4,            -- total_lessons
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'Qué es (y qué no es) el marketing en una farmacia',
        'duration', 11,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Cuando a un titular de farmacia le hablan de "marketing", lo primero que muchos piensan es en publicidad cara, descuentos agresivos o en "vender por vender". Nada de eso encaja con una farmacia, y por suerte tampoco hace falta. El marketing de farmacia es algo mucho más sencillo y más honesto: <strong>hacer que la gente sepa que existís, entienda lo que ofrecéis y os elija antes que a la de enfrente</strong>, sin traicionar el código deontológico ni convertir el mostrador en un bazar.</p>'
          || '<h3>Marketing no es gritar, es ordenar lo que ya hacéis bien</h3>'
          || '<p>Vuestra farmacia ya hace marketing aunque no lo llaméis así: el rótulo, el escaparate, cómo saludáis, el orden de los lineales, la cara que ponéis cuando entra alguien con prisa. Todo eso comunica. El problema no suele ser falta de marketing, sino que ese marketing está <strong>descuidado o disperso</strong>. Este curso no os pide inventar nada nuevo, sino poner orden en lo que ya tenéis para que trabaje a vuestro favor.</p>'
          || '<ul>'
          || '<li><strong>NO es</strong> prometer resultados de salud ("esta crema le quitará las arrugas"). Eso, además de incumplir el código deontológico, destruye la confianza.</li>'
          || '<li><strong>NO es</strong> tirar los precios. Una farmacia que solo compite por precio pierde, porque siempre habrá alguien (online) más barato.</li>'
          || '<li><strong>SÍ es</strong> ser visibles, claros y útiles: que se entienda qué problemas ayudáis a resolver y por qué merece la pena entrar.</li>'
          || '</ul>'
          || '<h3>Las tres palancas básicas (las del curso)</h3>'
          || '<p>De todo lo que se puede hacer, hay tres cosas baratas y al alcance de cualquier farmacia que mueven la aguja de verdad:</p>'
          || '<ol>'
          || '<li><strong>El escaparate</strong>: vuestro mejor "anuncio", y es gratis. Pasa gente por delante todos los días.</li>'
          || '<li><strong>La cartelería interior</strong>: lo que guía al cliente dentro y le hace descubrir lo que no venía a buscar.</li>'
          || '<li><strong>El calendario estacional</strong>: anticiparse a la temporada (alergia, vuelta al cole, gripe, verano) en lugar de reaccionar tarde.</li>'
          || '</ol>'
          || '<blockquote>El mejor marketing para una farmacia de barrio no es el más caro: es el más constante. Más vale un escaparate decente cambiado cada mes que uno espectacular una vez al año.</blockquote>'
          || '<p><strong>Mini-ejercicio:</strong> salid a la acera y mirad vuestra fachada como si fuerais un cliente nuevo. ¿Se entiende en tres segundos qué problema podéis resolverle hoy? Apuntad lo primero que pensáis. Eso es vuestro punto de partida.</p>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'El escaparate que para a la gente (con cero presupuesto)',
        'duration', 13,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>El escaparate es el cartel publicitario más rentable que tenéis: lo ven cientos de personas al día y no cuesta un euro de medios. Y sin embargo, en muchas farmacias lleva meses igual, lleno de producto amontonado y carteles del laboratorio descoloridos. Un buen escaparate no necesita dinero, necesita <strong>una idea clara y mano de obra de una tarde</strong>.</p>'
          || '<h3>La regla de los tres segundos</h3>'
          || '<p>Quien pasa por delante no se detiene a leer: mira de reojo mientras camina. Si en tres segundos no capta UNA idea, ha pasado de largo. Por eso el error más común es <strong>meter demasiado</strong>. Un escaparate que quiere decir diez cosas no dice ninguna. Elegid un solo mensaje por temporada y dadle protagonismo.</p>'
          || '<ul>'
          || '<li><strong>Un tema, no diez:</strong> "Protección solar", no "solar + repelente + after-sun + vitaminas + ortopedia".</li>'
          || '<li><strong>Un mensaje grande y legible:</strong> que se lea desde el otro lado de la calle, no con letra de prospecto.</li>'
          || '<li><strong>Espacio vacío:</strong> el hueco no es desperdicio, es lo que hace que el ojo se fije en lo importante.</li>'
          || '</ul>'
          || '<h3>Anatomía de un escaparate que funciona</h3>'
          || '<p>Una composición sencilla que cualquiera puede montar:</p>'
          || '<ol>'
          || '<li><strong>Foco visual</strong> a la altura de los ojos (entre 1,40 y 1,70 m): el producto o cartel estrella.</li>'
          || '<li><strong>Mensaje corto</strong> que conecte con la necesidad del momento ("Llega el calor: protege tu piel").</li>'
          || '<li><strong>Apoyo</strong>: dos o tres productos relacionados, no veinte. Agrupados, no en fila india.</li>'
          || '<li><strong>Llamada suave</strong>: "Te asesoramos dentro", "Pregunta a tu farmacéutico". Sin presión, invitando.</li>'
          || '</ol>'
          || '<h3>Caso de mostrador</h3>'
          || '<p>Una farmacia de barrio cambió su escaparate de "todo a la vez" por uno mensual con un único tema. El primer mes, fotoprotección; el cliente entraba ya preguntando por el solar que había visto. No hubo inversión, solo decisión y constancia. Según estimaciones sectoriales, un escaparate temático y rotado mensualmente mejora notablemente las consultas espontáneas en mostrador frente a uno estático.</p>'
          || '<blockquote>Si vuestro escaparate intenta venderlo todo, no vende nada. Elegid una historia al mes y contadla bien.</blockquote>'
          || '<p><strong>Mini-ejercicio:</strong> reservad una mañana al mes en la agenda del equipo (siempre la misma, por ejemplo el primer lunes) para cambiar el escaparate. Ponerlo en el calendario es lo que evita que pasen seis meses con el mismo.</p>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'Cartelería interior: guiar al cliente sin que parezca venta',
        'duration', 13,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Una vez dentro, el cliente no se va a recorrer toda la farmacia leyendo cajas. La cartelería interior es lo que le orienta, le informa y, de paso, le hace descubrir productos que no venía a buscar. Bien hecha, es un vendedor silencioso que trabaja sin presionar; mal hecha, es ruido que nadie lee.</p>'
          || '<h3>Tipos de cartel y para qué sirve cada uno</h3>'
          || '<ul>'
          || '<li><strong>De orientación</strong>: indican secciones ("Dermocosmética", "Bebé", "Ortopedia"). Ahorran preguntas y hacen la farmacia más cómoda.</li>'
          || '<li><strong>De consejo</strong>: aportan valor sin vender directamente ("3 señales de que tu piel necesita más hidratación en invierno"). Posicionan a la farmacia como experta.</li>'
          || '<li><strong>De temporada</strong>: conectan con la campaña del escaparate ("Operación alergia: ven y te explicamos").</li>'
          || '<li><strong>De recordatorio</strong>: servicios que ofrecéis y que mucha gente no sabe ("Aquí tomamos la tensión", "Preparamos tu SPD").</li>'
          || '</ul>'
          || '<h3>Reglas para que un cartel se lea de verdad</h3>'
          || '<ol>'
          || '<li><strong>Una idea por cartel.</strong> Igual que el escaparate: si dice mucho, no dice nada.</li>'
          || '<li><strong>Beneficio antes que producto.</strong> "Duerme mejor estas noches de calor" funciona mejor que el nombre comercial de una marca.</li>'
          || '<li><strong>Letra grande y poco texto.</strong> Si hay que acercarse a leerlo, sobra la mitad.</li>'
          || '<li><strong>Coherencia visual.</strong> Mismos colores y tipos en todos los carteles: transmite orden y profesionalidad. Carteles dispares dan sensación de descuido.</li>'
          || '<li><strong>Nada de promesas de salud.</strong> Se informa y se aconseja, nunca se promete curar. Es deontología, pero también es lo que sostiene la confianza.</li>'
          || '</ol>'
          || '<h3>El error de la "selva de carteles"</h3>'
          || '<p>Cuando cada laboratorio deja su expositor y su cartel, la farmacia acaba pareciendo un mercadillo y el cliente desconecta. Menos carteles, mejor colocados, rinden mucho más. Una buena norma: por cada cartel nuevo que entra, uno viejo que sale.</p>'
          || '<blockquote>El cliente no lee carteles: los ojea. Vuestro trabajo es que en ese ojeo capte algo útil, no que se pierda en un muro de papel.</blockquote>'
          || '<p><strong>Mini-ejercicio:</strong> contad cuántos carteles hay ahora mismo en vuestra farmacia. Si son más de los que podéis leer de un paseo rápido, sobran. Quitad los caducados y los del laboratorio que ya no toca: ganaréis claridad al instante.</p>'
      ),
      jsonb_build_object(
        'id', v_mod4_id,
        'title', 'El calendario estacional: dejar de llegar tarde a la temporada',
        'duration', 13,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>El gran enemigo del marketing de farmacia no es la falta de ideas: es la improvisación. Llega el primer día de calor y nadie ha preparado el escaparate solar; aparece el polen y los antihistamínicos siguen en el almacén. El calendario estacional resuelve esto de un plumazo: <strong>planificar con antelación lo que ya sabéis que va a pasar</strong>.</p>'
          || '<h3>La farmacia tiene un año muy predecible</h3>'
          || '<p>A diferencia de otros negocios, en una farmacia las temporadas se repiten casi calcadas cada año. Eso es una ventaja enorme: no hay que adivinar, solo anticiparse. Un calendario básico podría ser:</p>'
          || '<ul>'
          || '<li><strong>Enero-febrero</strong>: propósitos (dejar de fumar, control de peso), cuidado de la piel por frío.</li>'
          || '<li><strong>Marzo-mayo</strong>: alergias primaverales, preparación solar, vitaminas de cambio de estación.</li>'
          || '<li><strong>Junio-agosto</strong>: fotoprotección, repelentes, after-sun, botiquín de viaje, pies.</li>'
          || '<li><strong>Septiembre</strong>: vuelta al cole (piojos, refuerzo inmune), retomar rutinas.</li>'
          || '<li><strong>Octubre-diciembre</strong>: gripe y resfriados, sequedad de piel, regalos de cosmética en Navidad.</li>'
          || '</ul>'
          || '<h3>La regla de "un mes antes"</h3>'
          || '<p>La clave es preparar cada campaña <strong>antes</strong> de que el cliente la necesite, no cuando ya la está pidiendo. Si la gente empieza a preguntar por el solar en mayo, el escaparate solar tiene que estar montado en abril. Llegar el primero a la temporada es lo que diferencia a la farmacia que marca tendencia de la que va siempre a remolque.</p>'
          || '<h3>Cómo montar vuestro calendario en una tarde</h3>'
          || '<ol>'
          || '<li><strong>Coged un calendario anual</strong> y marcad las 6-8 temporadas claras de vuestra zona (puede variar: costa, interior, barrio con muchas familias…).</li>'
          || '<li><strong>Para cada una</strong>, anotad: tema del escaparate, cartelería de apoyo y un consejo útil para compartir.</li>'
          || '<li><strong>Restad un mes</strong> a cada fecha: esa es la señal para empezar a preparar.</li>'
          || '<li><strong>Repartid responsabilidades</strong> en el equipo: quién monta, quién pide producto, quién hace el cartel.</li>'
          || '</ol>'
          || '<blockquote>Vuestro año en la farmacia es previsible. Quien planifica las temporadas con un mes de margen deja de improvisar y empieza a ir por delante de la de enfrente.</blockquote>'
          || '<p>Con esto cerráis lo básico que mueve la caja: ser visibles (escaparate), guiar bien dentro (cartelería) y anticiparos (calendario). En el cuestionario final repasaréis las ideas clave para empezar mañana mismo.</p>'
      )
    )
  );

  -- 1b) ESPEJO RELACIONAL (opcional; la web del alumno no lo lee hoy)
  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'Qué es (y qué no es) el marketing en una farmacia', 'Marketing como orden de lo que ya hacéis bien; las tres palancas básicas.', 1),
    (r_mod2, v_course_id, 'El escaparate que para a la gente', 'La regla de los tres segundos y anatomía de un escaparate eficaz.', 2),
    (r_mod3, v_course_id, 'Cartelería interior', 'Guiar al cliente sin que parezca venta; evitar la selva de carteles.', 3),
    (r_mod4, v_course_id, 'El calendario estacional', 'Anticiparse a las temporadas con la regla de "un mes antes".', 4);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'Qué es y qué no es el marketing de farmacia', 'Contenido completo en la versión JSONB del módulo 1.', 11, 1, true),
    (r_mod2, 'El escaparate que para a la gente', 'Contenido completo en la versión JSONB del módulo 2.', 13, 1, true),
    (r_mod3, 'Cartelería interior que se lee', 'Contenido completo en la versión JSONB del módulo 3.', 13, 1, true),
    (r_mod4, 'El calendario estacional', 'Contenido completo en la versión JSONB del módulo 4.', 13, 1, true);

  -- 2) QUIZ
  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: marketing de farmacia desde cero',
    'Comprueba que dominas lo básico del marketing de farmacia: escaparate, cartelería y calendario estacional. Necesitas un 70 % para aprobar.',
    70, NULL, true, true, 1
  );

  -- 3) PREGUNTAS + OPCIONES
  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     '¿Qué describe mejor el marketing de una farmacia tal y como se plantea en este curso?',
     '¿Qué describe mejor el marketing de una farmacia tal y como se plantea en este curso?',
     'multiple_choice',
     '["Bajar los precios para competir con la farmacia online","Ser visibles, claros y útiles sin prometer resultados de salud","Prometer al cliente que un producto le curará su problema","Llenar la farmacia con el máximo de carteles y expositores posible"]'::jsonb,
     1,
     'El marketing de farmacia consiste en ser visibles, claros y útiles dentro del marco deontológico: ni competir solo por precio ni prometer resultados sanitarios.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Bajar los precios para competir con la farmacia online', false, 0),
    (q1, 'Ser visibles, claros y útiles sin prometer resultados de salud', true, 1),
    (q1, 'Prometer al cliente que un producto le curará su problema', false, 2),
    (q1, 'Llenar la farmacia con el máximo de carteles y expositores posible', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     'Según la "regla de los tres segundos", ¿cómo debe ser un buen escaparate?',
     'Según la "regla de los tres segundos", ¿cómo debe ser un buen escaparate?',
     'multiple_choice',
     '["Debe mostrar el máximo número de productos para que haya donde elegir","Debe transmitir una sola idea clara que se capte de un vistazo","Debe cambiarse como mucho una vez al año","Debe estar lleno para que no se vea ningún hueco vacío"]'::jsonb,
     1,
     'Quien pasa por delante apenas mira de reojo: si en tres segundos no capta UNA idea, ha pasado de largo. Un tema por temporada y espacio para que destaque.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'Debe mostrar el máximo número de productos para que haya donde elegir', false, 0),
    (q2, 'Debe transmitir una sola idea clara que se capte de un vistazo', true, 1),
    (q2, 'Debe cambiarse como mucho una vez al año', false, 2),
    (q2, 'Debe estar lleno para que no se vea ningún hueco vacío', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     '¿Cuál es una buena práctica para la cartelería interior de la farmacia?',
     '¿Cuál es una buena práctica para la cartelería interior de la farmacia?',
     'multiple_choice',
     '["Poner cuanta más información mejor en cada cartel","Una idea por cartel, con el beneficio por delante del producto","Aceptar todos los carteles de los laboratorios para no perder ninguno","Usar colores y tipografías distintas en cada cartel para llamar la atención"]'::jsonb,
     1,
     'El cliente ojea, no lee: una idea por cartel, beneficio antes que producto, poco texto y coherencia visual. Menos carteles bien puestos rinden más.',
     2, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, 'Poner cuanta más información mejor en cada cartel', false, 0),
    (q3, 'Una idea por cartel, con el beneficio por delante del producto', true, 1),
    (q3, 'Aceptar todos los carteles de los laboratorios para no perder ninguno', false, 2),
    (q3, 'Usar colores y tipografías distintas en cada cartel para llamar la atención', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     'La "regla de un mes antes" del calendario estacional significa que…',
     'La "regla de un mes antes" del calendario estacional significa que…',
     'multiple_choice',
     '["Hay que esperar a que los clientes pidan el producto para montar la campaña","Cada campaña se prepara aproximadamente un mes antes de que el cliente la necesite","El escaparate solo se cambia una vez al mes pase lo que pase","Las temporadas de la farmacia son impredecibles y no se pueden planificar"]'::jsonb,
     1,
     'Anticiparse es la clave: si la gente pregunta por el solar en mayo, el escaparate solar debe estar listo en abril. Llegar el primero a la temporada marca la diferencia.',
     3, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Hay que esperar a que los clientes pidan el producto para montar la campaña', false, 0),
    (q4, 'Cada campaña se prepara aproximadamente un mes antes de que el cliente la necesite', true, 1),
    (q4, 'El escaparate solo se cambia una vez al mes pase lo que pase', false, 2),
    (q4, 'Las temporadas de la farmacia son impredecibles y no se pueden planificar', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     '¿Qué actuación respeta el código deontológico en la comunicación de la farmacia?',
     '¿Qué actuación respeta el código deontológico en la comunicación de la farmacia?',
     'multiple_choice',
     '["Un cartel que promete que una crema eliminará las arrugas","Informar y aconsejar sobre para qué sirve un producto, sin prometer curar","Asegurar en el escaparate resultados de salud garantizados","Comparar agresivamente vuestros precios con los de la competencia"]'::jsonb,
     1,
     'En farmacia se informa y se aconseja, nunca se prometen resultados de salud. Es deontología y, además, es lo que sostiene la confianza del cliente.',
     4, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Un cartel que promete que una crema eliminará las arrugas', false, 0),
    (q5, 'Informar y aconsejar sobre para qué sirve un producto, sin prometer curar', true, 1),
    (q5, 'Asegurar en el escaparate resultados de salud garantizados', false, 2),
    (q5, 'Comparar agresivamente vuestros precios con los de la competencia', false, 3);

  RAISE NOTICE 'Curso 1 creado: % (quiz: %)', v_course_id, v_quiz_id;

END $$;


-- =====================================================================
-- CURSO 2 — marketing / intermedio
-- "Redes sociales y Google Business Profile para tu farmacia"
-- slug: fp-mk-redes-sociales-google-business
-- =====================================================================
DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  v_mod1_id text := 'm1-google-business-profile';
  v_mod2_id text := 'm2-resenas-que-deciden';
  v_mod3_id text := 'm3-contenido-local-redes';
  v_mod4_id text := 'm4-calendario-y-constancia';

  r_mod1 uuid := gen_random_uuid();
  r_mod2 uuid := gen_random_uuid();
  r_mod3 uuid := gen_random_uuid();
  r_mod4 uuid := gen_random_uuid();

  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
  q5 uuid := gen_random_uuid();
BEGIN

  -- 0) Limpieza idempotente
  DELETE FROM public.courses
   WHERE slug = 'fp-mk-redes-sociales-google-business';

  -- 1) CURSO
  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'Redes sociales y Google Business Profile para tu farmacia',
    'fp-mk-redes-sociales-google-business',
    'La gente busca "farmacia cerca de mí" antes de salir de casa, y elige por lo que ve en Google y en redes. Este curso te enseña a poner a punto tu ficha de Google Business Profile, a conseguir y responder reseñas sin perder los nervios y a crear contenido local en Instagram y Facebook que de verdad acerque clientes a tu mostrador. Marketing digital de proximidad, práctico y dentro del código deontológico.',
    'marketing',
    'intermedio',
    1,            -- duration_hours
    10,           -- duration_minutes (1 h 10 min)
    'Laura Domínguez',
    true,         -- is_published
    false,        -- is_premium
    false,        -- is_featured
    11,           -- order_index
    4,            -- total_lessons
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'Google Business Profile: la ficha que decide quién entra por la puerta',
        'duration', 16,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Antes de elegir farmacia, mucha gente hace lo mismo: saca el móvil y busca "farmacia cerca de mí" o "farmacia de guardia". Lo que aparece en ese momento —el mapa, las fichas, las estrellas— decide a qué puerta llaman. Esa ficha es vuestro <strong>Google Business Profile</strong> (antes "Google My Business"), y es probablemente la herramienta de marketing local más potente que tenéis. Es gratuita y, aun así, en muchas farmacias está incompleta o desactualizada.</p>'
          || '<h3>Por qué la ficha pesa tanto</h3>'
          || '<p>Google muestra primero las fichas que considera más completas, activas y relevantes para quien busca cerca. Una ficha bien trabajada aparece más arriba en el mapa, y aparecer arriba significa que os ven justo cuando alguien necesita una farmacia. Según estimaciones sectoriales, una parte muy alta de las búsquedas locales en móvil terminan en una visita el mismo día: es tráfico caliente, gente con una necesidad inmediata.</p>'
          || '<h3>Checklist de una ficha de farmacia bien puesta</h3>'
          || '<ul>'
          || '<li><strong>Nombre y dirección exactos</strong>, tal y como figuran en el rótulo. Coherencia total con la realidad.</li>'
          || '<li><strong>Horario correcto y actualizado</strong>, incluidos festivos y guardias. Nada irrita más que llegar y encontrar cerrado cuando Google decía "abierto".</li>'
          || '<li><strong>Teléfono y enlace</strong> a la web o a WhatsApp si lo usáis para consultas.</li>'
          || '<li><strong>Categoría correcta</strong>: "Farmacia" como principal, y secundarias si procede (p. ej. ortopedia).</li>'
          || '<li><strong>Fotos reales y recientes</strong>: fachada, interior, equipo. Las fichas con fotos propias generan mucha más confianza que las que solo tienen el icono de Google.</li>'
          || '<li><strong>Servicios y atributos</strong>: acceso adaptado, parking cercano, si tomáis la tensión, SPD, etc.</li>'
          || '</ul>'
          || '<h3>La ficha está viva: las publicaciones</h3>'
          || '<p>Google permite publicar novedades en la ficha (como mini-posts). Aprovechadlo para anunciar campañas de temporada o servicios ("Ya tenemos la campaña de fotoprotección", "Tomamos la tensión sin cita"). Una ficha que publica de vez en cuando le dice a Google que la farmacia está activa, y eso ayuda a posicionarse.</p>'
          || '<blockquote>Vuestra ficha de Google es vuestro escaparate digital. Está abierta 24 horas y la ve gente que aún no os conoce. Tenerla a medias es como tener la persiana medio bajada.</blockquote>'
          || '<p><strong>Mini-ejercicio:</strong> buscad ahora mismo vuestra farmacia en Google desde el móvil. ¿El horario es correcto? ¿Hay fotos vuestras o solo de Street View? ¿Aparece lo que os hace distintos? Apuntad tres arreglos y hacedlos esta semana.</p>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'Reseñas: cómo conseguirlas y responderlas sin perder los nervios',
        'duration', 17,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Las reseñas son el boca a boca del siglo XXI. Antes, un cliente contento se lo decía a tres personas; hoy lo escribe en Google y lo leen cientos. Para una farmacia, las estrellas y los comentarios influyen tanto en quién entra como en cómo os posiciona Google. La buena noticia: se pueden trabajar de forma honesta y sin presionar a nadie.</p>'
          || '<h3>Cómo conseguir más reseñas (sin comprarlas jamás)</h3>'
          || '<p>Comprar reseñas o inventarlas está prohibido y, si Google lo detecta, penaliza la ficha. Lo que sí funciona es <strong>pedirlas bien</strong> a quien ya está satisfecho:</p>'
          || '<ul>'
          || '<li><strong>Pedid en el momento bueno:</strong> justo cuando un cliente os agradece algo ("menos mal que me lo explicasteis"). Ahí es natural decir: "Nos ayudaría mucho que lo contara en Google, si tiene un momento".</li>'
          || '<li><strong>Ponedlo fácil:</strong> un código QR en el mostrador o en el tique que lleve directo a dejar la reseña. Cuantos menos pasos, más reseñas.</li>'
          || '<li><strong>Implicad al equipo:</strong> que todo el mundo sepa pedirlas con naturalidad, sin agobiar. Una petición amable al día suma muchísimo en un mes.</li>'
          || '</ul>'
          || '<h3>Responder reseñas: todas, también las buenas</h3>'
          || '<p>Responder demuestra que estáis pendientes. A las positivas, un gracias breve y personal. A las negativas, la respuesta importa más todavía, porque la lee mucha más gente que la propia persona que se quejó.</p>'
          || '<h3>El método para una reseña negativa</h3>'
          || '<ol>'
          || '<li><strong>Respirad antes de escribir.</strong> Nunca respondáis en caliente ni a la defensiva.</li>'
          || '<li><strong>Agradeced y reconoced</strong> la experiencia: "Sentimos que la espera no fuera la que esperaba".</li>'
          || '<li><strong>No discutáis en público</strong> ni deis datos del cliente: la confidencialidad es sagrada en una farmacia.</li>'
          || '<li><strong>Llevad la conversación fuera:</strong> "Nos gustaría entenderlo mejor, ¿puede pasarse o llamarnos?".</li>'
          || '<li><strong>Tono sereno y profesional.</strong> Quien lee valora más a la farmacia que responde con educación que la reseña enfadada.</li>'
          || '</ol>'
          || '<blockquote>Una reseña negativa bien respondida convence más que diez positivas. Demuestra cómo tratáis a la gente cuando algo no sale perfecto.</blockquote>'
          || '<p><strong>Mini-ejercicio:</strong> redactad hoy una plantilla de respuesta para reseña positiva y otra para negativa, en vuestra voz. Tenerlas preparadas evita responder en caliente y que el equipo improvise cada vez.</p>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'Contenido local en Instagram y Facebook: cercanía, no escaparate',
        'duration', 19,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>El error más común de una farmacia en redes es usarlas como un catálogo: foto de producto, precio, foto de producto, precio. Aburre y nadie lo sigue. Las redes de una farmacia de barrio funcionan cuando transmiten <strong>cercanía y confianza</strong>: que detrás del mostrador hay personas que saben y que se preocupan. El objetivo no es vender en Instagram, es que cuando esa persona necesite algo, piense en vosotros.</p>'
          || '<h3>Qué publicar: la regla 15-15-15</h3>'
          || '<p>Una forma sencilla de equilibrar el contenido es repartirlo en tres tercios:</p>'
          || '<ul>'
          || '<li><strong>Un tercio de consejo útil</strong> (sin prometer salud): "Tres gestos para cuidar la piel con el cambio de estación", "Cómo conservar bien los medicamentos en verano".</li>'
          || '<li><strong>Un tercio de cercanía</strong>: el equipo, el día a día, el cambio de escaparate, la mascota que entra siempre. Esto humaniza y es lo que más conecta.</li>'
          || '<li><strong>Un tercio de servicio o temporada</strong>: campañas, servicios que ofrecéis, recordatorios ("Ya está aquí la vacuna de la gripe, pregúntanos").</li>'
          || '</ul>'
          || '<h3>Local, local y local</h3>'
          || '<p>Vuestra ventaja frente a las grandes marcas y las farmacias online es la proximidad. Aprovechadla: mencionad el barrio, las fiestas del pueblo, el cole de al lado en septiembre. Usad ubicación y etiquetas locales en las publicaciones. A Instagram y a vuestros vecinos les interesa lo cercano, no un post genérico que podría ser de cualquier farmacia de España.</p>'
          || '<h3>Cosas que NO se hacen</h3>'
          || '<ul>'
          || '<li>Prometer resultados de salud o "curas". Se informa y se aconseja, nunca se promete.</li>'
          || '<li>Mostrar a clientes o datos sin permiso. La confidencialidad va por delante de cualquier foto bonita.</li>'
          || '<li>Publicidad de medicamentos sujetos a prescripción (está prohibida). El contenido se centra en consejo, parafarmacia y servicios.</li>'
          || '<li>Copiar tendencias que no encajan con una farmacia solo porque "funcionan". La coherencia con vuestra imagen vale más que un trend.</li>'
          || '</ul>'
          || '<blockquote>Nadie sigue a una farmacia por sus precios; la siguen porque le cae bien y se fía. En redes vendéis confianza, no producto.</blockquote>'
          || '<p><strong>Mini-ejercicio:</strong> preparad tres publicaciones siguiendo el 15-15-15 (una de consejo, una de equipo, una de temporada) y dejadlas listas para esta semana. Veréis que cuesta menos cuando tenéis el molde.</p>'
      ),
      jsonb_build_object(
        'id', v_mod4_id,
        'title', 'Constancia sin morir en el intento: calendario y reparto en el equipo',
        'duration', 18,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>El motivo número uno por el que una farmacia abandona las redes no es la falta de ideas: es la falta de sistema. Se empieza con mucha energía, se publica a diario una semana y al mes siguiente la cuenta está muerta. Una cuenta abandonada da peor imagen que no tener ninguna. La solución no es publicar más, es <strong>publicar de forma sostenible</strong>.</p>'
          || '<h3>Menos es más: la frecuencia realista</h3>'
          || '<p>No hace falta publicar cada día. Para una farmacia, <strong>una o dos publicaciones de calidad a la semana, mantenidas en el tiempo</strong>, rinden mucho más que una avalancha que dura quince días y se apaga. Lo que premia el algoritmo —y la gente— es la regularidad, no el volumen.</p>'
          || '<h3>El calendario de contenidos en una hora al mes</h3>'
          || '<ol>'
          || '<li><strong>Una vez al mes</strong>, sentaos media hora y planificad las publicaciones de las cuatro semanas, apoyándoos en el calendario estacional (alergia, vuelta al cole, gripe…).</li>'
          || '<li><strong>Aplicad el 15-15-15</strong>: repartid consejo, cercanía y servicio para no caer siempre en lo mismo.</li>'
          || '<li><strong>Preparad varias de golpe</strong> (foto + texto) y programadlas. Producir en bloque cunde mucho más que improvisar a diario.</li>'
          || '<li><strong>Dejad hueco para lo espontáneo</strong>: una foto del escaparate nuevo o del equipo aporta frescura entre lo planificado.</li>'
          || '</ol>'
          || '<h3>Repartir para que no recaiga en una sola persona</h3>'
          || '<p>Si las redes dependen solo del titular, mueren en cuanto hay un pico de trabajo. Repartid: alguien hace fotos, alguien escribe, alguien responde mensajes y reseñas. Y un detalle clave de servicio: <strong>los mensajes privados y comentarios se responden</strong>. Dejar a alguien en visto en redes es como no coger el teléfono en el mostrador.</p>'
          || '<h3>Mirar si funciona (sin obsesionarse)</h3>'
          || '<p>No hace falta volverse analista. Cada mes, un vistazo rápido: qué publicación gustó más, si llegan consultas o gente que dice "os vi en Instagram". Eso basta para repetir lo que conecta y dejar lo que no. La métrica que de verdad importa no son los "me gusta", sino que entre más gente por la puerta.</p>'
          || '<blockquote>En redes gana la tortuga, no la liebre. Una publicación buena a la semana durante un año pesa más que treinta en un mes y luego silencio.</blockquote>'
          || '<p>Con esto cerráis el método digital: ficha de Google a punto, reseñas trabajadas, contenido local con sentido y un sistema para mantenerlo. En el cuestionario final repasaréis lo esencial para aplicarlo ya.</p>'
      )
    )
  );

  -- 1b) ESPEJO RELACIONAL (opcional)
  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'Google Business Profile', 'La ficha local: por qué pesa tanto y checklist para dejarla a punto.', 1),
    (r_mod2, v_course_id, 'Reseñas', 'Conseguirlas de forma honesta y responder las negativas con criterio.', 2),
    (r_mod3, v_course_id, 'Contenido local en redes', 'Cercanía frente a catálogo; la regla 15-15-15 y qué no hacer.', 3),
    (r_mod4, v_course_id, 'Constancia y calendario', 'Frecuencia realista, calendario mensual y reparto en el equipo.', 4);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'La ficha que decide quién entra', 'Contenido completo en la versión JSONB del módulo 1.', 16, 1, true),
    (r_mod2, 'Reseñas sin perder los nervios', 'Contenido completo en la versión JSONB del módulo 2.', 17, 1, true),
    (r_mod3, 'Contenido local en redes', 'Contenido completo en la versión JSONB del módulo 3.', 19, 1, true),
    (r_mod4, 'Constancia y reparto en el equipo', 'Contenido completo en la versión JSONB del módulo 4.', 18, 1, true);

  -- 2) QUIZ
  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: redes sociales y Google Business Profile',
    'Comprueba que sabes poner a punto tu ficha de Google, trabajar las reseñas y crear contenido local con constancia. Necesitas un 70 % para aprobar.',
    70, NULL, true, true, 1
  );

  -- 3) PREGUNTAS + OPCIONES
  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     '¿Por qué es tan importante tener bien cuidada la ficha de Google Business Profile de la farmacia?',
     '¿Por qué es tan importante tener bien cuidada la ficha de Google Business Profile de la farmacia?',
     'multiple_choice',
     '["Porque sustituye por completo a la página web","Porque es lo que ve mucha gente al buscar farmacia cerca y decide a qué puerta va","Porque permite vender medicamentos con receta por internet","Porque elimina la necesidad de tener redes sociales"]'::jsonb,
     1,
     'La ficha es el escaparate digital: aparece en las búsquedas locales (farmacia cerca de mí, de guardia) y una ficha completa y activa se posiciona mejor y atrae visitas el mismo día.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Porque sustituye por completo a la página web', false, 0),
    (q1, 'Porque es lo que ve mucha gente al buscar farmacia cerca y decide a qué puerta va', true, 1),
    (q1, 'Porque permite vender medicamentos con receta por internet', false, 2),
    (q1, 'Porque elimina la necesidad de tener redes sociales', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     '¿Cuál es una forma correcta y honesta de conseguir más reseñas?',
     '¿Cuál es una forma correcta y honesta de conseguir más reseñas?',
     'multiple_choice',
     '["Comprar paquetes de reseñas para subir la nota rápido","Pedirlas con naturalidad a clientes satisfechos y ponérselo fácil con un QR","Escribir reseñas falsas desde varias cuentas","Ofrecer un descuento a cambio de cada cinco estrellas"]'::jsonb,
     1,
     'Comprar o inventar reseñas está prohibido y Google lo penaliza. Lo que funciona es pedirlas en el momento bueno a quien ya está contento y reducir los pasos con un QR.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'Comprar paquetes de reseñas para subir la nota rápido', false, 0),
    (q2, 'Pedirlas con naturalidad a clientes satisfechos y ponérselo fácil con un QR', true, 1),
    (q2, 'Escribir reseñas falsas desde varias cuentas', false, 2),
    (q2, 'Ofrecer un descuento a cambio de cada cinco estrellas', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     'Ante una reseña negativa, ¿cuál es la mejor forma de actuar?',
     'Ante una reseña negativa, ¿cuál es la mejor forma de actuar?',
     'multiple_choice',
     '["Responder en caliente defendiéndose y dando detalles del caso","Ignorarla para que pase desapercibida","Agradecer, no discutir en público ni dar datos del cliente, y llevar la conversación fuera","Borrar la cuenta de Google para que no se vea"]'::jsonb,
     2,
     'La respuesta a una reseña negativa la lee mucha gente: serenidad, reconocer la experiencia, proteger la confidencialidad y ofrecer resolverlo en privado. Eso convence más que diez positivas.',
     2, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, 'Responder en caliente defendiéndose y dando detalles del caso', false, 0),
    (q3, 'Ignorarla para que pase desapercibida', false, 1),
    (q3, 'Agradecer, no discutir en público ni dar datos del cliente, y llevar la conversación fuera', true, 2),
    (q3, 'Borrar la cuenta de Google para que no se vea', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     'Según la regla 15-15-15, ¿cómo conviene repartir el contenido en redes de la farmacia?',
     'Según la regla 15-15-15, ¿cómo conviene repartir el contenido en redes de la farmacia?',
     'multiple_choice',
     '["Solo fotos de producto con su precio","En tres tercios: consejo útil, cercanía del equipo y servicio o temporada","Únicamente promociones y ofertas","Copiando los trends de moda aunque no encajen con una farmacia"]'::jsonb,
     1,
     'El 15-15-15 equilibra el contenido en tres tercios: consejo útil (sin prometer salud), cercanía y servicio o temporada. Así se transmite confianza en lugar de parecer un catálogo.',
     3, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Solo fotos de producto con su precio', false, 0),
    (q4, 'En tres tercios: consejo útil, cercanía del equipo y servicio o temporada', true, 1),
    (q4, 'Únicamente promociones y ofertas', false, 2),
    (q4, 'Copiando los trends de moda aunque no encajen con una farmacia', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     'En cuanto a la constancia en redes, ¿qué planteamiento es el más sostenible para una farmacia?',
     'En cuanto a la constancia en redes, ¿qué planteamiento es el más sostenible para una farmacia?',
     'multiple_choice',
     '["Publicar todos los días aunque luego se abandone la cuenta en un mes","Una o dos publicaciones de calidad a la semana mantenidas en el tiempo, con el trabajo repartido","Publicar solo cuando hay una oferta importante","Dejar toda la gestión en manos del titular en exclusiva"]'::jsonb,
     1,
     'Gana la regularidad, no el volumen: una o dos publicaciones buenas a la semana sostenidas, con un calendario mensual y el trabajo repartido en el equipo para que no se abandone.',
     4, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Publicar todos los días aunque luego se abandone la cuenta en un mes', false, 0),
    (q5, 'Una o dos publicaciones de calidad a la semana mantenidas en el tiempo, con el trabajo repartido', true, 1),
    (q5, 'Publicar solo cuando hay una oferta importante', false, 2),
    (q5, 'Dejar toda la gestión en manos del titular en exclusiva', false, 3);

  RAISE NOTICE 'Curso 2 creado: % (quiz: %)', v_course_id, v_quiz_id;

END $$;


-- =====================================================================
-- CURSO 3 — marketing / avanzado
-- "Fidelización y CRM: que vuelvan más y más a menudo"
-- slug: fp-mk-fidelizacion-crm-recurrencia
-- =====================================================================
DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  v_mod1_id text := 'm1-por-que-recurrencia';
  v_mod2_id text := 'm2-datos-y-segmentacion';
  v_mod3_id text := 'm3-campanas-que-hacen-volver';
  v_mod4_id text := 'm4-medir-recurrencia';

  r_mod1 uuid := gen_random_uuid();
  r_mod2 uuid := gen_random_uuid();
  r_mod3 uuid := gen_random_uuid();
  r_mod4 uuid := gen_random_uuid();

  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
  q5 uuid := gen_random_uuid();
BEGIN

  -- 0) Limpieza idempotente
  DELETE FROM public.courses
   WHERE slug = 'fp-mk-fidelizacion-crm-recurrencia';

  -- 1) CURSO
  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'Fidelización y CRM: que vuelvan más y más a menudo',
    'fp-mk-fidelizacion-crm-recurrencia',
    'Captar un cliente nuevo cuesta varias veces más que cuidar a uno que ya tienes (estimación sectorial). Este curso avanzado te enseña a convertir el fichero de tu farmacia en un sistema de recurrencia: segmentar tu base de clientes, diseñar campañas que de verdad hacen volver y medir la recurrencia con indicadores sencillos. Marketing relacional con cabeza, respetando el RGPD y el código deontológico. Recomendado tras los cursos de marketing inicial e intermedio.',
    'marketing',
    'avanzado',
    1,            -- duration_hours
    20,           -- duration_minutes (1 h 20 min)
    'Laura Domínguez',
    true,         -- is_published
    true,         -- is_premium (gancho de suscripción para nivel avanzado)
    false,        -- is_featured
    12,           -- order_index
    4,            -- total_lessons
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'Por qué la recurrencia es la mina de oro de la farmacia',
        'duration', 18,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>La mayoría del esfuerzo de marketing se va en atraer gente nueva. Pero el verdadero motor de rentabilidad de una farmacia no está en quien entra por primera vez, sino en <strong>quien vuelve, y vuelve más a menudo</strong>. Captar un cliente nuevo cuesta varias veces más que conservar uno que ya os conoce (estimación sectorial). Y un cliente fiel no solo compra más: os recomienda, perdona un fallo puntual y es mucho menos sensible al precio de la farmacia de enfrente.</p>'
          || '<h3>Las tres palancas de la recurrencia</h3>'
          || '<p>Que un cliente vuelva más y gaste más depende de tres variables que se pueden trabajar:</p>'
          || '<ul>'
          || '<li><strong>Frecuencia</strong>: cada cuánto viene. Subirla un poco en muchos clientes mueve la caja más que una gran venta puntual.</li>'
          || '<li><strong>Ticket medio</strong>: cuánto se lleva cada vez (aquí enlaza la venta cruzada ética del curso de ventas).</li>'
          || '<li><strong>Retención</strong>: cuánto tiempo sigue siendo cliente antes de "perderse". Recuperar a quien deja de venir es oro puro.</li>'
          || '</ul>'
          || '<h3>Fidelización no es solo "la tarjeta de puntos"</h3>'
          || '<p>Muchas farmacias reducen la fidelización a una tarjeta que acumula puntos. Está bien, pero es la parte más pequeña. La fidelización de verdad es <strong>relación</strong>: que el cliente sienta que en vuestra farmacia le conocen, le aconsejan bien y se acuerdan de él. La tarjeta es una herramienta; la confianza es el activo.</p>'
          || '<h3>Del fichero al CRM: el cambio de mentalidad</h3>'
          || '<p>Vuestro programa de gestión ya guarda muchísima información: quién compra qué, cada cuánto, qué tratamientos crónicos sigue. La mayoría de farmacias usan esos datos solo para facturar. Un enfoque CRM (gestión de la relación con el cliente) consiste en <strong>usar esa información para cuidar mejor</strong>: anticiparse a una renovación, recordar una revisión, recomendar lo adecuado en el momento adecuado. No es vender más a la fuerza: es servir mejor, y el resultado es que vuelven más.</p>'
          || '<blockquote>Una farmacia que solo piensa en captar es un cubo con agujeros: por mucha agua que eche, se vacía. La recurrencia es tapar los agujeros, y ahí está casi toda la rentabilidad.</blockquote>'
          || '<p><strong>Mini-ejercicio:</strong> estimad qué porcentaje de vuestra caja viene de clientes habituales frente a esporádicos. Aunque sea a ojo, ese número os hará ver por qué cuidar al que vuelve es la prioridad.</p>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'Segmentar tu base: dejar de tratar a todos por igual (con cabeza y con RGPD)',
        'duration', 21,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Tratar a todos los clientes igual es cómodo, pero es marketing de hace veinte años. No tiene sentido mandar el mismo mensaje a una madre con hijos pequeños, a una persona mayor con tratamiento crónico y a alguien que entra una vez al año a por protector solar. Segmentar es <strong>agrupar a vuestros clientes por algo que tienen en común</strong> para hablarles de lo que de verdad les interesa.</p>'
          || '<h3>Segmentaciones útiles en una farmacia</h3>'
          || '<ul>'
          || '<li><strong>Por frecuencia/valor (modelo RFM):</strong> recencia (cuándo vino por última vez), frecuencia (cada cuánto) e importe. Permite distinguir al cliente fiel del que se está enfriando.</li>'
          || '<li><strong>Por etapa de vida o necesidad</strong>: familias con bebés, personas mayores, deportistas, cuidado dermocosmético. Sin entrar nunca en datos clínicos sensibles para campañas.</li>'
          || '<li><strong>Por crónicos / renovación</strong>: clientes con tratamiento continuado a quienes ayuda un recordatorio de renovación o un servicio de preparación (SPD).</li>'
          || '<li><strong>Por inactividad</strong>: quien hace meses que no aparece. Un segmento clave para campañas de recuperación.</li>'
          || '</ul>'
          || '<h3>El cliente "en riesgo": el más rentable de recuperar</h3>'
          || '<p>De todos los segmentos, el más rentable suele ser el de quien <strong>solía venir y ha dejado de hacerlo</strong>. Recuperarlo cuesta menos que captar a uno nuevo y, además, os avisa de si algo se está torciendo. Detectarlo a tiempo (gracias a los datos) y darle un motivo para volver es de las acciones de mayor retorno que existen.</p>'
          || '<h3>RGPD y deontología: la línea que no se cruza</h3>'
          || '<p>Usar los datos del cliente obliga a hacerlo bien. No es burocracia: es la base de la confianza, que en una farmacia es todo.</p>'
          || '<ol>'
          || '<li><strong>Consentimiento</strong>: para enviar comunicaciones comerciales hace falta que el cliente lo haya aceptado de forma clara.</li>'
          || '<li><strong>Datos de salud = especialmente protegidos</strong>: no se usan datos clínicos para segmentar campañas comerciales. La confidencialidad es sagrada.</li>'
          || '<li><strong>Finalidad y minimización</strong>: se pide y se usa solo lo necesario, y para lo que se dijo.</li>'
          || '<li><strong>Derecho a salir siempre</strong>: cada comunicación debe permitir darse de baja con un clic.</li>'
          || '</ol>'
          || '<blockquote>Segmentar no es espiar al cliente: es dejar de molestarle con lo que no le interesa para hablarle solo de lo que le sirve. Bien hecho, el cliente lo agradece.</blockquote>'
          || '<p><strong>Mini-ejercicio:</strong> definid tres segmentos sencillos que podríais sacar hoy de vuestro programa (p. ej. "habituales", "crónicos con renovación" e "inactivos de más de 6 meses"). Empezar con tres es más que suficiente.</p>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'Campañas que hacen volver: del recordatorio útil al club de fidelización',
        'duration', 21,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Con la base segmentada, las campañas dejan de ser un mensaje genérico para todos y pasan a ser <strong>el mensaje adecuado, a la persona adecuada, en el momento adecuado</strong>. Aquí no se trata de bombardear con ofertas, sino de dar motivos útiles para volver. Una buena campaña de farmacia casi siempre parece un favor, no una venta.</p>'
          || '<h3>Tipos de campaña de recurrencia que funcionan</h3>'
          || '<ul>'
          || '<li><strong>Recordatorios útiles</strong>: aviso de renovación de un producto de uso continuado, recordatorio de revisión de tensión, "ya tienes disponible tu preparación". Pura utilidad, cero presión.</li>'
          || '<li><strong>Campañas de temporada segmentadas</strong>: la operación alergia solo a quien le interesa, la vuelta al cole a familias con niños. Enlaza con el calendario estacional del curso inicial.</li>'
          || '<li><strong>Recuperación de inactivos</strong>: un mensaje cercano a quien hace tiempo que no viene ("hace un tiempo que no te vemos, ¿todo bien?"). Más relación que descuento.</li>'
          || '<li><strong>Club o programa de fidelización</strong>: la tarjeta y las ventajas, sí, pero acompañadas de trato y consejo. El punto fideliza poco solo; el punto + la relación, mucho.</li>'
          || '<li><strong>Fechas señaladas</strong>: una felicitación de cumpleaños sin venta detrás genera más vínculo que cualquier promoción.</li>'
          || '</ul>'
          || '<h3>Canales: el adecuado para cada cliente</h3>'
          || '<p>No todo el mundo quiere lo mismo. El email funciona para contenido y campañas; el SMS o WhatsApp, para recordatorios breves y oportunos (con consentimiento). Y el canal más potente sigue siendo el <strong>mostrador</strong>: una frase a tiempo del equipo ("la próxima vez recuérdame que te enseñe esto") fideliza más que diez correos. Lo digital apoya; la relación humana cierra.</p>'
          || '<h3>La regla de oro: aportar antes que pedir</h3>'
          || '<p>Si cada vez que el cliente recibe noticias vuestras es para venderle algo, acabará ignorándoos o dándose de baja. La proporción sana es <strong>aportar mucho y pedir poco</strong>: consejos, recordatorios y detalles útiles; y de vez en cuando, una propuesta comercial. Así, cuando llega la propuesta, el cliente la recibe con confianza en lugar de con rechazo.</p>'
          || '<blockquote>La mejor campaña de fidelización no parece una campaña: parece que la farmacia se acuerda de ti y se preocupa. Esa sensación es la que hace volver.</blockquote>'
          || '<p><strong>Mini-ejercicio:</strong> diseñad una campaña de recuperación de inactivos en tres líneas: a quién (segmento), por qué canal y con qué mensaje útil (no una oferta sin más). Es la campaña con mejor retorno para empezar.</p>'
      ),
      jsonb_build_object(
        'id', v_mod4_id,
        'title', 'Medir la recurrencia: pocos números, pero los que importan',
        'duration', 20,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Lo que no se mide, no se mejora. Pero medir en una farmacia no significa montar cuadros de mando imposibles: significa mirar <strong>tres o cuatro números cada mes</strong> y actuar en consecuencia. El objetivo es saber si vuestros clientes vuelven más y compran mejor con el tiempo, no llenar una hoja de cálculo.</p>'
          || '<h3>Los indicadores que de verdad importan</h3>'
          || '<ul>'
          || '<li><strong>Frecuencia de visita</strong>: cuántas veces viene de media un cliente al año. Si sube, la fidelización funciona.</li>'
          || '<li><strong>Tasa de retención</strong>: qué porcentaje de clientes del año pasado siguen comprando este. Es el termómetro de la salud de la base.</li>'
          || '<li><strong>Tasa de recuperación</strong>: de los inactivos a los que escribís, cuántos vuelven. Mide el retorno de las campañas de recuperación.</li>'
          || '<li><strong>Valor del cliente en el tiempo</strong>: cuánto deja de media un cliente a lo largo de su relación con la farmacia. Pone en perspectiva lo que vale cuidarlo.</li>'
          || '</ul>'
          || '<h3>Probar, medir, ajustar</h3>'
          || '<p>El marketing relacional avanzado funciona por iteración, no por adivinación. El método es siempre el mismo:</p>'
          || '<ol>'
          || '<li><strong>Lanzáis</strong> una campaña a un segmento concreto.</li>'
          || '<li><strong>Medís</strong> qué pasó: cuántos volvieron, cuánto compraron, frente a un grupo que no la recibió.</li>'
          || '<li><strong>Aprendéis</strong> qué mensaje y qué canal funcionaron mejor.</li>'
          || '<li><strong>Repetís</strong> lo que funciona y descartáis lo que no. Cada ciclo afina el siguiente.</li>'
          || '</ol>'
          || '<h3>El cuadro de mando de una hoja</h3>'
          || '<p>No necesitáis software caro. Una hoja de cálculo con esos cuatro indicadores, revisada una vez al mes en una reunión corta de equipo, basta para tomar decisiones. Lo importante no es la herramienta, es <strong>la disciplina de mirarlos y actuar</strong>. Una farmacia que revisa su recurrencia cada mes va siempre por delante de la que solo mira la caja del día.</p>'
          || '<blockquote>No midáis por medir. Elegid cuatro números, miradlos cada mes y dejad que os digan qué repetir y qué cambiar. Esa es la diferencia entre hacer marketing y improvisar.</blockquote>'
          || '<p>Con esto cerráis el método de fidelización: entender la recurrencia, segmentar bien, lanzar campañas que aportan y medir para mejorar. En el cuestionario final repasaréis las ideas clave para construir vuestro sistema de clientes que vuelven.</p>'
      )
    )
  );

  -- 1b) ESPEJO RELACIONAL (opcional)
  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'Por qué la recurrencia es la mina de oro', 'Frecuencia, ticket y retención; del fichero al CRM.', 1),
    (r_mod2, v_course_id, 'Segmentar tu base', 'RFM, etapas de vida e inactivos; RGPD y deontología.', 2),
    (r_mod3, v_course_id, 'Campañas que hacen volver', 'Recordatorios, recuperación, club; aportar antes que pedir.', 3),
    (r_mod4, v_course_id, 'Medir la recurrencia', 'Cuatro indicadores y el ciclo probar-medir-ajustar.', 4);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'La recurrencia como motor de rentabilidad', 'Contenido completo en la versión JSONB del módulo 1.', 18, 1, true),
    (r_mod2, 'Segmentar con cabeza y con RGPD', 'Contenido completo en la versión JSONB del módulo 2.', 21, 1, true),
    (r_mod3, 'Campañas que hacen volver', 'Contenido completo en la versión JSONB del módulo 3.', 21, 1, true),
    (r_mod4, 'Medir la recurrencia', 'Contenido completo en la versión JSONB del módulo 4.', 20, 1, true);

  -- 2) QUIZ
  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: fidelización y CRM en la farmacia',
    'Comprueba que dominas la recurrencia: segmentación, campañas que hacen volver y medición con criterio. Necesitas un 70 % para aprobar.',
    70, NULL, true, true, 1
  );

  -- 3) PREGUNTAS + OPCIONES
  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     '¿Por qué la recurrencia (que el cliente vuelva) es tan importante para la rentabilidad de la farmacia?',
     '¿Por qué la recurrencia (que el cliente vuelva) es tan importante para la rentabilidad de la farmacia?',
     'multiple_choice',
     '["Porque captar un cliente nuevo es siempre más barato que conservar uno","Porque conservar a un cliente cuesta varias veces menos que captar uno nuevo, y el fiel compra más y recomienda","Porque permite subir los precios sin que nadie se queje","Porque la tarjeta de puntos sustituye a la atención del equipo"]'::jsonb,
     1,
     'Conservar a un cliente cuesta varias veces menos que captar uno nuevo (estimación sectorial). Además, el cliente fiel compra más, recomienda y es menos sensible al precio.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Porque captar un cliente nuevo es siempre más barato que conservar uno', false, 0),
    (q1, 'Porque conservar a un cliente cuesta varias veces menos que captar uno nuevo, y el fiel compra más y recomienda', true, 1),
    (q1, 'Porque permite subir los precios sin que nadie se queje', false, 2),
    (q1, 'Porque la tarjeta de puntos sustituye a la atención del equipo', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     '¿Qué es segmentar la base de clientes de la farmacia?',
     '¿Qué es segmentar la base de clientes de la farmacia?',
     'multiple_choice',
     '["Enviar el mismo mensaje a todos para no dejarse a nadie","Agrupar a los clientes por algo en común para hablarles de lo que les interesa","Quedarse solo con los clientes que más gastan y olvidar al resto","Usar los datos clínicos de los pacientes para lanzar ofertas"]'::jsonb,
     1,
     'Segmentar es agrupar por un rasgo común (frecuencia, etapa de vida, inactividad) para dirigir a cada grupo lo que de verdad le sirve, nunca usando datos clínicos para campañas.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'Enviar el mismo mensaje a todos para no dejarse a nadie', false, 0),
    (q2, 'Agrupar a los clientes por algo en común para hablarles de lo que les interesa', true, 1),
    (q2, 'Quedarse solo con los clientes que más gastan y olvidar al resto', false, 2),
    (q2, 'Usar los datos clínicos de los pacientes para lanzar ofertas', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     'Al usar los datos de clientes para campañas, ¿qué exige el RGPD y la deontología farmacéutica?',
     'Al usar los datos de clientes para campañas, ¿qué exige el RGPD y la deontología farmacéutica?',
     'multiple_choice',
     '["Se puede escribir a cualquiera mientras el mensaje sea útil","Hace falta consentimiento, no usar datos de salud para campañas y permitir la baja siempre","Los datos clínicos se pueden usar si mejoran la oferta al cliente","Basta con avisar una vez y ya no hace falta volver a pedir permiso"]'::jsonb,
     1,
     'Para comunicaciones comerciales se necesita consentimiento, jamás se usan datos de salud (especialmente protegidos) para segmentar campañas y toda comunicación debe permitir darse de baja.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, 'Se puede escribir a cualquiera mientras el mensaje sea útil', false, 0),
    (q3, 'Hace falta consentimiento, no usar datos de salud para campañas y permitir la baja siempre', true, 1),
    (q3, 'Los datos clínicos se pueden usar si mejoran la oferta al cliente', false, 2),
    (q3, 'Basta con avisar una vez y ya no hace falta volver a pedir permiso', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     '¿Cuál es la "regla de oro" de las campañas de fidelización de la farmacia?',
     '¿Cuál es la "regla de oro" de las campañas de fidelización de la farmacia?',
     'multiple_choice',
     '["Pedir una compra en cada comunicación para rentabilizar el envío","Aportar mucho y pedir poco: sobre todo utilidad, y de vez en cuando una propuesta","Enviar el máximo de ofertas posibles cada semana","Comunicar solo por un canal para todos los clientes por igual"]'::jsonb,
     1,
     'La proporción sana es aportar mucho (consejos, recordatorios, detalles) y pedir poco. Así, cuando llega una propuesta comercial, el cliente la recibe con confianza, no con rechazo.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Pedir una compra en cada comunicación para rentabilizar el envío', false, 0),
    (q4, 'Aportar mucho y pedir poco: sobre todo utilidad, y de vez en cuando una propuesta', true, 1),
    (q4, 'Enviar el máximo de ofertas posibles cada semana', false, 2),
    (q4, 'Comunicar solo por un canal para todos los clientes por igual', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     'A la hora de medir la recurrencia, ¿qué enfoque recomienda el curso?',
     'A la hora de medir la recurrencia, ¿qué enfoque recomienda el curso?',
     'multiple_choice',
     '["Montar cuadros de mando complejos con decenas de métricas","Seguir tres o cuatro indicadores clave cada mes y actuar con el ciclo probar-medir-ajustar","No medir, porque la fidelización es intangible","Mirar solo la caja del día y olvidarse de la base de clientes"]'::jsonb,
     1,
     'Bastan tres o cuatro indicadores (frecuencia, retención, recuperación, valor del cliente) revisados cada mes, dentro de un ciclo de probar, medir, aprender y repetir lo que funciona.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Montar cuadros de mando complejos con decenas de métricas', false, 0),
    (q5, 'Seguir tres o cuatro indicadores clave cada mes y actuar con el ciclo probar-medir-ajustar', true, 1),
    (q5, 'No medir, porque la fidelización es intangible', false, 2),
    (q5, 'Mirar solo la caja del día y olvidarse de la base de clientes', false, 3);

  RAISE NOTICE 'Curso 3 creado: % (quiz: %)', v_course_id, v_quiz_id;

END $$;


-- =====================================================================
-- VERIFICACIÓN RÁPIDA (opcional, ejecutar tras los bloques anteriores)
-- =====================================================================
-- 1) Los 3 cursos publicados con sus módulos en el JSONB:
-- SELECT slug, difficulty, is_published, is_premium,
--        jsonb_array_length(course_modules) AS n_modulos
--   FROM public.courses
--  WHERE slug IN (
--    'fp-mk-marketing-farmacia-desde-cero',
--    'fp-mk-redes-sociales-google-business',
--    'fp-mk-fidelizacion-crm-recurrencia'
--  )
--  ORDER BY order_index;
--
-- 2) Los 3 quizzes activos y publicados, con su nº de preguntas:
-- SELECT c.slug, cq.is_active, cq.is_published, COUNT(qq.id) AS n_preguntas
--   FROM public.course_quizzes cq
--   JOIN public.courses c ON c.id = cq.course_id
--   LEFT JOIN public.quiz_questions qq ON qq.quiz_id = cq.id
--  WHERE c.slug LIKE 'fp-mk-%'
--  GROUP BY c.slug, cq.id, cq.is_active, cq.is_published
--  ORDER BY c.slug;
--
-- 3) Cada pregunta con EXACTAMENTE una opción correcta:
-- SELECT c.slug, qq.order_index, qq.question,
--        COUNT(*) FILTER (WHERE qqo.is_correct) AS correctas
--   FROM public.quiz_question_options qqo
--   JOIN public.quiz_questions qq ON qq.id = qqo.question_id
--   JOIN public.course_quizzes cq ON cq.id = qq.quiz_id
--   JOIN public.courses c ON c.id = cq.course_id
--  WHERE c.slug LIKE 'fp-mk-%'
--  GROUP BY c.slug, qq.id, qq.order_index, qq.question
--  ORDER BY c.slug, qq.order_index;
-- =====================================================================
