-- =====================================================================
-- farmapro portal — CURSO DE MUESTRA (listo para ejecutar)
-- =====================================================================
-- Curso completo de ejemplo que sirve de PLANTILLA para sembrar el resto.
-- Categoría: ventas. Curso ancla recomendado del MVP de lanzamiento.
--
-- Título: "El mostrador que vende sin presionar: venta cruzada ética
--          en la farmacia"
-- Slug:   mostrador-vende-sin-presionar-venta-cruzada-etica
--
-- Contiene:
--   - 1 curso  (is_published = true, is_premium = false)
--   - 4 módulos con contenido REAL en HTML, escritos en la voz de farmapro
--       * Se rellena la columna JSONB courses.course_modules  <-- LO QUE LEE LA WEB
--       * Se reflejan además en las tablas relacionales course_modules /
--         course_lessons (opcional, por higiene de datos)
--   - 1 quiz   (is_active = true Y is_published = true)
--   - 5 preguntas, cada una con sus opciones
--       * Fuente de verdad para el alumno: quiz_question_options.is_correct
--       * Se rellena además quiz_questions.options (JSONB) y correct_answer
--         por compatibilidad con el panel admin / generador
--
-- ---------------------------------------------------------------------
-- CÓMO EJECUTARLO
--   Pegar este script entero en el editor SQL (vía Lovable / Supabase SQL).
--   Es una sola transacción (BEGIN/COMMIT) dentro de un bloque PL/pgSQL.
--
-- IDEMPOTENCIA / ROLLBACK
--   El script BORRA primero cualquier curso con el mismo slug (y, en cascada,
--   sus módulos, lecciones, quizzes, preguntas y opciones), así que se puede
--   re-ejecutar tantas veces como se quiera: deja siempre una sola copia limpia.
--
--   Para DESHACER por completo (borrar el curso de muestra), basta:
--     DELETE FROM public.courses
--      WHERE slug = 'mostrador-vende-sin-presionar-venta-cruzada-etica';
--   El ON DELETE CASCADE de course_modules, course_quizzes, quiz_questions y
--   quiz_question_options se encarga del resto.
--
-- NOTAS DE CONTENIDO
--   - Contenido de NEGOCIO (ventas/atención), no clínico. Sin promesas
--     sanitarias. Cifras etiquetadas como "estimación sectorial".
--   - "farmapro" en minúsculas. Castellano de España (vosotros).
--   - El HTML de cada módulo se sanea con DOMPurify y se pinta en .prose.
-- =====================================================================

DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  -- IDs estables de los módulos (se usan tanto en el JSONB como en la tabla
  -- relacional; el JSONB es el que lee la web y el progreso por módulo se
  -- guarda por este id, así que deben ser únicos y estables).
  v_mod1_id text := 'm1-por-que-no-vendemos';
  v_mod2_id text := 'm2-escucha-deteccion';
  v_mod3_id text := 'm3-recomendacion-etica';
  v_mod4_id text := 'm4-objeciones-cierre';

  -- IDs de filas relacionales (módulos) para enlazar lecciones
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

  -- -------------------------------------------------------------------
  -- 0) Limpieza idempotente: borrar curso previo con el mismo slug.
  --    El CASCADE elimina módulos/lecciones/quizzes/preguntas/opciones.
  -- -------------------------------------------------------------------
  DELETE FROM public.courses
   WHERE slug = 'mostrador-vende-sin-presionar-venta-cruzada-etica';

  -- -------------------------------------------------------------------
  -- 1) CURSO
  --    Se rellena el JSONB course_modules (lo que pinta la web) y, en
  --    paralelo, las columnas duplicadas duration_hours/duration_minutes.
  -- -------------------------------------------------------------------
  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'El mostrador que vende sin presionar: venta cruzada ética en la farmacia',
    'mostrador-vende-sin-presionar-venta-cruzada-etica',
    'Aprende a recomendar productos complementarios en el mostrador de forma útil para el cliente y respetuosa con el código deontológico. Un método en cuatro pasos —escuchar, detectar la necesidad real, recomendar con criterio y resolver objeciones— para que tu equipo deje de "colocar producto" y empiece a aconsejar bien. Pensado para titulares y auxiliares de farmacia que quieren subir el ticket medio sin presionar a nadie.',
    'ventas',
    'principiante',
    1,            -- duration_hours
    55,           -- duration_minutes
    'Laura Domínguez',
    true,         -- is_published  -> visible
    false,        -- is_premium    -> gratis para registrados
    true,         -- is_featured   -> destacado en el lanzamiento
    1,            -- order_index
    4,            -- total_lessons (4 módulos)
    -- JSONB de módulos: clave "duration" (NO duration_minutes), "id" único.
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'Por qué una buena farmacia "no vende" (y por qué no es un problema de carácter)',
        'duration', 12,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Hay un mito muy extendido en el mostrador: que vender es algo que "se lleva dentro" y que quien no ha nacido comercial nunca lo será. Es falso, y además es una excusa cómoda. Vender en una farmacia no consiste en colocar producto, sino en <strong>completar bien una dispensación</strong>: detectar lo que el cliente realmente necesita y ofrecérselo cuando aporta valor.</p>'
          || '<h3>La diferencia entre presionar y aconsejar</h3>'
          || '<p>Presionar es empujar un producto que conviene a la farmacia. Aconsejar es proponer algo que resuelve un problema del cliente. La frontera es clara y el cliente la nota al instante. Cuando el consejo es honesto, la recomendación se percibe como servicio; cuando es interesado, como venta agresiva.</p>'
          || '<ul>'
          || '<li><strong>Presión:</strong> "Llévese también esto, que está de oferta." (foco en la farmacia)</li>'
          || '<li><strong>Consejo:</strong> "Si va a tomar este antibiótico unos días, un probiótico le ayudará a llevar mejor el tratamiento. ¿Quiere que se lo explique?" (foco en el cliente)</li>'
          || '</ul>'
          || '<h3>El coste invisible de no recomendar</h3>'
          || '<p>Cada vez que se entrega un producto sin completar la necesidad, el cliente termina comprando el complemento en otro sitio —o no lo compra y vuelve con el problema sin resolver. Según estimaciones sectoriales, una parte relevante del ticket medio de parafarmacia se pierde por dispensaciones "a secas", sin acompañamiento. No es avaricia recomendarlo: es hacer bien el trabajo.</p>'
          || '<blockquote>La pregunta que cambia el chip del equipo no es "¿qué le vendo?", sino "¿qué le falta a esta persona para resolver del todo lo que ha venido a resolver?".</blockquote>'
          || '<p>En los siguientes módulos veremos el método en tres pasos —escuchar, recomendar y resolver objeciones— para que cualquier miembro del equipo, sea o no "comercial de nacimiento", pueda aplicarlo mañana mismo en el mostrador.</p>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'Escuchar antes de hablar: detectar la necesidad real',
        'duration', 14,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>La venta cruzada ética empieza por callarse. La mayoría de oportunidades se pierden porque el equipo pasa directo del "¿qué necesita?" al cobro, sin indagar. Detectar la necesidad real exige dos herramientas sencillas: <strong>preguntas abiertas</strong> y <strong>escucha activa</strong>.</p>'
          || '<h3>Preguntas que abren conversación</h3>'
          || '<p>Una pregunta cerrada (sí/no) cierra la puerta; una abierta invita a que el cliente cuente su contexto, que es donde está la oportunidad de aconsejar bien.</p>'
          || '<ul>'
          || '<li>"¿Para quién es?" — no es lo mismo un adulto que un niño o una persona mayor.</li>'
          || '<li>"¿Es la primera vez que le pasa o ya viene de antes?"</li>'
          || '<li>"¿Está tomando algo más ahora mismo?" — clave para recomendar con seguridad.</li>'
          || '<li>"¿Qué ha probado ya?" — evita repetir lo que no le ha funcionado.</li>'
          || '</ul>'
          || '<h3>Las señales que indican una segunda necesidad</h3>'
          || '<p>Muchas dispensaciones llevan asociada una necesidad complementaria evidente si se escucha. No se trata de inventar, sino de reconocer patrones honestos:</p>'
          || '<ul>'
          || '<li>Tratamiento prolongado en piel → necesidad de hidratación o fotoprotección de la zona.</li>'
          || '<li>Producto que reseca o irrita → necesidad de un cuidado que mitigue ese efecto.</li>'
          || '<li>Cliente que viene "para casa" con varios productos → oportunidad de ordenar el botiquín.</li>'
          || '</ul>'
          || '<p><strong>Importante:</strong> escuchar no es interrogar. Tres preguntas bien hechas valen más que diez. Si el cliente tiene prisa, se respeta; el objetivo es servir mejor, nunca retener a la fuerza.</p>'
          || '<blockquote>Quien escucha dos minutos recomienda con criterio. Quien no escucha, adivina —y adivinar en el mostrador se nota.</blockquote>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'Recomendar con criterio: la regla de la recomendación única y útil',
        'duration', 15,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Detectada la necesidad, llega el momento de recomendar. Aquí casi todo el mundo comete el mismo error: ofrecer demasiado. Cuando el equipo enumera cinco productos, el cliente se bloquea y no se lleva ninguno. La regla es la contraria: <strong>una recomendación, bien explicada, en el momento oportuno</strong>.</p>'
          || '<h3>El método de la recomendación única</h3>'
          || '<ol>'
          || '<li><strong>Conecta con lo que ha contado:</strong> "Como me dice que el tratamiento le reseca la piel…"</li>'
          || '<li><strong>Propón una sola cosa:</strong> "…le vendría bien una crema reparadora específica para esa zona."</li>'
          || '<li><strong>Explica el porqué, no el qué:</strong> el cliente no compra el producto, compra la razón. "Así evita la tirantez y completa mejor el tratamiento."</li>'
          || '<li><strong>Deja la decisión en su mano:</strong> "¿Quiere que se la enseñe?" Sin presión, sin dar por hecho.</li>'
          || '</ol>'
          || '<h3>Recomendar dentro del marco deontológico</h3>'
          || '<p>La recomendación se hace por criterio profesional, no por margen. Esto no es una limitación, es la base de la confianza que diferencia a una farmacia de un supermercado:</p>'
          || '<ul>'
          || '<li>No se prometen resultados de salud. Se explica para qué sirve un producto, no que "le curará".</li>'
          || '<li>Se prioriza siempre lo que el cliente necesita, aunque sea más barato o no deje margen.</li>'
          || '<li>Si no hace falta nada más, no se recomienda nada. Decir "con esto es suficiente" también construye confianza —y fideliza.</li>'
          || '</ul>'
          || '<blockquote>Una recomendación honesta que el cliente rechaza hoy vale más que una venta forzada que no vuelve mañana.</blockquote>'
      ),
      jsonb_build_object(
        'id', v_mod4_id,
        'title', 'Objeciones y cierre: qué decir cuando el cliente duda',
        'duration', 14,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Una objeción no es un "no". Es una petición de más información o de seguridad. Tratarla como un rechazo hace perder la venta y, peor, incomoda al cliente. Tratarla como una duda legítima permite acompañar la decisión.</p>'
          || '<h3>Las tres objeciones más habituales en el mostrador</h3>'
          || '<ul>'
          || '<li><strong>"Es caro."</strong> Casi nunca es el precio: es el valor percibido. Respuesta: explicar duración y uso. "Le dura aproximadamente un mes, así que el coste por día es pequeño y evita que el problema vuelva."</li>'
          || '<li><strong>"Me lo pienso."</strong> Suele faltar confianza o información. Respuesta: facilitar, no presionar. "Por supuesto. Si quiere, le anoto el nombre y lo tiene aquí cuando lo decida."</li>'
          || '<li><strong>"Ya tengo uno en casa."</strong> Oportunidad de aportar, no de insistir. Respuesta: "Perfecto, entonces no le hace falta. Si nota que no le va bien, se pasa y lo vemos."</li>'
          || '</ul>'
          || '<h3>El cierre que no parece un cierre</h3>'
          || '<p>El mejor cierre en una farmacia es una pregunta de servicio, no de venta. En lugar de "¿se lo cobro?", funciona mejor "¿se lo preparo con lo demás?". Reduce la sensación de presión y respeta el ritmo del cliente.</p>'
          || '<p>Y cuando la respuesta es no, el cierre correcto es <strong>dejar la puerta abierta</strong>: que el cliente se vaya con la sensación de haber sido bien atendido. Esa sensación es la que le hace volver, que es donde de verdad está la rentabilidad de la farmacia.</p>'
          || '<blockquote>Vender bien en el mostrador no es cerrar una venta hoy: es ganar un cliente que vuelve y que recomienda vuestra farmacia.</blockquote>'
          || '<p>Con esto cierras el método. En el cuestionario final repasarás las ideas clave para llevarlas al mostrador mañana mismo.</p>'
      )
    )
  );

  -- -------------------------------------------------------------------
  -- 1b) ESPEJO RELACIONAL (opcional). La web NO lee estas tablas hoy,
  --     pero las rellenamos por higiene de datos / panel admin futuro.
  --     Si no se desean, se puede borrar este bloque sin afectar a la web.
  -- -------------------------------------------------------------------
  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'Por qué una buena farmacia "no vende"', 'El mito del vendedor nato y el coste de no recomendar.', 1),
    (r_mod2, v_course_id, 'Escuchar antes de hablar', 'Preguntas abiertas y detección de la necesidad real.', 2),
    (r_mod3, v_course_id, 'Recomendar con criterio', 'La regla de la recomendación única y útil.', 3),
    (r_mod4, v_course_id, 'Objeciones y cierre', 'Qué decir cuando el cliente duda.', 4);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'Presionar vs. aconsejar', 'Contenido completo en la versión JSONB del módulo 1.', 12, 1, true),
    (r_mod2, 'Detectar la necesidad real', 'Contenido completo en la versión JSONB del módulo 2.', 14, 1, true),
    (r_mod3, 'La recomendación única', 'Contenido completo en la versión JSONB del módulo 3.', 15, 1, true),
    (r_mod4, 'Objeciones y cierre', 'Contenido completo en la versión JSONB del módulo 4.', 14, 1, true);

  -- -------------------------------------------------------------------
  -- 2) QUIZ  (is_active = true Y is_published = true -> visible al alumno)
  -- -------------------------------------------------------------------
  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: venta cruzada ética en el mostrador',
    'Comprueba que dominas el método de recomendación útil y respetuosa. Necesitas un 70 % para aprobar.',
    70,            -- passing_score
    NULL,          -- time_limit_minutes (sin límite)
    true,          -- is_active   -> la web lo lee
    true,          -- is_published-> coherente con el hardening de seguridad
    1
  );

  -- -------------------------------------------------------------------
  -- 3) PREGUNTAS + OPCIONES
  --    * quiz_questions.options (JSONB) y correct_answer: por compatibilidad.
  --    * quiz_question_options.is_correct: FUENTE DE VERDAD para el alumno.
  --      (correct_answer usa índice 0-based, alineado con order_index 0..n)
  -- -------------------------------------------------------------------

  -- Pregunta 1
  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     '¿Cuál es la diferencia esencial entre presionar y aconsejar en el mostrador?',
     '¿Cuál es la diferencia esencial entre presionar y aconsejar en el mostrador?',
     'multiple_choice',
     '["Aconsejar siempre implica vender un producto más caro","Presionar busca el beneficio de la farmacia; aconsejar resuelve un problema del cliente","No hay diferencia real, son dos formas de llamar a lo mismo","Aconsejar solo lo pueden hacer los farmacéuticos titulados"]'::jsonb,
     1,
     'Aconsejar pone el foco en la necesidad del cliente; presionar lo pone en el interés de la farmacia. El cliente percibe esa diferencia de inmediato.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Aconsejar siempre implica vender un producto más caro', false, 0),
    (q1, 'Presionar busca el beneficio de la farmacia; aconsejar resuelve un problema del cliente', true, 1),
    (q1, 'No hay diferencia real, son dos formas de llamar a lo mismo', false, 2),
    (q1, 'Aconsejar solo lo pueden hacer los farmacéuticos titulados', false, 3);

  -- Pregunta 2
  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     'Para detectar la necesidad real del cliente, ¿qué tipo de pregunta funciona mejor?',
     'Para detectar la necesidad real del cliente, ¿qué tipo de pregunta funciona mejor?',
     'multiple_choice',
     '["Preguntas cerradas de sí o no, para ir más rápido","Ninguna: es mejor recomendar directamente","Preguntas abiertas que inviten al cliente a dar contexto","Preguntas sobre el presupuesto que tiene disponible"]'::jsonb,
     2,
     'Las preguntas abiertas (para quién es, desde cuándo, qué ha probado) revelan el contexto donde está la oportunidad de aconsejar bien.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'Preguntas cerradas de sí o no, para ir más rápido', false, 0),
    (q2, 'Ninguna: es mejor recomendar directamente', false, 1),
    (q2, 'Preguntas abiertas que inviten al cliente a dar contexto', true, 2),
    (q2, 'Preguntas sobre el presupuesto que tiene disponible', false, 3);

  -- Pregunta 3
  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     'Según la "regla de la recomendación única", ¿cómo se debe recomendar?',
     'Según la "regla de la recomendación única", ¿cómo se debe recomendar?',
     'multiple_choice',
     '["Ofreciendo varias alternativas para que el cliente elija","Una sola recomendación, bien explicada y en el momento oportuno","Siempre el producto con más margen para la farmacia","Recomendando solo si el cliente lo pide expresamente"]'::jsonb,
     1,
     'Ofrecer demasiadas opciones bloquea la decisión. Una recomendación única, explicada por su porqué, ayuda al cliente a decidir.',
     2, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, 'Ofreciendo varias alternativas para que el cliente elija', false, 0),
    (q3, 'Una sola recomendación, bien explicada y en el momento oportuno', true, 1),
    (q3, 'Siempre el producto con más margen para la farmacia', false, 2),
    (q3, 'Recomendando solo si el cliente lo pide expresamente', false, 3);

  -- Pregunta 4
  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     'Un cliente dice "me lo pienso". ¿Cuál es la mejor respuesta dentro de una venta ética?',
     'Un cliente dice "me lo pienso". ¿Cuál es la mejor respuesta dentro de una venta ética?',
     'multiple_choice',
     '["Insistir explicando otra vez por qué le conviene","Ofrecerle un descuento inmediato para que decida ya","Facilitar la decisión sin presión: anotarle el nombre para cuando lo decida","Retirar el producto para que vea que pierde la oportunidad"]'::jsonb,
     2,
     '"Me lo pienso" suele indicar falta de información o de confianza, no un no. Se acompaña la decisión sin presionar.',
     3, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Insistir explicando otra vez por qué le conviene', false, 0),
    (q4, 'Ofrecerle un descuento inmediato para que decida ya', false, 1),
    (q4, 'Facilitar la decisión sin presión: anotarle el nombre para cuando lo decida', true, 2),
    (q4, 'Retirar el producto para que vea que pierde la oportunidad', false, 3);

  -- Pregunta 5
  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     '¿Qué actuación respeta el código deontológico al recomendar en el mostrador?',
     '¿Qué actuación respeta el código deontológico al recomendar en el mostrador?',
     'multiple_choice',
     '["Prometer al cliente que el producto le curará el problema","Explicar para qué sirve el producto sin prometer resultados de salud","Recomendar siempre algo más, aunque no haga falta","Priorizar el producto de mayor margen sobre el que necesita"]'::jsonb,
     1,
     'No se prometen resultados de salud: se explica para qué sirve un producto y se prioriza siempre lo que el cliente necesita.',
     4, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Prometer al cliente que el producto le curará el problema', false, 0),
    (q5, 'Explicar para qué sirve el producto sin prometer resultados de salud', true, 1),
    (q5, 'Recomendar siempre algo más, aunque no haga falta', false, 2),
    (q5, 'Priorizar el producto de mayor margen sobre el que necesita', false, 3);

  RAISE NOTICE 'Curso de muestra creado: % (quiz: %)', v_course_id, v_quiz_id;

END $$;

-- =====================================================================
-- VERIFICACIÓN RÁPIDA (opcional, ejecutar tras el bloque anterior)
-- =====================================================================
-- SELECT id, title, is_published, is_premium,
--        jsonb_array_length(course_modules) AS n_modulos
--   FROM public.courses
--  WHERE slug = 'mostrador-vende-sin-presionar-venta-cruzada-etica';
--
-- SELECT cq.title, cq.is_active, cq.is_published, COUNT(qq.id) AS n_preguntas
--   FROM public.course_quizzes cq
--   LEFT JOIN public.quiz_questions qq ON qq.quiz_id = cq.id
--  WHERE cq.course_id = (SELECT id FROM public.courses
--                         WHERE slug = 'mostrador-vende-sin-presionar-venta-cruzada-etica')
--  GROUP BY cq.id, cq.title, cq.is_active, cq.is_published;
--
-- -- Comprobar que cada pregunta tiene exactamente una opción correcta:
-- SELECT qq.order_index, qq.question,
--        COUNT(*) FILTER (WHERE qqo.is_correct) AS correctas
--   FROM public.quiz_questions qq
--   JOIN public.quiz_question_options qqo ON qqo.question_id = qq.id
--  WHERE qq.quiz_id = (SELECT id FROM public.course_quizzes
--                       WHERE course_id = (SELECT id FROM public.courses
--                         WHERE slug = 'mostrador-vende-sin-presionar-venta-cruzada-etica'))
--  GROUP BY qq.id, qq.order_index, qq.question
--  ORDER BY qq.order_index;
-- =====================================================================
