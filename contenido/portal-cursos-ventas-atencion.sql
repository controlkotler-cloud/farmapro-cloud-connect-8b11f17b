-- =====================================================================
-- farmapro portal — CURSOS DE VENTAS Y ATENCIÓN (listos para ejecutar)
-- =====================================================================
-- Cuatro cursos completos, curados a mano en la voz de farmapro, para
-- sembrar el portal de formación (farmapro-portal, Supabase).
-- Misma plantilla validada en producción: portal-curso-muestra.sql.
--
-- Cursos incluidos:
--   1. ventas / principiante  — "Fundamentos de la venta en la farmacia"
--      slug: fp-vt-fundamentos-venta-farmacia
--   2. ventas / avanzado      — "Venta consultiva y categorías de alto margen"
--      slug: fp-vt-venta-consultiva-categorias-alto-margen
--   3. atencion / principiante— "Atención al cliente excepcional en el mostrador"
--      slug: fp-at-atencion-cliente-excepcional-mostrador
--   4. atencion / intermedio  — "Quejas y clientes difíciles: convertir fricción en fidelidad"
--      slug: fp-at-quejas-clientes-dificiles-friccion-fidelidad
--
-- Cada curso contiene:
--   - 1 fila en public.courses  (is_published = true)
--       * Se rellena la columna JSONB courses.course_modules  <-- LO QUE LEE LA WEB
--         (cada módulo: id estable string, title, duration en MINUTOS,
--          content en HTML semántico, video_url, downloadable_resources)
--       * Se rellenan las columnas duplicadas duration_hours / duration_minutes.
--       * Se reflejan además las tablas relacionales course_modules /
--         course_lessons (espejo opcional, por higiene de datos).
--   - 1 quiz en public.course_quizzes (is_active = true Y is_published = true)
--   - quiz_questions (con question Y question_text) + opciones
--       * Fuente de verdad para el alumno: quiz_question_options.is_correct
--         (exactamente UNA opción is_correct=true por pregunta).
--       * Se rellenan también quiz_questions.options (JSONB) y correct_answer
--         (índice 0-based, sincronizado con order_index de las opciones) por
--         compatibilidad con el panel admin / generador.
--
-- ---------------------------------------------------------------------
-- CÓMO EJECUTARLO
--   Pegar este script entero en el editor SQL (vía Lovable / Supabase SQL).
--   Son cuatro bloques DO $$ ... $$ independientes (uno por curso). Se pueden
--   ejecutar los cuatro de una vez o de uno en uno.
--
-- IDEMPOTENCIA / ROLLBACK
--   Cada bloque BORRA primero cualquier curso con su mismo slug (y, en cascada,
--   sus módulos, lecciones, quizzes, preguntas y opciones), así que el script
--   se puede re-ejecutar tantas veces como se quiera: deja siempre una sola
--   copia limpia de cada curso.
--
--   Para DESHACER por completo (borrar estos cuatro cursos), basta:
--     DELETE FROM public.courses WHERE slug IN (
--       'fp-vt-fundamentos-venta-farmacia',
--       'fp-vt-venta-consultiva-categorias-alto-margen',
--       'fp-at-atencion-cliente-excepcional-mostrador',
--       'fp-at-quejas-clientes-dificiles-friccion-fidelidad'
--     );
--   El ON DELETE CASCADE de course_modules, course_quizzes, quiz_questions y
--   quiz_question_options se encarga del resto.
--
-- NOTAS DE CONTENIDO
--   - Contenido de NEGOCIO (ventas/atención), no clínico. Sin promesas
--     sanitarias. Cifras etiquetadas como "estimación sectorial".
--   - "farmapro" en minúsculas. Castellano de España (vosotros).
--   - instructor = "Laura Domínguez" (contenido formativo/editorial).
--   - El HTML de cada módulo se sanea con DOMPurify y se pinta en .prose.
-- =====================================================================


-- =====================================================================
-- CURSO 1 — ventas / principiante
-- "Fundamentos de la venta en la farmacia"
-- slug: fp-vt-fundamentos-venta-farmacia
-- =====================================================================
DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  -- IDs estables de los módulos (en el JSONB y en la tabla relacional).
  v_mod1_id text := 'm1-vender-es-ayudar';
  v_mod2_id text := 'm2-escucha-activa';
  v_mod3_id text := 'm3-venta-como-servicio';
  v_mod4_id text := 'm4-completar-dispensacion';

  -- IDs de filas relacionales (módulos) para enlazar lecciones.
  r_mod1 uuid := gen_random_uuid();
  r_mod2 uuid := gen_random_uuid();
  r_mod3 uuid := gen_random_uuid();
  r_mod4 uuid := gen_random_uuid();

  -- IDs de preguntas del quiz.
  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
  q5 uuid := gen_random_uuid();
BEGIN

  -- 0) Limpieza idempotente.
  DELETE FROM public.courses WHERE slug = 'fp-vt-fundamentos-venta-farmacia';

  -- 1) CURSO + JSONB course_modules.
  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'Fundamentos de la venta en la farmacia',
    'fp-vt-fundamentos-venta-farmacia',
    'El punto de partida para todo el equipo de mostrador. Aquí no aprenderéis a "colocar producto", sino a entender qué es vender de verdad en una farmacia: ayudar bien. Veréis por qué la venta es un servicio sanitario más, cómo la escucha activa convierte una dispensación corriente en una recomendación útil, y cómo completar bien cada atención sin presionar a nadie. Pensado para auxiliares y titulares que arrancan de cero y quieren un método sencillo para aplicar mañana mismo.',
    'ventas',
    'principiante',
    1,            -- duration_hours
    56,           -- duration_minutes
    'Laura Domínguez',
    true,         -- is_published
    false,        -- is_premium  (gratis para registrados)
    false,        -- is_featured
    10,           -- order_index
    4,            -- total_lessons
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'Vender es ayudar: qué significa de verdad vender en una farmacia',
        'duration', 13,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Hay una frase que se oye mucho detrás del mostrador: "yo es que no sirvo para vender". Y casi siempre es mentira. Quien la dice suele ser justo la persona que mejor escucha al cliente, la que recuerda que la señora del tercero toma algo para la tensión y la que se preocupa de verdad. Eso <strong>ya es vender bien</strong>. El problema es que tenemos metida en la cabeza una idea equivocada de lo que es vender.</p>'
          || '<p>Vender en una farmacia no es empujar productos ni inflar el ticket. Es <strong>completar bien una atención</strong>: entender qué necesita la persona que tenéis delante y ofrecerle lo que de verdad le va a ayudar, cuando le va a ayudar. Ni más, ni menos. Si lo miráis así, vender deja de dar reparo, porque no estáis haciendo nada distinto de lo que ya hacéis: cuidar al cliente.</p>'
          || '<h3>La farmacia es un canal de salud, no un supermercado</h3>'
          || '<p>Esta es la diferencia que lo cambia todo. En un supermercado el objetivo es que el carro salga lleno. En una farmacia el objetivo es que el cliente salga <strong>bien atendido</strong>, y eso a veces significa venderle dos cosas y otras veces decirle "con esto que ya tiene en casa es suficiente, no le hace falta nada más". Las dos respuestas son una buena venta, porque las dos construyen confianza.</p>'
          || '<p>El cliente nota la diferencia al instante. Cuando percibe que le aconsejáis pensando en él, vuelve. Cuando percibe que le estáis colocando lo que a la farmacia le interesa, también lo nota, y aunque compre hoy, no vuelve mañana. Y la rentabilidad de una farmacia no está en la venta de hoy: está en el cliente que vuelve durante veinte años.</p>'
          || '<h3>Por qué no recomendar también es un error</h3>'
          || '<p>El miedo a "parecer comercial" lleva a muchos equipos al extremo contrario: no recomendar nada nunca. Y eso tampoco es neutral. Cuando se entrega un producto sin completar la necesidad, pasa una de dos cosas: el cliente compra el complemento en otro sitio, o no lo compra y vuelve a casa con el problema a medio resolver. Según estimaciones sectoriales, una parte relevante del ticket medio de parafarmacia se pierde por atenciones "a secas", sin acompañamiento. No recomendar lo que la persona necesita no es prudencia: es dejar el trabajo a medias.</p>'
          || '<blockquote>La pregunta que cambia el chip de todo el equipo no es "¿qué le vendo?", sino "¿qué le falta a esta persona para resolver del todo lo que ha venido a resolver?".</blockquote>'
          || '<p>A lo largo del curso veremos cómo hacerlo paso a paso: escuchar para detectar la necesidad real, entender la venta como un servicio y completar bien la atención sin presionar. Nada de técnicas agresivas. Solo hacer mejor lo que ya hacéis.</p>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Pensad en la última vez que un cliente os dijo "ah, pues no sabía que teníais eso" al iros vosotros a buscar algo. Esa frase es una venta perdida que se recuperó por pura escucha. Anotad tres productos o servicios de vuestra farmacia que los clientes <strong>no saben que ofrecéis</strong>. Esos tres son vuestra primera oportunidad de "vender ayudando".</p>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'Escucha activa: cómo detectar lo que el cliente necesita de verdad',
        'duration', 15,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>La mejor herramienta de venta de una farmacia no es un argumentario: es saber escuchar. La mayoría de oportunidades de ayudar mejor se pierden porque el equipo pasa directo del "¿qué necesita?" al cobro, sin indagar lo justo. Escuchar de verdad —lo que se llama <strong>escucha activa</strong>— consiste en prestar atención completa a lo que dice el cliente, y también a lo que no dice, antes de hablar.</p>'
          || '<h3>Preguntas abiertas: la llave para que el cliente cuente su caso</h3>'
          || '<p>Una pregunta cerrada (de sí o no) cierra la conversación. Una pregunta abierta invita al cliente a darnos contexto, y el contexto es donde está la oportunidad de aconsejar bien. Comparad:</p>'
          || '<ul>'
          || '<li><strong>Cerrada:</strong> "¿Quiere paracetamol?" → el cliente dice sí, paga y se va. No sabemos nada.</li>'
          || '<li><strong>Abierta:</strong> "¿Para qué lo necesita?" → "Para mi madre, que lleva dos días con fiebre y no le baja." Ahora sí podemos ayudar de verdad.</li>'
          || '</ul>'
          || '<p>Cuatro preguntas abiertas que valen oro en el mostrador:</p>'
          || '<ul>'
          || '<li><strong>"¿Para quién es?"</strong> — No es lo mismo un adulto, un niño o una persona mayor.</li>'
          || '<li><strong>"¿Es la primera vez que le pasa o ya viene de antes?"</strong></li>'
          || '<li><strong>"¿Está tomando algo más ahora mismo?"</strong> — Imprescindible para recomendar con seguridad.</li>'
          || '<li><strong>"¿Qué ha probado ya?"</strong> — Evita repetir lo que no le ha funcionado.</li>'
          || '</ul>'
          || '<h3>Escuchar es más que oír</h3>'
          || '<p>La escucha activa tiene gestos concretos que el cliente percibe y que generan confianza: mirar a los ojos en lugar de a la pantalla del ordenador, asentir, no interrumpir, y reformular lo que ha dicho para confirmar ("entonces, si le he entendido bien, es para su hija de seis años y le ha empezado hoy"). Ese pequeño resumen le demuestra a la persona que la habéis escuchado, y la predispone a confiar en lo que le recomendéis después.</p>'
          || '<h3>Las señales que abren una segunda necesidad</h3>'
          || '<p>Muchas atenciones llevan asociada una necesidad complementaria evidente si se escucha. No se trata de inventar, sino de reconocer patrones honestos que el cliente agradece:</p>'
          || '<ul>'
          || '<li>Un tratamiento que se va a usar varios días en la piel → quizá necesite una crema que evite la tirantez de la zona.</li>'
          || '<li>Un cliente que viene "surtiendo el botiquín de casa" → oportunidad de ayudarle a ordenarlo y ver qué le falta.</li>'
          || '<li>Una persona mayor que viene con tres cajas distintas → oportunidad de repasar con ella cómo y cuándo tomarlas.</li>'
          || '</ul>'
          || '<p><strong>Importante:</strong> escuchar no es interrogar. Tres preguntas bien hechas valen más que diez. Y si el cliente tiene prisa, se respeta siempre: el objetivo es servir mejor, nunca retener a la fuerza ni someter a un cuestionario.</p>'
          || '<blockquote>Quien escucha dos minutos recomienda con criterio. Quien no escucha, adivina. Y adivinar en el mostrador se nota.</blockquote>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Durante un día entero, proponeos sustituir vuestra primera pregunta habitual por una abierta. En lugar de "¿le pongo X?", probad "¿para qué lo necesita?" o "¿para quién es?". Al final del día, comentad en equipo qué información os ha dado el cliente que antes os perdíais.</p>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'La venta como servicio: recomendar con criterio y dentro del código deontológico',
        'duration', 15,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Detectada la necesidad, llega el momento de recomendar. Y aquí casi todo el mundo comete el mismo error de principiante: ofrecer demasiado. Cuando soltamos al cliente cinco productos seguidos, se bloquea y no se lleva ninguno. La regla, sobre todo cuando se empieza, es la contraria: <strong>una recomendación, bien explicada, en el momento oportuno</strong>.</p>'
          || '<h3>El porqué importa más que el qué</h3>'
          || '<p>El cliente no compra un producto: compra la <strong>razón</strong> por la que se lo recomendáis. Por eso recomendar no es decir un nombre comercial, es explicar para qué le sirve a esa persona en concreto. Comparad:</p>'
          || '<ul>'
          || '<li><strong>Solo el qué:</strong> "Llévese también esta crema." → suena a venta.</li>'
          || '<li><strong>El porqué:</strong> "Como me dice que el tratamiento le reseca la zona, una crema específica le evitará la tirantez y llevará mejor estos días." → suena a consejo.</li>'
          || '</ul>'
          || '<h3>Recomendar dentro del marco deontológico</h3>'
          || '<p>La farmacia se diferencia de cualquier otro comercio precisamente en esto: la recomendación se hace por <strong>criterio profesional, nunca por margen</strong>. No es una limitación que os ate; es la base de la confianza que sostiene todo el negocio. Tres reglas que no se negocian:</p>'
          || '<ul>'
          || '<li><strong>No se prometen resultados de salud.</strong> Se explica para qué sirve un producto, no que "le curará" ni que "se le quitará seguro". El cliente entiende y agradece la honestidad.</li>'
          || '<li><strong>Se prioriza siempre lo que el cliente necesita</strong>, aunque sea más barato o no deje apenas margen.</li>'
          || '<li><strong>Si no hace falta nada más, no se recomienda nada.</strong> Decir "con esto es suficiente" también construye confianza, y fideliza.</li>'
          || '</ul>'
          || '<h3>El momento oportuno</h3>'
          || '<p>Una buena recomendación en el momento equivocado se percibe como presión. El momento natural llega cuando ya habéis resuelto lo que el cliente pedía y enlazáis con lo que le habéis escuchado: "Ya está lo de la tos. Y, por cierto, como me ha comentado que duerme mal estos días por eso, hay una opción suave que quizá le venga bien, ¿se la cuento?". Primero servir lo que pedía, después proponer; nunca al revés.</p>'
          || '<blockquote>Una recomendación honesta que el cliente rechaza hoy vale más que una venta forzada que no vuelve mañana.</blockquote>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Coged un producto que recomendéis a menudo y escribid en una frase <strong>el porqué</strong>, no el qué: para qué le sirve al cliente y qué problema le evita, sin prometer ningún resultado de salud. Practicad esa frase hasta que os salga natural. Repetidlo con tres productos más. Ese es el principio de vuestro argumentario honesto.</p>'
      ),
      jsonb_build_object(
        'id', v_mod4_id,
        'title', 'Completar la atención: cerrar sin presionar y dejar la puerta abierta',
        'duration', 13,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Llega el final de la atención, y aquí muchos equipos se ponen nerviosos: temen "el cierre" como si fuera un momento incómodo de presión. No tiene por qué serlo. En una farmacia, completar bien una atención es lo más natural del mundo si se hace con la misma actitud de servicio que el resto.</p>'
          || '<h3>El cierre que no parece un cierre</h3>'
          || '<p>El mejor cierre en el mostrador es una <strong>pregunta de servicio</strong>, no de venta. En lugar de "¿se lo cobro?" o "¿se lo lleva?", funciona mucho mejor "¿se lo preparo con lo demás?" o "¿quiere que se lo enseñe?". Reduce la sensación de presión, respeta el ritmo del cliente y deja la decisión claramente en su mano.</p>'
          || '<h3>Cuando el cliente duda</h3>'
          || '<p>Una duda no es un "no": es una petición de más información o de seguridad. Las tres más habituales y cómo acompañarlas con naturalidad:</p>'
          || '<ul>'
          || '<li><strong>"Es caro."</strong> Casi nunca es el precio, es el valor percibido. Ayuda explicar duración y uso: "Le dura aproximadamente un mes, así que el coste por día es pequeño y le evita que el problema vuelva."</li>'
          || '<li><strong>"Me lo pienso."</strong> Suele faltar confianza o información, no ganas. Facilitad sin presionar: "Por supuesto. Si quiere, le anoto el nombre y lo tiene aquí cuando lo decida."</li>'
          || '<li><strong>"Ya tengo uno en casa."</strong> Es momento de aportar, no de insistir: "Perfecto, entonces no le hace falta. Si nota que no le va bien, se pasa y lo vemos."</li>'
          || '</ul>'
          || '<h3>Dejar la puerta abierta vale más que cerrar hoy</h3>'
          || '<p>Cuando la respuesta es no, el cierre correcto es que el cliente se vaya con la sensación de haber sido <strong>bien atendido</strong>. Esa sensación es exactamente la que le hace volver, y volver es donde de verdad está la rentabilidad de la farmacia. Una atención que termina en "no, gracias" pero deja al cliente contento es una atención de éxito.</p>'
          || '<blockquote>Vender bien en el mostrador no es cerrar una venta hoy: es ganar un cliente que vuelve y que recomienda vuestra farmacia.</blockquote>'
          || '<p>Con esto cerráis el método de los fundamentos: vender es ayudar, se escucha antes de hablar, se recomienda con criterio y se completa la atención sin presión. En el cuestionario final repasaréis las ideas clave para llevarlas al mostrador mañana mismo.</p>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Sustituid durante una semana la frase "¿se lo cobro?" por "¿se lo preparo con lo demás?". Fijaos en cómo cambia el tono de la despedida y si los clientes reaccionan de forma más relajada. Comentadlo en equipo: el lenguaje del cierre se entrena igual que cualquier otra habilidad.</p>'
      )
    )
  );

  -- 1b) Espejo relacional (opcional, la web no lo lee).
  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'Vender es ayudar', 'Qué significa de verdad vender en una farmacia.', 1),
    (r_mod2, v_course_id, 'Escucha activa', 'Cómo detectar lo que el cliente necesita de verdad.', 2),
    (r_mod3, v_course_id, 'La venta como servicio', 'Recomendar con criterio y dentro del código deontológico.', 3),
    (r_mod4, v_course_id, 'Completar la atención', 'Cerrar sin presionar y dejar la puerta abierta.', 4);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'Vender es ayudar', 'Contenido completo en la versión JSONB del módulo 1.', 13, 1, true),
    (r_mod2, 'Escucha activa', 'Contenido completo en la versión JSONB del módulo 2.', 15, 1, true),
    (r_mod3, 'La venta como servicio', 'Contenido completo en la versión JSONB del módulo 3.', 15, 1, true),
    (r_mod4, 'Completar la atención', 'Contenido completo en la versión JSONB del módulo 4.', 13, 1, true);

  -- 2) QUIZ.
  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: fundamentos de la venta en la farmacia',
    'Comprueba que dominas las bases de la venta como servicio: escuchar, recomendar con criterio y completar la atención sin presionar. Necesitas un 70 % para aprobar.',
    70, NULL, true, true, 1
  );

  -- 3) PREGUNTAS + OPCIONES.
  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     'En una farmacia, ¿qué significa "vender bien"?',
     'En una farmacia, ¿qué significa "vender bien"?',
     'multiple_choice',
     '["Conseguir que el cliente salga con el mayor número de productos posible","Completar bien la atención: ofrecer lo que la persona necesita, cuando le ayuda","Vender siempre el producto de mayor margen para la farmacia","Recomendar algo más en todas las ventas, sin excepción"]'::jsonb,
     1,
     'Vender bien es completar la atención pensando en el cliente: a veces son dos productos y a veces es decir "con esto es suficiente". Las dos cosas construyen confianza.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Conseguir que el cliente salga con el mayor número de productos posible', false, 0),
    (q1, 'Completar bien la atención: ofrecer lo que la persona necesita, cuando le ayuda', true, 1),
    (q1, 'Vender siempre el producto de mayor margen para la farmacia', false, 2),
    (q1, 'Recomendar algo más en todas las ventas, sin excepción', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     'Para detectar la necesidad real del cliente, ¿qué tipo de pregunta funciona mejor?',
     'Para detectar la necesidad real del cliente, ¿qué tipo de pregunta funciona mejor?',
     'multiple_choice',
     '["Preguntas cerradas de sí o no, para ir más rápido","Preguntas abiertas que inviten al cliente a dar contexto","Ninguna: es mejor recomendar directamente lo más vendido","Preguntas sobre cuánto se quiere gastar"]'::jsonb,
     1,
     'Las preguntas abiertas (para quién es, desde cuándo, qué ha probado) revelan el contexto donde está la oportunidad de aconsejar bien.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'Preguntas cerradas de sí o no, para ir más rápido', false, 0),
    (q2, 'Preguntas abiertas que inviten al cliente a dar contexto', true, 1),
    (q2, 'Ninguna: es mejor recomendar directamente lo más vendido', false, 2),
    (q2, 'Preguntas sobre cuánto se quiere gastar', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     'Al recomendar un producto, ¿qué es lo que de verdad "compra" el cliente?',
     'Al recomendar un producto, ¿qué es lo que de verdad "compra" el cliente?',
     'multiple_choice',
     '["El nombre comercial del producto","El porqué: la razón por la que le va a ayudar a él","El envase y el precio","La marca más conocida"]'::jsonb,
     1,
     'El cliente no compra un producto, compra la razón. Por eso recomendar es explicar para qué le sirve a esa persona, no solo decir un nombre.',
     2, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, 'El nombre comercial del producto', false, 0),
    (q3, 'El porqué: la razón por la que le va a ayudar a él', true, 1),
    (q3, 'El envase y el precio', false, 2),
    (q3, 'La marca más conocida', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     '¿Qué actuación respeta el código deontológico al recomendar en el mostrador?',
     '¿Qué actuación respeta el código deontológico al recomendar en el mostrador?',
     'multiple_choice',
     '["Prometer al cliente que el producto le curará el problema","Explicar para qué sirve el producto sin prometer resultados de salud","Recomendar siempre algo más, aunque no haga falta","Priorizar el producto de mayor margen sobre el que necesita"]'::jsonb,
     1,
     'No se prometen resultados de salud: se explica para qué sirve un producto y se prioriza siempre lo que el cliente necesita.',
     3, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Prometer al cliente que el producto le curará el problema', false, 0),
    (q4, 'Explicar para qué sirve el producto sin prometer resultados de salud', true, 1),
    (q4, 'Recomendar siempre algo más, aunque no haga falta', false, 2),
    (q4, 'Priorizar el producto de mayor margen sobre el que necesita', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     'Un cliente dice "me lo pienso". ¿Cuál es la mejor forma de cerrar la atención?',
     'Un cliente dice "me lo pienso". ¿Cuál es la mejor forma de cerrar la atención?',
     'multiple_choice',
     '["Insistir explicando otra vez por qué le conviene","Facilitar la decisión sin presión: anotarle el nombre para cuando lo decida","Ofrecerle un descuento inmediato para que compre ya","Hacerle ver que está perdiendo una oportunidad"]'::jsonb,
     1,
     '"Me lo pienso" suele indicar falta de información o de confianza, no un no. Se acompaña la decisión sin presionar y se deja la puerta abierta.',
     4, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Insistir explicando otra vez por qué le conviene', false, 0),
    (q5, 'Facilitar la decisión sin presión: anotarle el nombre para cuando lo decida', true, 1),
    (q5, 'Ofrecerle un descuento inmediato para que compre ya', false, 2),
    (q5, 'Hacerle ver que está perdiendo una oportunidad', false, 3);

  RAISE NOTICE 'Curso 1 creado: % (quiz: %)', v_course_id, v_quiz_id;
END $$;


-- =====================================================================
-- CURSO 2 — ventas / avanzado
-- "Venta consultiva y categorías de alto margen"
-- slug: fp-vt-venta-consultiva-categorias-alto-margen
-- =====================================================================
DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  v_mod1_id text := 'm1-venta-consultiva';
  v_mod2_id text := 'm2-dermo-recomendacion';
  v_mod3_id text := 'm3-nutricion-fitoterapia';
  v_mod4_id text := 'm4-protocolos-equipo';

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

  DELETE FROM public.courses WHERE slug = 'fp-vt-venta-consultiva-categorias-alto-margen';

  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'Venta consultiva y categorías de alto margen',
    'fp-vt-venta-consultiva-categorias-alto-margen',
    'El siguiente nivel para equipos que ya dominan la venta básica y quieren trabajar bien las categorías que sostienen el margen de la farmacia: dermocosmética, nutrición y complementos, y fitoterapia. Aquí el enfoque es la venta consultiva: diagnosticar la necesidad como un profesional, construir una recomendación experta y acompañar al cliente en categorías de mayor implicación, siempre desde el consejo y nunca desde la presión. Incluye cómo trasladar todo esto a protocolos para que lo aplique el equipo entero, no solo una persona.',
    'ventas',
    'avanzado',
    1,            -- duration_hours
    18,           -- duration_minutes (1h 18 = 78 min)
    'Laura Domínguez',
    true,         -- is_published
    false,        -- is_premium
    false,        -- is_featured
    11,           -- order_index
    4,            -- total_lessons
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'De despachar a asesorar: qué es la venta consultiva',
        'duration', 18,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>La venta consultiva es el salto que separa a la farmacia que despacha de la que asesora. En la venta básica respondemos a lo que el cliente pide. En la venta consultiva <strong>diagnosticamos la necesidad completa</strong>, igual que haría un profesional, y construimos una recomendación a medida. No se trata de vender más por vender, sino de aportar tanto valor que el cliente no querría comprar esa categoría en ningún otro sitio.</p>'
          || '<h3>El cliente de alta implicación piensa distinto</h3>'
          || '<p>Las categorías de alto margen (dermocosmética, nutrición, fitoterapia) tienen algo en común: el cliente se implica más en la decisión. No compra por impulso como un caramelo para la tos; invierte más dinero, tiene más dudas y busca a alguien en quien confiar. Eso es una <strong>oportunidad enorme</strong> para la farmacia, porque es justo el terreno donde el consejo profesional marca la diferencia frente a la perfumería, el supermercado o la compra por internet.</p>'
          || '<h3>El método consultivo en cuatro fases</h3>'
          || '<ol>'
          || '<li><strong>Diagnóstico:</strong> indagar a fondo con preguntas abiertas hasta entender el contexto completo. En dermo, por ejemplo: tipo de piel, rutina actual, qué ha usado, qué busca conseguir, si tiene la piel sensibilizada por algún tratamiento.</li>'
          || '<li><strong>Educación:</strong> explicar al cliente lo que necesita saber para decidir bien. Un cliente que entiende por qué algo le conviene compra con convicción y vuelve.</li>'
          || '<li><strong>Recomendación a medida:</strong> proponer una solución coherente con lo diagnosticado, priorizando lo esencial y explicando el porqué de cada pieza.</li>'
          || '<li><strong>Seguimiento:</strong> "Pruébelo dos semanas y me cuenta." El seguimiento es lo que convierte una venta en una relación, y la relación es donde está la fidelización.</li>'
          || '</ol>'
          || '<h3>Vender más sin presionar nunca</h3>'
          || '<p>La venta consultiva puede elevar el ticket de forma natural porque a veces la solución correcta tiene varias piezas (una rutina dermo completa, por ejemplo). Pero el límite es sagrado: se recomienda lo que la persona necesita, no lo que infla la cuenta. Si la solución honesta es un solo producto, es un solo producto. El cliente avanzado nota perfectamente cuándo le están construyendo una rutina útil y cuándo le están alargando la lista, y la segunda opción destruye la confianza que tanto cuesta construir.</p>'
          || '<blockquote>La venta consultiva no consiste en vender más cosas, sino en resolver mejor el problema. Que el ticket suba es una consecuencia, nunca el objetivo.</blockquote>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Elegid una categoría de alto margen de vuestra farmacia y escribid las cinco preguntas de diagnóstico que haríais antes de recomendar nada. Si os cuesta llegar a cinco, ahí tenéis la prueba de cuánto margen de mejora hay en vuestra fase de diagnóstico.</p>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'Dermocosmética desde la recomendación profesional',
        'duration', 20,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>La dermocosmética es la categoría reina del margen en parafarmacia y, a la vez, la más expuesta a la competencia: el mismo producto puede estar en una web a un clic. ¿Por qué compraría el cliente en vuestra farmacia? Por una sola razón: <strong>el consejo experto que no encuentra en ningún otro canal</strong>. Esa es vuestra ventaja, y este módulo va de cómo aprovecharla sin caer en la venta agresiva.</p>'
          || '<h3>Diagnosticar antes de recomendar</h3>'
          || '<p>En dermo, recomendar sin diagnosticar es el error más caro. Las preguntas que cambian la conversación:</p>'
          || '<ul>'
          || '<li>"¿Cómo notáis la piel: más bien tirante, con brillos, mixta?"</li>'
          || '<li>"¿Qué estáis usando ahora por la mañana y por la noche?"</li>'
          || '<li>"¿Hay algo que hayáis probado que os haya irritado o no os haya gustado?"</li>'
          || '<li>"¿Estáis con algún tratamiento que pueda estar resecando o sensibilizando la piel?"</li>'
          || '<li>"¿Qué os gustaría notar o mejorar?"</li>'
          || '</ul>'
          || '<h3>Construir la rutina por prioridades</h3>'
          || '<p>La tentación es enseñar diez productos. El enfoque profesional es justo el contrario: ordenar por prioridad y empezar por lo esencial. Una buena forma de explicarlo al cliente es por pasos —limpieza, tratamiento, hidratación y fotoprotección— y dejarle claro qué es imprescindible ahora y qué puede incorporar más adelante. Así el cliente no se abruma, confía y vuelve a por el siguiente paso, que es exactamente lo que interesa a la farmacia a largo plazo.</p>'
          || '<h3>El límite deontológico en dermo</h3>'
          || '<p>La dermocosmética es cuidado de la piel, no tratamiento médico. Por eso el lenguaje importa muchísimo:</p>'
          || '<ul>'
          || '<li>Se habla de <strong>cuidar, ayudar, mejorar el aspecto o el confort</strong> de la piel; no de "curar" ni de eliminar una patología.</li>'
          || '<li>Ante una lesión, un cambio sospechoso o algo que no encaja con un cuidado cosmético, la recomendación correcta es <strong>derivar al farmacéutico o al dermatólogo</strong>. Saber decir "esto conviene que lo vea un médico" es la recomendación más profesional que existe, y refuerza la autoridad de la farmacia.</li>'
          || '<li>No se prometen resultados ni plazos garantizados. Se explica para qué sirve cada producto y se acompaña con realismo.</li>'
          || '</ul>'
          || '<blockquote>En dermocosmética, el cliente paga por criterio. El producto lo encuentra en cualquier sitio; el consejo profesional, solo en vuestra farmacia.</blockquote>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Coged un caso real reciente de un cliente de dermo y reconstruidlo en cuatro pasos: limpieza, tratamiento, hidratación, fotoprotección. Marcad qué le recomendasteis como imprescindible y qué quedó para "más adelante". Si en su día se lo ofrecisteis todo de golpe, pensad cómo lo presentaríais ahora por prioridades.</p>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'Nutrición, complementos y fitoterapia: recomendar con rigor y prudencia',
        'duration', 20,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Los complementos alimenticios y la fitoterapia son categorías de margen atractivo y demanda creciente, pero también las que más exigen <strong>rigor y prudencia</strong>. Aquí un mal consejo no solo pierde una venta: puede afectar a la confianza en la farmacia como referente de salud. La buena noticia es que, bien trabajadas desde el consejo profesional, son una palanca de fidelización potentísima.</p>'
          || '<h3>La pregunta que nunca debe faltar</h3>'
          || '<p>Antes de recomendar cualquier complemento o planta, una pregunta es obligatoria por seguridad: <strong>"¿Está tomando algún medicamento u otro complemento ahora mismo?"</strong>. Hay interacciones relevantes que solo se detectan preguntando, y la consulta al farmacéutico debe ser el reflejo automático ante cualquier duda. La venta nunca está por encima de la seguridad del cliente; en una farmacia, ese principio no se negocia.</p>'
          || '<h3>Recomendar complementos: contexto, no milagros</h3>'
          || '<p>El complemento alimenticio acompaña a una alimentación y un estilo de vida, no los sustituye, y así debe explicarse. El enfoque consultivo:</p>'
          || '<ul>'
          || '<li>Entender el contexto real: qué busca la persona, cómo es su día a día, qué espera notar.</li>'
          || '<li>Explicar para qué puede servir el complemento <strong>sin prometer resultados</strong> ("puede ayudar a", nunca "le va a quitar" o "le garantiza").</li>'
          || '<li>Ser honestos con las expectativas y los plazos. Un cliente con expectativas realistas queda satisfecho; uno con expectativas infladas se siente engañado y no vuelve.</li>'
          || '</ul>'
          || '<h3>Fitoterapia: tradición de uso, no promesa terapéutica</h3>'
          || '<p>Con la fitoterapia, el marco deontológico y legal es especialmente estricto. Se puede hablar del uso tradicional y de para qué se emplea habitualmente una planta, pero <strong>nunca atribuirle la capacidad de tratar o curar una enfermedad</strong>. Y como con cualquier producto de salud, ante síntomas que se prolongan, empeoran o son llamativos, la recomendación correcta es derivar al farmacéutico o al médico, no insistir en un producto.</p>'
          || '<h3>Por qué la prudencia vende</h3>'
          || '<p>Puede parecer que tanta cautela frena la venta. Es al revés: la prudencia es precisamente lo que diferencia a la farmacia de un herbolario o de una web sin control. El cliente que percibe que le aconsejáis con rigor, que le preguntáis por su medicación y que a veces le decís "esto mejor que lo valore el médico" es el que confía en vosotros para todo lo demás. Esa confianza es el activo más rentable de la categoría.</p>'
          || '<blockquote>En complementos y fitoterapia, la frase más rentable a largo plazo es "esto conviene que lo consulte". Protege al cliente y consolida vuestra autoridad.</blockquote>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Repasad en equipo los complementos y plantas que más recomendáis y acordad, para cada uno, una frase de recomendación honesta ("puede ayudar a...") y un criterio claro de derivación ("si pasa X, lo deriva al farmacéutico"). Tener esto pactado evita que cada persona del equipo improvise de forma distinta.</p>'
      ),
      jsonb_build_object(
        'id', v_mod4_id,
        'title', 'De la habilidad individual al protocolo de equipo',
        'duration', 20,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Un buen vendedor consultivo en la farmacia es valioso. Un equipo entero que vende de forma consultiva es lo que transforma una categoría. El problema clásico es que el conocimiento se queda en una sola persona —normalmente la más veterana en dermo— y el día que libra, la categoría se desploma. La solución es convertir la habilidad individual en <strong>protocolo compartido</strong>.</p>'
          || '<h3>Qué es un protocolo de recomendación</h3>'
          || '<p>Un protocolo no es un guion rígido que robotiza al equipo. Es un <strong>acuerdo común</strong> sobre cómo se trabaja una categoría: qué preguntas de diagnóstico se hacen, qué soluciones se proponen para las situaciones más frecuentes, cómo se explican y, muy importante, cuándo se deriva. Da seguridad a quien empieza y coherencia a la farmacia, para que el cliente reciba el mismo nivel de consejo lo atienda quien lo atienda.</p>'
          || '<h3>Cómo construirlo en la práctica</h3>'
          || '<ol>'
          || '<li><strong>Identificad las situaciones frecuentes</strong> de cada categoría (en dermo: piel sensibilizada, primeras arrugas, manchas, piel con tendencia acneica del adolescente...).</li>'
          || '<li><strong>Acordad para cada una</strong> las preguntas clave, la recomendación base por prioridades y el criterio de derivación.</li>'
          || '<li><strong>Recogedlo en una ficha breve</strong> y accesible, no en un manual de cincuenta páginas que nadie lee.</li>'
          || '<li><strong>Entrenadlo con role-play:</strong> uno hace de cliente, otro atiende, el resto observa y comenta. Quince minutos en una reunión de equipo valen más que cualquier teoría.</li>'
          || '</ol>'
          || '<h3>Medir para mejorar</h3>'
          || '<p>Lo que no se mide, no se mejora. Sin entrar en cifras concretas (que dependen de cada farmacia), conviene seguir la evolución del peso de cada categoría y del ticket medio en ella, y comentarlo en equipo de forma constructiva. El objetivo no es presionar a nadie con números, sino detectar qué situaciones se están aprovechando bien y cuáles se nos escapan, para reforzar el protocolo donde haga falta.</p>'
          || '<blockquote>La diferencia entre una farmacia con un buen vendedor y una farmacia que crece está en una palabra: sistema. El talento individual se va de vacaciones; el protocolo se queda.</blockquote>'
          || '<p>Con esto cerráis la venta consultiva: diagnosticar como un profesional, trabajar las categorías de alto margen desde el consejo y la prudencia, y llevarlo a protocolo para todo el equipo. En el cuestionario final repasaréis las claves.</p>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Escoged la categoría de alto margen donde más dependáis de una sola persona y redactad, entre todos, la primera ficha de protocolo: tres situaciones frecuentes con sus preguntas, su recomendación base y su criterio de derivación. Es el primer paso para que esa categoría deje de depender de quién esté ese día en el mostrador.</p>'
      )
    )
  );

  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'De despachar a asesorar', 'Qué es la venta consultiva.', 1),
    (r_mod2, v_course_id, 'Dermocosmética profesional', 'Recomendar dermo desde el criterio experto.', 2),
    (r_mod3, v_course_id, 'Nutrición y fitoterapia', 'Recomendar con rigor y prudencia.', 3),
    (r_mod4, v_course_id, 'Del talento al protocolo', 'De la habilidad individual al protocolo de equipo.', 4);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'Venta consultiva', 'Contenido completo en la versión JSONB del módulo 1.', 18, 1, true),
    (r_mod2, 'Dermocosmética', 'Contenido completo en la versión JSONB del módulo 2.', 20, 1, true),
    (r_mod3, 'Nutrición y fitoterapia', 'Contenido completo en la versión JSONB del módulo 3.', 20, 1, true),
    (r_mod4, 'Protocolo de equipo', 'Contenido completo en la versión JSONB del módulo 4.', 20, 1, true);

  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: venta consultiva y categorías de alto margen',
    'Comprueba que dominas la venta consultiva en dermo, nutrición y fitoterapia: diagnosticar, recomendar con rigor y deontología, y trasladarlo a protocolo. Necesitas un 70 % para aprobar.',
    70, NULL, true, true, 1
  );

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     '¿Qué distingue a la venta consultiva de la venta básica?',
     '¿Qué distingue a la venta consultiva de la venta básica?',
     'multiple_choice',
     '["Que siempre termina con un ticket más alto","Que diagnostica la necesidad completa y construye una recomendación a medida","Que solo se aplica a clientes que ya conocemos","Que evita hacer preguntas para no incomodar"]'::jsonb,
     1,
     'En la venta básica respondemos a lo que el cliente pide; en la consultiva diagnosticamos la necesidad completa y recomendamos a medida. Que el ticket suba es una consecuencia, no el objetivo.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Que siempre termina con un ticket más alto', false, 0),
    (q1, 'Que diagnostica la necesidad completa y construye una recomendación a medida', true, 1),
    (q1, 'Que solo se aplica a clientes que ya conocemos', false, 2),
    (q1, 'Que evita hacer preguntas para no incomodar', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     'En dermocosmética, ¿cuál es la ventaja real de la farmacia frente a una web o un supermercado?',
     'En dermocosmética, ¿cuál es la ventaja real de la farmacia frente a una web o un supermercado?',
     'multiple_choice',
     '["Tener el precio más bajo del mercado","El consejo experto que el cliente no encuentra en otro canal","Disponer de más referencias de marcas","Las promociones y los regalos por compra"]'::jsonb,
     1,
     'El mismo producto está a un clic en internet. Lo que diferencia a la farmacia es el consejo profesional, que es justo lo que el cliente de dermo valora y paga.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'Tener el precio más bajo del mercado', false, 0),
    (q2, 'El consejo experto que el cliente no encuentra en otro canal', true, 1),
    (q2, 'Disponer de más referencias de marcas', false, 2),
    (q2, 'Las promociones y los regalos por compra', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     'Antes de recomendar un complemento alimenticio o una planta, ¿qué pregunta no debe faltar nunca?',
     'Antes de recomendar un complemento alimenticio o una planta, ¿qué pregunta no debe faltar nunca?',
     'multiple_choice',
     '["¿Cuánto se quiere gastar?","¿Está tomando algún medicamento u otro complemento ahora mismo?","¿Quiere la marca más conocida?","¿Lo necesita para hoy mismo?"]'::jsonb,
     1,
     'Preguntar por la medicación y otros complementos es obligatorio por seguridad: hay interacciones que solo se detectan preguntando. La seguridad del cliente está por encima de la venta.',
     2, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, '¿Cuánto se quiere gastar?', false, 0),
    (q3, '¿Está tomando algún medicamento u otro complemento ahora mismo?', true, 1),
    (q3, '¿Quiere la marca más conocida?', false, 2),
    (q3, '¿Lo necesita para hoy mismo?', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     'En fitoterapia, ¿qué afirmación respeta el marco deontológico y legal?',
     'En fitoterapia, ¿qué afirmación respeta el marco deontológico y legal?',
     'multiple_choice',
     '["Se puede afirmar que una planta cura una enfermedad concreta","Se puede hablar del uso tradicional sin atribuir capacidad de tratar o curar","Se puede prometer un resultado si el cliente sigue las instrucciones","Se puede sustituir el consejo médico por el de la planta"]'::jsonb,
     1,
     'Se puede hablar del uso tradicional de una planta, pero nunca atribuirle la capacidad de tratar o curar una enfermedad. Ante síntomas que persisten o empeoran, se deriva.',
     3, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Se puede afirmar que una planta cura una enfermedad concreta', false, 0),
    (q4, 'Se puede hablar del uso tradicional sin atribuir capacidad de tratar o curar', true, 1),
    (q4, 'Se puede prometer un resultado si el cliente sigue las instrucciones', false, 2),
    (q4, 'Se puede sustituir el consejo médico por el de la planta', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     '¿Por qué conviene convertir la habilidad de venta en un protocolo de equipo?',
     '¿Por qué conviene convertir la habilidad de venta en un protocolo de equipo?',
     'multiple_choice',
     '["Para robotizar la atención con un guion cerrado","Para que la categoría no dependa de una sola persona y el cliente reciba el mismo nivel de consejo","Para reducir el número de preguntas al cliente","Para poder prescindir de la formación continua"]'::jsonb,
     1,
     'El protocolo es un acuerdo común que da coherencia y seguridad: el conocimiento deja de depender de una sola persona y el cliente recibe el mismo nivel de consejo lo atienda quien lo atienda.',
     4, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Para robotizar la atención con un guion cerrado', false, 0),
    (q5, 'Para que la categoría no dependa de una sola persona y el cliente reciba el mismo nivel de consejo', true, 1),
    (q5, 'Para reducir el número de preguntas al cliente', false, 2),
    (q5, 'Para poder prescindir de la formación continua', false, 3);

  RAISE NOTICE 'Curso 2 creado: % (quiz: %)', v_course_id, v_quiz_id;
END $$;


-- =====================================================================
-- CURSO 3 — atencion / principiante
-- "Atención al cliente excepcional en el mostrador"
-- slug: fp-at-atencion-cliente-excepcional-mostrador
-- =====================================================================
DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  v_mod1_id text := 'm1-primera-impresion';
  v_mod2_id text := 'm2-comunicacion-clara';
  v_mod3_id text := 'm3-perfiles-cliente';
  v_mod4_id text := 'm4-despedida-experiencia';

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

  DELETE FROM public.courses WHERE slug = 'fp-at-atencion-cliente-excepcional-mostrador';

  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'Atención al cliente excepcional en el mostrador',
    'fp-at-atencion-cliente-excepcional-mostrador',
    'La atención es lo que de verdad diferencia a una farmacia de la de enfrente, porque el producto suele ser el mismo. Este curso recoge las bases de una atención que el cliente recuerda: la primera impresión, la comunicación clara y empática, cómo adaptarse a cada tipo de persona y una despedida que invita a volver. Pensado para todo el equipo de mostrador, con ejemplos concretos y ejercicios para aplicar desde el primer día. Habilidades de trato y servicio, sin consejo clínico.',
    'atencion',
    'principiante',
    1,            -- duration_hours
    54,           -- duration_minutes
    'Laura Domínguez',
    true,         -- is_published
    false,        -- is_premium
    false,        -- is_featured
    12,           -- order_index
    4,            -- total_lessons
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'La primera impresión: los primeros diez segundos lo deciden casi todo',
        'duration', 12,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>En una farmacia, la atención empieza antes de la primera palabra. El cliente, en cuanto cruza la puerta, ya se está formando una impresión: ¿me han visto?, ¿hay buen ambiente?, ¿me van a atender con ganas o con prisa? Esos primeros segundos pesan muchísimo en cómo vivirá toda la atención, y la buena noticia es que dependen casi por completo de vosotros.</p>'
          || '<h3>El saludo y el contacto visual</h3>'
          || '<p>El gesto más sencillo y más potente es <strong>mirar y reconocer</strong> al cliente en cuanto entra, aunque estéis ocupados con otra persona. Un contacto visual y un "ahora le atiendo" hacen que la espera se viva de otra manera: el cliente ya sabe que se ha contado con él. Lo contrario —que entre, mire alrededor y nadie dé señales de haberle visto— genera una sensación de abandono que arranca la atención con mal pie.</p>'
          || '<p>Cuando llega su turno, un saludo cálido y con la cabeza levantada de la pantalla marca la diferencia. No hace falta nada efusivo: una sonrisa, mirar a los ojos y un "buenos días, ¿en qué le puedo ayudar?" dicho con ganas ya coloca la atención en el tono correcto.</p>'
          || '<h3>La comunicación no verbal habla más alto que las palabras</h3>'
          || '<p>El cliente no solo escucha lo que decimos: lee cómo lo decimos. Algunos elementos no verbales que conviene cuidar en el mostrador:</p>'
          || '<ul>'
          || '<li><strong>La mirada:</strong> a los ojos, no clavada en el ordenador o en el cajón.</li>'
          || '<li><strong>La expresión:</strong> una cara amable predispone; una cara de fastidio o agobio se contagia.</li>'
          || '<li><strong>La postura:</strong> orientada hacia el cliente, no de lado o medio dándole la espalda.</li>'
          || '<li><strong>El ritmo:</strong> transmitir calma aunque haya cola. Las prisas se notan y hacen que el cliente se sienta un estorbo.</li>'
          || '</ul>'
          || '<h3>La cola es parte de la atención</h3>'
          || '<p>Cuando hay varias personas esperando, la atención al que ya está delante no debe atropellarse, pero tampoco conviene ignorar a los que esperan. Un simple gesto de reconocimiento a quien llega y, si la espera se alarga, un "disculpe la espera, ahora mismo le atiendo" cambian por completo la percepción. La gente perdona esperar; lo que no perdona es sentirse invisible.</p>'
          || '<blockquote>No hay segunda oportunidad para una primera impresión. En el mostrador, esa primera impresión se juega en diez segundos y casi siempre sin decir nada todavía.</blockquote>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Durante una mañana, fijaos en cuántas personas entran sin recibir ningún tipo de reconocimiento (una mirada, un gesto) hasta que les toca el turno. Proponeos que nadie cruce la puerta sin ser "visto" en los primeros segundos. Comentad en equipo cómo cambia el ambiente de la farmacia.</p>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'Comunicación clara y empática: hacerse entender y hacer sentir bien',
        'duration', 14,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Una atención excepcional se apoya en dos pilares que van juntos: que el cliente <strong>entienda</strong> lo que le decimos y que se <strong>sienta bien tratado</strong> mientras lo hacemos. Lo primero es claridad; lo segundo, empatía. Fallar en cualquiera de los dos estropea la atención, por muy correcto que sea todo lo demás.</p>'
          || '<h3>Claridad: hablar el idioma del cliente</h3>'
          || '<p>En la farmacia es fácil caer en un lenguaje técnico que para nosotros es del día a día pero que el cliente no entiende. La regla es sencilla: <strong>adaptar el lenguaje a quien tenemos delante</strong>. Algunas pautas:</p>'
          || '<ul>'
          || '<li>Explicar las cosas con palabras llanas y, si hace falta, con un ejemplo cotidiano.</li>'
          || '<li>Cuando hay instrucciones importantes (cómo o cuándo usar algo), darlas despacio, ordenadas y, si conviene, anotarlas.</li>'
          || '<li>Confirmar que se ha entendido sin que el cliente quede en evidencia: "¿Quiere que se lo repita o se lo apunto para que lo tenga claro en casa?".</li>'
          || '</ul>'
          || '<p>Una persona mayor, una madre con prisa con un niño en brazos o alguien que viene preocupado no necesitan el mismo registro. Adaptarse no es complicado: es prestar atención a quién es cada cliente.</p>'
          || '<h3>Empatía: ponerse un momento en su lugar</h3>'
          || '<p>Mucha gente llega a la farmacia preocupada, incómoda o cansada. La empatía consiste en reconocer ese estado y tratarlo con tacto. No hace falta gran cosa: una frase que valide cómo se siente la persona ("entiendo que esto le preocupe, vamos a verlo con calma") baja la tensión y hace que confíe. La empatía no alarga la atención; la hace más eficaz, porque un cliente que se siente comprendido escucha mejor y colabora más.</p>'
          || '<h3>El tono lo es todo</h3>'
          || '<p>La misma frase puede sonar a ayuda o a desprecio según el tono. "Eso lo tiene en el pasillo dos" dicho con sequedad despacha; dicho con amabilidad y, mejor aún, acompañando al cliente un par de pasos, atiende. En el mostrador, el cómo pesa tanto como el qué.</p>'
          || '<h3>La discreción es atención</h3>'
          || '<p>La farmacia trata a menudo temas que el cliente prefiere no airear. Cuidar la discreción —bajar la voz cuando toca, no exponer al cliente delante de la cola, atender ciertas consultas con tacto— es una forma concreta de respeto que la gente valora muchísimo, aunque rara vez lo diga en voz alta.</p>'
          || '<blockquote>El cliente puede olvidar lo que le dijisteis, pero no olvidará cómo le hicisteis sentir. La empatía es la parte de la atención que más se recuerda.</blockquote>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Pensad en una explicación que deis a menudo en el mostrador y que suela generar caras de duda. Reescribidla en lenguaje totalmente llano, como si se lo explicarais a un familiar sin formación sanitaria. Practicadla así durante una semana y observad si el cliente pregunta menos veces "¿cómo ha dicho?".</p>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'Adaptarse a cada cliente: no todos necesitan lo mismo',
        'duration', 14,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Una atención excepcional no es tratar a todo el mundo igual, sino dar a cada cliente lo que necesita. Por el mostrador pasan personas muy distintas en un mismo día, y la habilidad está en <strong>leer rápido</strong> con quién estamos y ajustar el trato. No se trata de etiquetar, sino de adaptarse con sensibilidad.</p>'
          || '<h3>Algunos perfiles habituales y cómo acompañarlos</h3>'
          || '<ul>'
          || '<li><strong>El cliente con prisa.</strong> Quiere eficacia. Atención ágil, directa, sin perder la amabilidad. Si necesita más asesoramiento del que el momento permite, se le puede ofrecer pasar en otro rato: "Para esto que me comenta merece la pena que lo veamos con calma, ¿le va bien pasarse a una hora más tranquila?".</li>'
          || '<li><strong>La persona mayor.</strong> Suele agradecer cercanía, paciencia y claridad. Hablar despacio, confirmar que ha entendido, no atropellar. Muchas veces la farmacia es uno de sus contactos del día, y un trato cálido vale tanto como el producto.</li>'
          || '<li><strong>El cliente preocupado.</strong> Llega con inquietud (por él o por un familiar). Necesita sobre todo calma y que se le escuche. Bajar el ritmo, validar su preocupación y, cuando corresponda, derivar al farmacéutico.</li>'
          || '<li><strong>El cliente indeciso.</strong> No sabe bien qué necesita. Agradece que le ayuden a ordenar la decisión con preguntas y que no le abrumen con opciones.</li>'
          || '<li><strong>El cliente bien informado.</strong> Llega con información (a veces de internet). Conviene escucharle con respeto, no corregirle de forma brusca y aportar criterio profesional sin hacerle sentir que "no tenía ni idea".</li>'
          || '</ul>'
          || '<h3>Saber cuándo dar paso al farmacéutico</h3>'
          || '<p>Parte de una atención excelente es reconocer el límite del propio papel. Cuando una consulta va más allá de la atención comercial o de servicio —dudas sobre un tratamiento, síntomas, situaciones delicadas— la mejor atención posible es <strong>derivar al farmacéutico</strong> con naturalidad: "Esto se lo va a explicar mejor el farmacéutico, ahora mismo le aviso". Lejos de ser un fallo, derivar a tiempo demuestra profesionalidad y cuida al cliente.</p>'
          || '<h3>El cliente habitual: el tesoro de la farmacia</h3>'
          || '<p>Reconocer al cliente que viene a menudo, recordar algún detalle, llamarle por su nombre si se sabe... son gestos pequeños que crean un vínculo enorme. El cliente habitual es la base de la farmacia, y la atención personalizada es lo que lo mantiene fiel frente a cualquier competencia de precio.</p>'
          || '<blockquote>Tratar a todos igual no es justo: es cómodo. La atención excepcional empieza cuando damos a cada persona exactamente lo que necesita.</blockquote>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Repasad en equipo los perfiles de cliente más frecuentes en vuestra farmacia y poned, para cada uno, una frase o gesto concreto que mejore su atención. Tener estos pequeños acuerdos hace que todo el equipo ofrezca el mismo nivel de trato adaptado.</p>'
      ),
      jsonb_build_object(
        'id', v_mod4_id,
        'title', 'La despedida y la experiencia completa: que se vaya con ganas de volver',
        'duration', 14,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>La atención no termina cuando se cobra: termina cuando el cliente sale por la puerta. Y, curiosamente, el final es lo que más se recuerda. Una atención impecable que acaba con una despedida fría o un "siguiente" cortante deja peor sabor del que merece. Cerrar bien es tan importante como abrir bien.</p>'
          || '<h3>Una despedida que deja huella</h3>'
          || '<p>La despedida ideal es cálida y deja la puerta abierta. No es solo decir "adiós": es rematar la atención con un detalle de cuidado. Algunas formas sencillas:</p>'
          || '<ul>'
          || '<li>Recordar lo importante: "Recuerde, una al día con la comida; cualquier duda, se pasa."</li>'
          || '<li>Ofrecer continuidad: "Si nota cualquier cosa, aquí estamos."</li>'
          || '<li>Una despedida humana y con nombre cuando se sabe: "Que se mejore su madre, Carmen. Hasta pronto."</li>'
          || '</ul>'
          || '<p>Ese cierre comunica algo poderoso: que la farmacia está ahí, que el cliente puede volver con confianza y que no era "una venta más".</p>'
          || '<h3>La experiencia es la suma de todos los detalles</h3>'
          || '<p>La experiencia del cliente no la define un solo momento, sino la suma de todos: cómo le recibieron, cómo le escucharon, cómo le explicaron, cómo se despidieron, y también el entorno (una farmacia ordenada, limpia y agradable atiende sin decir una palabra). Cuidar la experiencia completa es lo que convierte una atención correcta en una atención memorable.</p>'
          || '<h3>Recuperar una atención que se ha torcido</h3>'
          || '<p>A veces algo sale mal: una espera larga, un malentendido, un producto que no estaba. La diferencia entre un cliente perdido y uno fidelizado suele estar en cómo se cierra ese momento. Un reconocimiento sincero ("siento que haya tenido que esperar tanto hoy") y un gesto de cuidado pueden convertir una mala experiencia en una muestra de que esa farmacia se preocupa de verdad. Más de esto se trabaja en el curso de quejas y clientes difíciles.</p>'
          || '<blockquote>La gente vuelve a la farmacia donde la tratan bien, aunque la de al lado le quede más cerca o tenga una oferta. La atención es la mejor fidelización que existe.</blockquote>'
          || '<p>Con esto cerráis las bases de una atención excepcional: primera impresión, comunicación clara y empática, adaptación a cada cliente y una despedida que invita a volver. En el cuestionario final repasaréis las claves.</p>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Durante una semana, cuidad de manera consciente la despedida de cada cliente: un remate cálido, un "cualquier duda, aquí estamos" y, cuando lo sepáis, el nombre. Fijaos en las reacciones. Veréis que el final amable es de lo que más sonrisas devuelve.</p>'
      )
    )
  );

  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'La primera impresión', 'Los primeros diez segundos lo deciden casi todo.', 1),
    (r_mod2, v_course_id, 'Comunicación clara y empática', 'Hacerse entender y hacer sentir bien.', 2),
    (r_mod3, v_course_id, 'Adaptarse a cada cliente', 'No todos necesitan lo mismo.', 3),
    (r_mod4, v_course_id, 'La despedida y la experiencia', 'Que el cliente se vaya con ganas de volver.', 4);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'La primera impresión', 'Contenido completo en la versión JSONB del módulo 1.', 12, 1, true),
    (r_mod2, 'Comunicación clara y empática', 'Contenido completo en la versión JSONB del módulo 2.', 14, 1, true),
    (r_mod3, 'Adaptarse a cada cliente', 'Contenido completo en la versión JSONB del módulo 3.', 14, 1, true),
    (r_mod4, 'La despedida y la experiencia', 'Contenido completo en la versión JSONB del módulo 4.', 14, 1, true);

  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: atención al cliente excepcional en el mostrador',
    'Comprueba que dominas las bases de una atención que el cliente recuerda: primera impresión, comunicación, adaptación y despedida. Necesitas un 70 % para aprobar.',
    70, NULL, true, true, 1
  );

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     'Hay cola y entra un nuevo cliente. ¿Cuál es la mejor forma de cuidar la primera impresión?',
     'Hay cola y entra un nuevo cliente. ¿Cuál es la mejor forma de cuidar la primera impresión?',
     'multiple_choice',
     '["Ignorarle hasta que le toque el turno, para no descuidar al de delante","Reconocerle con una mirada o un gesto en cuanto entra","Pedirle que vuelva en otro momento con menos gente","Atender más rápido y de forma más seca al cliente actual"]'::jsonb,
     1,
     'La gente perdona esperar; lo que no perdona es sentirse invisible. Un simple reconocimiento al entrar cambia por completo cómo se vive la espera.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Ignorarle hasta que le toque el turno, para no descuidar al de delante', false, 0),
    (q1, 'Reconocerle con una mirada o un gesto en cuanto entra', true, 1),
    (q1, 'Pedirle que vuelva en otro momento con menos gente', false, 2),
    (q1, 'Atender más rápido y de forma más seca al cliente actual', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     'Al dar una explicación a un cliente, ¿qué demuestra una buena comunicación?',
     'Al dar una explicación a un cliente, ¿qué demuestra una buena comunicación?',
     'multiple_choice',
     '["Usar el lenguaje técnico para transmitir profesionalidad","Adaptar el lenguaje a quien tenemos delante y confirmar que ha entendido","Explicarlo siempre igual, sea quien sea el cliente","Hablar rápido para no hacer esperar a la cola"]'::jsonb,
     1,
     'Comunicar bien es hacerse entender: adaptar el lenguaje a cada cliente y confirmar la comprensión sin dejar a la persona en evidencia.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'Usar el lenguaje técnico para transmitir profesionalidad', false, 0),
    (q2, 'Adaptar el lenguaje a quien tenemos delante y confirmar que ha entendido', true, 1),
    (q2, 'Explicarlo siempre igual, sea quien sea el cliente', false, 2),
    (q2, 'Hablar rápido para no hacer esperar a la cola', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     'Una consulta de un cliente va más allá de la atención de servicio (dudas sobre un tratamiento o síntomas). ¿Qué es lo correcto?',
     'Una consulta de un cliente va más allá de la atención de servicio (dudas sobre un tratamiento o síntomas). ¿Qué es lo correcto?',
     'multiple_choice',
     '["Responder igualmente para no hacer esperar","Derivar al farmacéutico con naturalidad","Restar importancia para que el cliente se quede tranquilo","Buscar la respuesta en internet delante del cliente"]'::jsonb,
     1,
     'Reconocer el límite del propio papel y derivar al farmacéutico a tiempo no es un fallo: es profesionalidad y cuidado del cliente.',
     2, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, 'Responder igualmente para no hacer esperar', false, 0),
    (q3, 'Derivar al farmacéutico con naturalidad', true, 1),
    (q3, 'Restar importancia para que el cliente se quede tranquilo', false, 2),
    (q3, 'Buscar la respuesta en internet delante del cliente', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     'Sobre adaptar la atención a cada cliente, ¿qué afirmación es correcta?',
     'Sobre adaptar la atención a cada cliente, ¿qué afirmación es correcta?',
     'multiple_choice',
     '["Tratar a todos exactamente igual es lo más justo","Conviene leer con quién estamos y ajustar el trato a lo que necesita","Solo hay que esforzarse con los clientes habituales","Al cliente que llega informado hay que corregirle cuanto antes"]'::jsonb,
     1,
     'La atención excepcional no es tratar a todos igual, sino dar a cada persona lo que necesita, adaptando el trato con sensibilidad y sin etiquetar.',
     3, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Tratar a todos exactamente igual es lo más justo', false, 0),
    (q4, 'Conviene leer con quién estamos y ajustar el trato a lo que necesita', true, 1),
    (q4, 'Solo hay que esforzarse con los clientes habituales', false, 2),
    (q4, 'Al cliente que llega informado hay que corregirle cuanto antes', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     '¿Por qué es tan importante cuidar la despedida del cliente?',
     '¿Por qué es tan importante cuidar la despedida del cliente?',
     'multiple_choice',
     '["Porque es el único momento que importa de la atención","Porque el final es lo que más se recuerda e invita a volver","Porque permite cerrar más rápido la cola","Porque sustituye al resto de la atención si esta ha sido floja"]'::jsonb,
     1,
     'El final es lo que más se recuerda. Una despedida cálida que deja la puerta abierta es una de las mejores herramientas de fidelización.',
     4, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Porque es el único momento que importa de la atención', false, 0),
    (q5, 'Porque el final es lo que más se recuerda e invita a volver', true, 1),
    (q5, 'Porque permite cerrar más rápido la cola', false, 2),
    (q5, 'Porque sustituye al resto de la atención si esta ha sido floja', false, 3);

  RAISE NOTICE 'Curso 3 creado: % (quiz: %)', v_course_id, v_quiz_id;
END $$;


-- =====================================================================
-- CURSO 4 — atencion / intermedio
-- "Quejas y clientes difíciles: convertir fricción en fidelidad"
-- slug: fp-at-quejas-clientes-dificiles-friccion-fidelidad
-- =====================================================================
DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  v_mod1_id text := 'm1-queja-como-oportunidad';
  v_mod2_id text := 'm2-metodo-leer';
  v_mod3_id text := 'm3-perfiles-dificiles';
  v_mod4_id text := 'm4-recuperacion-cuidado-equipo';

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

  DELETE FROM public.courses WHERE slug = 'fp-at-quejas-clientes-dificiles-friccion-fidelidad';

  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'Quejas y clientes difíciles: convertir fricción en fidelidad',
    'fp-at-quejas-clientes-dificiles-friccion-fidelidad',
    'Las quejas y los momentos de tensión son inevitables en cualquier farmacia con trasiego. La diferencia entre un cliente perdido y uno más fiel que nunca está en cómo se gestionan. Este curso da un método claro para encajar una queja sin que escale, atender perfiles difíciles sin perder la calma, recuperar a un cliente molesto y cuidar también al equipo, que es quien aguanta la presión. Habilidades de comunicación y servicio, con casos reales de mostrador.',
    'atencion',
    'intermedio',
    1,            -- duration_hours
    8,            -- duration_minutes (1h 08 = 68 min)
    'Laura Domínguez',
    true,         -- is_published
    false,        -- is_premium
    false,        -- is_featured
    13,           -- order_index
    4,            -- total_lessons
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'La queja como oportunidad: el cambio de mentalidad que lo cambia todo',
        'duration', 15,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Nadie disfruta una queja. La reacción instintiva es ponerse a la defensiva, justificarse o desear que el momento pase cuanto antes. Pero hay un dato que conviene tener muy presente: el cliente que se queja es el que <strong>todavía quiere darnos la oportunidad de arreglarlo</strong>. El que no se queja simplemente se va y no vuelve, y muchas veces se lo cuenta a otros. Visto así, una queja no es un ataque: es información valiosa y una segunda oportunidad.</p>'
          || '<h3>Por qué una queja bien gestionada fideliza más que no tener queja</h3>'
          || '<p>Hay un fenómeno bien conocido en atención al cliente: una persona cuyo problema se resuelve bien suele quedar <strong>más fiel</strong> que otra que nunca tuvo ningún problema. La razón es que la resolución demuestra de qué pasta está hecha la farmacia. Cuando todo va bien, el cliente no sabe cómo reaccionaríais ante un fallo; cuando algo se tuerce y respondéis con cuidado, lo descubre, y eso construye una confianza muy difícil de romper.</p>'
          || '<h3>Separar el problema de la persona</h3>'
          || '<p>La clave emocional de toda la gestión está aquí: <strong>la queja no es contra vosotros, es sobre una situación</strong>. Aunque el cliente lo exprese de malas formas, lo que hay debajo es una expectativa que no se ha cumplido. Si lo tomáis como algo personal, entraréis en defensa o en discusión, y ahí ya se ha perdido. Si lo veis como un problema a resolver juntos, mantenéis la cabeza fría y la conversación en el sitio correcto.</p>'
          || '<h3>Lo que nunca ayuda</h3>'
          || '<ul>'
          || '<li><strong>Justificarse de inmediato</strong> ("es que el sistema...", "es que la del turno anterior..."). Al cliente molesto las excusas le suenan a no asumir nada.</li>'
          || '<li><strong>Discutir quién tiene razón.</strong> Aunque la tengáis, ganar la discusión es perder al cliente.</li>'
          || '<li><strong>Quitar importancia</strong> ("no es para tanto"). Minimizar lo que siente la persona la enciende más.</li>'
          || '<li><strong>Contagiarse del tono.</strong> Si la tensión sube por los dos lados, la situación escala.</li>'
          || '</ul>'
          || '<blockquote>Una queja es un regalo incómodo: el cliente os está diciendo qué falla y os da la oportunidad de demostrar cómo respondéis. Los que se van sin decir nada no os dan esa oportunidad.</blockquote>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Recordad la última queja que recibisteis en la farmacia. Anotad qué expectativa del cliente no se había cumplido (más allá de la forma en que lo dijo). Entrenar la mirada para ver la expectativa detrás del enfado es el primer paso para gestionarlo con calma.</p>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'El método LEER: cinco pasos para gestionar una queja sin que escale',
        'duration', 18,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Improvisar ante una queja es agotador y desigual: a veces sale bien y a veces se nos va de las manos. Tener un método sencillo da seguridad a todo el equipo y hace que la respuesta sea coherente. Aquí lo resumimos en una palabra fácil de recordar en plena tensión: <strong>LEER</strong>.</p>'
          || '<h3>L — Listen (escuchar sin interrumpir)</h3>'
          || '<p>El primer paso, y el más difícil cuando a uno le están riñendo, es <strong>dejar que el cliente se desahogue sin cortarle</strong>. Interrumpir para defenderse echa gasolina. Escuchar entero, asintiendo, hace que la persona note que se la toma en serio y, muy a menudo, que baje sola la intensidad. Quien siente que se le escucha se calma; quien siente que se le corta, se crece.</p>'
          || '<h3>E — Empatizar y disculparse por la situación</h3>'
          || '<p>Antes de explicar nada, reconocer cómo se siente la persona: <strong>"Entiendo que esté molesto, y siento que haya pasado esto"</strong>. Disculparse por la situación no es admitir una culpa concreta ni reconocer un error que quizá no se ha cometido; es reconocer que el cliente está pasando un mal rato. Esa frase desactiva gran parte de la tensión porque la persona deja de sentir que tiene que pelear para que la entiendan.</p>'
          || '<h3>E — Entender el problema con preguntas</h3>'
          || '<p>Una vez bajada la temperatura, hacen falta los datos concretos para resolver: qué ha pasado exactamente, cuándo, qué esperaba. Preguntar con calma demuestra interés real por solucionar y separa los hechos de la emoción. Aquí se confirma cuál es de verdad el problema, que a veces no es el que parecía al principio.</p>'
          || '<h3>E — Resolver (Encontrar la solución) y acordarla</h3>'
          || '<p>Llega el momento de proponer una salida concreta. Mejor todavía si se implica al cliente: "¿Cómo le viene mejor que lo solucionemos?". Cuando la solución no está en nuestra mano en ese instante, lo correcto es ser honestos y dar un compromiso claro: qué se va a hacer, quién y cuándo. Lo que nunca debe pasar es que el cliente se vaya sin saber qué ocurre con su problema.</p>'
          || '<h3>R — Rematar y hacer seguimiento</h3>'
          || '<p>Cerrar comprobando que la persona queda conforme ("¿Así le parece bien?") y, si la situación lo merece, interesarse después ("¿Le fue bien al final?"). Ese remate convierte la resolución en una muestra de cuidado que el cliente recuerda. Y conviene <strong>compartir la queja con el equipo</strong>: muchas quejas señalan un fallo de proceso que, corregido, evita que se repita.</p>'
          || '<blockquote>Ante una queja, primero las personas y después los hechos. Si intentáis resolver antes de que el cliente se sienta escuchado, ninguna solución le parecerá suficiente.</blockquote>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Coged una queja típica de vuestra farmacia y escribid, paso a paso, cómo la abordaríais con el método LEER: qué diríais al escuchar, cómo empatizaríais, qué preguntaríais, qué solución ofreceríais y cómo remataríais. Practicarlo en frío hace que salga solo en caliente.</p>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'Perfiles difíciles y situaciones tensas sin perder la calma',
        'duration', 18,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>No todos los momentos tensos son iguales, y reconocer con qué tipo de situación estamos ayuda a responder mejor. Importante: hablamos de <strong>comportamientos puntuales</strong>, no de etiquetar a las personas. El mismo cliente encantador puede tener un mal día; la habilidad está en gestionar el comportamiento sin tomarlo como algo personal.</p>'
          || '<h3>Algunos comportamientos habituales y cómo manejarlos</h3>'
          || '<ul>'
          || '<li><strong>El cliente enfadado que alza la voz.</strong> Lo prioritario es no contagiarse: mantener un tono bajo y calmado obliga a la conversación a bajar con vosotros. Escuchar, empatizar y, si la cosa es delicada delante de la cola, ofrecer atenderle un momento aparte o avisar al farmacéutico responsable.</li>'
          || '<li><strong>El cliente exigente o impaciente.</strong> Quiere sentir que su asunto importa. Ayuda reconocer su prisa, ser ágil y concreto, y darle plazos realistas en lugar de promesas que no se podrán cumplir.</li>'
          || '<li><strong>El cliente que viene con información de internet y la defiende.</strong> No conviene corregirle de forma brusca ni reírse de lo que trae. Escuchar, validar su interés por informarse y aportar criterio profesional con respeto: "Veo que se ha informado; le matizo un par de cosas que conviene tener en cuenta".</li>'
          || '<li><strong>El cliente que insiste en algo que no es posible.</strong> Aquí toca firmeza amable: explicar el porqué con claridad, sin esconderse en "es la norma", y ofrecer la alternativa que sí esté en vuestra mano.</li>'
          || '</ul>'
          || '<h3>Saber decir que no sin romper la relación</h3>'
          || '<p>En la farmacia hay cosas que no se pueden hacer, y muchas tienen que ver con el marco legal y deontológico (por ejemplo, dispensaciones que requieren receta). Decir que no es parte del trabajo, y se puede hacer cuidando al cliente: reconocer su petición, explicar el porqué de forma sencilla y honesta, mantenerse firme con amabilidad y ofrecer siempre la alternativa posible. Un "no" bien dado protege al cliente y, bien explicado, hasta refuerza la confianza en el criterio de la farmacia.</p>'
          || '<h3>Cuándo y cómo dar un paso atrás</h3>'
          || '<p>Hay límites. Ante una situación que se desborda, una falta de respeto grave o cualquier riesgo, lo correcto no es aguantar a cualquier precio, sino <strong>pasar el relevo a la persona responsable o al titular</strong> y, si hace falta, proteger la seguridad de todos. Pedir apoyo no es fracasar: forma parte de gestionar bien. Conviene tener acordado en el equipo qué hacer en esos casos para que nadie se sienta solo ante una situación límite.</p>'
          || '<blockquote>Mantener la calma no es no sentir nada: es no dejar que lo que sientes dirija tu respuesta. Esa es la habilidad que más se entrena y la que más distingue a un buen profesional del mostrador.</blockquote>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>En equipo, escoged la situación tensa que más se repite en vuestra farmacia y ensayadla con un role-play: una persona hace de cliente difícil y otra la atiende aplicando la calma y, cuando toque, la firmeza amable. Comentad qué frases funcionaron y cuáles encendieron más. Acordad también cuándo se da el relevo al responsable.</p>'
      ),
      jsonb_build_object(
        'id', v_mod4_id,
        'title', 'Recuperar al cliente y cuidar al equipo después de la tormenta',
        'duration', 17,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Gestionar bien el momento de tensión es media tarea. La otra media es lo que pasa <strong>después</strong>: recuperar de verdad al cliente y cuidar a quien ha estado en primera línea aguantando el chaparrón. Las farmacias que solo se centran en lo primero pierden algo crítico, porque un equipo quemado atiende peor todas las demás veces.</p>'
          || '<h3>La recuperación del cliente: el gesto que cambia el recuerdo</h3>'
          || '<p>Después de resolver una queja, un pequeño gesto extra puede transformar el recuerdo de toda la experiencia. No hace falta nada material ni costoso: a veces es una llamada o un mensaje para confirmar que todo quedó bien, un trato especialmente atento la siguiente vez que viene, o simplemente recordar el asunto y preguntar por él. Ese detalle le dice al cliente que no era "una incidencia más", sino una persona que importa. Es justo lo que convierte la fricción en fidelidad y, muchas veces, en que la persona acabe hablando bien de la farmacia.</p>'
          || '<h3>Aprender de la queja: que no se repita</h3>'
          || '<p>Una queja resuelta pero no analizada es media oportunidad desperdiciada. Conviene tener una rutina sencilla: anotar las quejas relevantes, comentarlas en equipo sin buscar culpables y preguntarse si detrás hay un fallo de proceso que se pueda corregir. Si una misma queja aparece varias veces, no es mala suerte: es una señal. Arreglar la causa evita decenas de tensiones futuras y mejora la experiencia de todos los clientes, no solo del que protestó.</p>'
          || '<h3>Cuidar al equipo: la pieza que casi nadie atiende</h3>'
          || '<p>Atender una queja dura deja huella. Quien acaba de pasar un mal rato en el mostrador necesita, como mínimo, <strong>desahogarse y sentirse respaldado</strong> por sus compañeros y por el titular. Algunas pautas que marcan la diferencia:</p>'
          || '<ul>'
          || '<li>Respaldar al equipo delante del cliente siempre que sea posible; las correcciones, después y en privado.</li>'
          || '<li>Dejar un momento para "soltar" lo ocurrido y, si hizo falta, reconocer el buen manejo.</li>'
          || '<li>No dejar que una persona cargue siempre sola con los clientes más difíciles: repartir y apoyarse.</li>'
          || '<li>Convertir los casos duros en aprendizaje compartido, no en reproche individual.</li>'
          || '</ul>'
          || '<p>Un equipo que se siente respaldado gestiona mejor la siguiente queja, porque sabe que no está solo. El cuidado del equipo no es un lujo: es lo que sostiene la calidad de la atención día tras día.</p>'
          || '<blockquote>Detrás de cada cliente bien recuperado hay una persona del mostrador que supo gestionarlo, y que también necesita que la cuiden. Atender al cliente y cuidar al equipo son la misma tarea.</blockquote>'
          || '<p>Con esto cerráis el método para convertir la fricción en fidelidad: ver la queja como oportunidad, aplicar el método LEER, manejar perfiles difíciles con calma y firmeza, y rematar recuperando al cliente y cuidando al equipo. En el cuestionario final repasaréis las claves.</p>'
          || '<h4>Mini-ejercicio</h4>'
          || '<p>Acordad en equipo dos rutinas sencillas: una para registrar y revisar las quejas recurrentes (para atacar la causa) y otra de apoyo mutuo tras un episodio duro (un momento para desahogarse y respaldarse). Ponerlas por escrito hace que se cumplan de verdad y no se queden en buena intención.</p>'
      )
    )
  );

  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'La queja como oportunidad', 'El cambio de mentalidad que lo cambia todo.', 1),
    (r_mod2, v_course_id, 'El método LEER', 'Cinco pasos para gestionar una queja sin que escale.', 2),
    (r_mod3, v_course_id, 'Perfiles difíciles', 'Situaciones tensas sin perder la calma.', 3),
    (r_mod4, v_course_id, 'Recuperar y cuidar al equipo', 'Después de la tormenta: cliente y equipo.', 4);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'La queja como oportunidad', 'Contenido completo en la versión JSONB del módulo 1.', 15, 1, true),
    (r_mod2, 'El método LEER', 'Contenido completo en la versión JSONB del módulo 2.', 18, 1, true),
    (r_mod3, 'Perfiles difíciles', 'Contenido completo en la versión JSONB del módulo 3.', 18, 1, true),
    (r_mod4, 'Recuperar y cuidar al equipo', 'Contenido completo en la versión JSONB del módulo 4.', 17, 1, true);

  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: quejas y clientes difíciles',
    'Comprueba que dominas la gestión de quejas y tensiones: la queja como oportunidad, el método LEER, los perfiles difíciles y la recuperación del cliente y del equipo. Necesitas un 70 % para aprobar.',
    70, NULL, true, true, 1
  );

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     '¿Por qué se dice que el cliente que se queja es una oportunidad?',
     '¿Por qué se dice que el cliente que se queja es una oportunidad?',
     'multiple_choice',
     '["Porque siempre tiene razón y hay que darle lo que pida","Porque todavía nos da la oportunidad de arreglarlo, en vez de irse sin más","Porque las quejas son poco frecuentes y no afectan al negocio","Porque permite demostrarle que se equivoca"]'::jsonb,
     1,
     'El que se queja aún quiere darnos la oportunidad de resolver. El que no se queja simplemente se va y no vuelve, y a menudo lo cuenta. Una queja bien resuelta fideliza.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Porque siempre tiene razón y hay que darle lo que pida', false, 0),
    (q1, 'Porque todavía nos da la oportunidad de arreglarlo, en vez de irse sin más', true, 1),
    (q1, 'Porque las quejas son poco frecuentes y no afectan al negocio', false, 2),
    (q1, 'Porque permite demostrarle que se equivoca', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     'En el método LEER, ¿cuál es el primer paso ante una queja?',
     'En el método LEER, ¿cuál es el primer paso ante una queja?',
     'multiple_choice',
     '["Explicar de inmediato por qué ha pasado","Escuchar al cliente sin interrumpir","Proponer enseguida una solución","Llamar al responsable antes de nada"]'::jsonb,
     1,
     'El primer paso es escuchar sin interrumpir. Dejar que el cliente se desahogue hace que note que se le toma en serio y, a menudo, que baje solo la intensidad.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'Explicar de inmediato por qué ha pasado', false, 0),
    (q2, 'Escuchar al cliente sin interrumpir', true, 1),
    (q2, 'Proponer enseguida una solución', false, 2),
    (q2, 'Llamar al responsable antes de nada', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     'Ante un cliente que alza la voz y se enfada, ¿qué ayuda a que la situación no escale?',
     'Ante un cliente que alza la voz y se enfada, ¿qué ayuda a que la situación no escale?',
     'multiple_choice',
     '["Subir también el tono para que vea que no nos achantamos","Mantener un tono bajo y calmado, sin contagiarse","Quitarle importancia diciéndole que no es para tanto","Discutir hasta dejar claro quién tiene razón"]'::jsonb,
     1,
     'No contagiarse del tono es decisivo. Mantener la calma obliga a la conversación a bajar; subir el tono o minimizar lo que siente la persona la enciende más.',
     2, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, 'Subir también el tono para que vea que no nos achantamos', false, 0),
    (q3, 'Mantener un tono bajo y calmado, sin contagiarse', true, 1),
    (q3, 'Quitarle importancia diciéndole que no es para tanto', false, 2),
    (q3, 'Discutir hasta dejar claro quién tiene razón', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     'Hay que decirle que no a un cliente que pide algo que no es posible. ¿Cuál es la mejor forma?',
     'Hay que decirle que no a un cliente que pide algo que no es posible. ¿Cuál es la mejor forma?',
     'multiple_choice',
     '["Escudarse en \"es la norma\" y zanjar la conversación","Reconocer su petición, explicar el porqué con claridad y ofrecer la alternativa posible","Acceder igualmente para evitar el conflicto","Derivar siempre al titular para no decirlo uno mismo"]'::jsonb,
     1,
     'Un no se da con firmeza amable: reconocer la petición, explicar el porqué de forma sencilla y honesta, y ofrecer la alternativa que sí esté en nuestra mano. Bien explicado, refuerza la confianza.',
     3, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Escudarse en "es la norma" y zanjar la conversación', false, 0),
    (q4, 'Reconocer su petición, explicar el porqué con claridad y ofrecer la alternativa posible', true, 1),
    (q4, 'Acceder igualmente para evitar el conflicto', false, 2),
    (q4, 'Derivar siempre al titular para no decirlo uno mismo', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     'Tras resolver una queja dura, ¿qué es importante hacer con el equipo?',
     'Tras resolver una queja dura, ¿qué es importante hacer con el equipo?',
     'multiple_choice',
     '["Pasar página cuanto antes y no volver a mencionarlo","Respaldar a la persona, dejar que se desahogue y analizar si hay un fallo de proceso","Buscar quién tuvo la culpa para que no se repita","Encargar siempre los clientes difíciles a la misma persona, por experiencia"]'::jsonb,
     1,
     'Cuidar al equipo es parte de la atención: respaldar a quien estuvo en primera línea, dejar espacio para desahogarse y analizar la queja sin culpar permite que no se repita y sostiene la calidad del servicio.',
     4, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Pasar página cuanto antes y no volver a mencionarlo', false, 0),
    (q5, 'Respaldar a la persona, dejar que se desahogue y analizar si hay un fallo de proceso', true, 1),
    (q5, 'Buscar quién tuvo la culpa para que no se repita', false, 2),
    (q5, 'Encargar siempre los clientes difíciles a la misma persona, por experiencia', false, 3);

  RAISE NOTICE 'Curso 4 creado: % (quiz: %)', v_course_id, v_quiz_id;
END $$;


-- =====================================================================
-- VERIFICACIÓN RÁPIDA (opcional, ejecutar tras los bloques anteriores)
-- =====================================================================
-- -- 1) Los 4 cursos, publicados, con su número de módulos en el JSONB:
-- SELECT slug, title, category, difficulty, is_published, is_premium,
--        duration_hours, duration_minutes,
--        jsonb_array_length(course_modules) AS n_modulos
--   FROM public.courses
--  WHERE slug IN (
--    'fp-vt-fundamentos-venta-farmacia',
--    'fp-vt-venta-consultiva-categorias-alto-margen',
--    'fp-at-atencion-cliente-excepcional-mostrador',
--    'fp-at-quejas-clientes-dificiles-friccion-fidelidad'
--  )
--  ORDER BY order_index;
--
-- -- 2) Un quiz por curso, activo y publicado, con su número de preguntas:
-- SELECT c.slug, cq.title, cq.is_active, cq.is_published,
--        COUNT(qq.id) AS n_preguntas
--   FROM public.courses c
--   JOIN public.course_quizzes cq ON cq.course_id = c.id
--   LEFT JOIN public.quiz_questions qq ON qq.quiz_id = cq.id
--  WHERE c.slug IN (
--    'fp-vt-fundamentos-venta-farmacia',
--    'fp-vt-venta-consultiva-categorias-alto-margen',
--    'fp-at-atencion-cliente-excepcional-mostrador',
--    'fp-at-quejas-clientes-dificiles-friccion-fidelidad'
--  )
--  GROUP BY c.slug, cq.id, cq.title, cq.is_active, cq.is_published
--  ORDER BY c.slug;
--
-- -- 3) Cada pregunta debe tener EXACTAMENTE una opción correcta:
-- SELECT c.slug, qq.order_index, qq.question,
--        COUNT(*) FILTER (WHERE qqo.is_correct) AS correctas
--   FROM public.courses c
--   JOIN public.course_quizzes cq ON cq.course_id = c.id
--   JOIN public.quiz_questions qq ON qq.quiz_id = cq.id
--   JOIN public.quiz_question_options qqo ON qqo.question_id = qq.id
--  WHERE c.slug IN (
--    'fp-vt-fundamentos-venta-farmacia',
--    'fp-vt-venta-consultiva-categorias-alto-margen',
--    'fp-at-atencion-cliente-excepcional-mostrador',
--    'fp-at-quejas-clientes-dificiles-friccion-fidelidad'
--  )
--  GROUP BY c.slug, qq.id, qq.order_index, qq.question
--  ORDER BY c.slug, qq.order_index;   -- todas las filas deben dar correctas = 1
-- =====================================================================
