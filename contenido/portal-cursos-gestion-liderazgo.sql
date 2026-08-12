-- =====================================================================
-- farmapro portal — CURSOS DE GESTIÓN, LIDERAZGO Y ONBOARDING
-- (listo para ejecutar en el editor SQL de Supabase / vía Lovable)
-- =====================================================================
-- Sigue EXACTAMENTE la plantilla validada portal-curso-muestra.sql.
-- Cinco cursos curados a mano, en la voz de farmapro (negocio/gestión/
-- liderazgo, nunca clínica). Cada curso: módulos con contenido REAL en
-- HTML semántico dentro del JSONB courses.course_modules (lo que pinta la
-- web), espejo relacional en course_modules/course_lessons por higiene de
-- datos, y 1 quiz publicado y activo con 5 preguntas.
--
-- CURSOS QUE CREA ESTE SCRIPT
--   1. fp-gs-dia-a-dia-tiempo-turnos-prioridades   (gestion / principiante)
--   2. fp-gs-kpis-rentabilidad-numeros-farmacia     (gestion / avanzado)
--   3. fp-ld-del-companero-al-referente             (liderazgo / principiante)
--   4. fp-ld-comunicacion-feedback-motivacion       (liderazgo / intermedio)
--   5. fp-bv-bienvenido-a-farmapro-portal           (otros / principiante)
--
-- CADA CURSO CONTIENE
--   - 1 curso  (is_published = true)
--       * difficulty: 'principiante' | 'intermedio' | 'avanzado'
--       * columnas duplicadas coherentes (duration_hours + duration_minutes)
--       * slug único con prefijo fp-gs- / fp-ld- / fp-bv-
--       * JSONB course_modules con la forma EXACTA de la muestra
--         (id estable, title, duration en MINUTOS, content HTML, video_url,
--          downloadable_resources)
--   - espejo relacional en course_modules / course_lessons (opcional, la web
--     no lo lee, se rellena por higiene como en la muestra)
--   - 1 quiz   (is_active = true Y is_published = true)
--   - 5 preguntas con question Y question_text rellenas, options (JSONB) y
--     correct_answer sincronizados con quiz_question_options
--     (una sola opción is_correct = true por pregunta; correct_answer es el
--      índice 0-based alineado con order_index).
--
-- ---------------------------------------------------------------------
-- CÓMO EJECUTARLO
--   Pegar este script entero en el editor SQL (vía Lovable / Supabase SQL).
--   Hay un bloque DO $$ ... $$ independiente por curso, en una sola tanda.
--
-- IDEMPOTENCIA / ROLLBACK
--   Cada bloque BORRA primero el curso con su slug (y, en cascada, sus
--   módulos, lecciones, quizzes, preguntas y opciones), así que el script
--   se puede re-ejecutar tantas veces como se quiera: deja siempre una sola
--   copia limpia de cada curso.
--
--   Para DESHACER por completo estos cinco cursos:
--     DELETE FROM public.courses WHERE slug IN (
--       'fp-gs-dia-a-dia-tiempo-turnos-prioridades',
--       'fp-gs-kpis-rentabilidad-numeros-farmacia',
--       'fp-ld-del-companero-al-referente',
--       'fp-ld-comunicacion-feedback-motivacion',
--       'fp-bv-bienvenido-a-farmapro-portal'
--     );
--   El ON DELETE CASCADE se encarga de módulos, quizzes, preguntas y opciones.
--
-- NOTAS DE CONTENIDO
--   - Contenido de NEGOCIO (gestión/liderazgo/onboarding), no clínico.
--     Sin promesas sanitarias. Cifras etiquetadas como "estimación sectorial".
--   - "farmapro" en minúsculas. Castellano de España (vosotros). Sin emojis.
--   - El HTML de cada módulo se sanea con DOMPurify y se pinta en .prose.
--   - instructor = "Laura Domínguez" en los cursos formativos; "farmapro" en
--     el curso de onboarding (genérico de la plataforma).
-- =====================================================================


-- #####################################################################
-- CURSO 1/5 — GESTIÓN / PRINCIPIANTE
-- "Gestión del día a día: tiempo, turnos y prioridades en la farmacia"
-- slug: fp-gs-dia-a-dia-tiempo-turnos-prioridades
-- #####################################################################
DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  -- IDs estables de módulos (JSONB + tabla relacional). El progreso por
  -- módulo se guarda por este id, así que deben ser únicos y estables.
  v_mod1_id text := 'm1-ladron-del-tiempo';
  v_mod2_id text := 'm2-priorizar-urgente-importante';
  v_mod3_id text := 'm3-turnos-y-tareas';
  v_mod4_id text := 'm4-rutina-semanal';

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

  -- 0) Limpieza idempotente
  DELETE FROM public.courses
   WHERE slug = 'fp-gs-dia-a-dia-tiempo-turnos-prioridades';

  -- 1) CURSO
  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'Gestión del día a día: tiempo, turnos y prioridades en la farmacia',
    'fp-gs-dia-a-dia-tiempo-turnos-prioridades',
    'El día de un titular se llena solo: pedidos, recetas, incidencias, el teléfono y, entre medias, el mostrador. Este curso te da un método sencillo para recuperar el control de tu tiempo, repartir turnos y tareas con criterio y dejar de apagar fuegos para empezar a dirigir. Pensado para titulares y responsables de farmacia que sienten que trabajan mucho y avanzan poco.',
    'gestion',
    'principiante',
    1,            -- duration_hours
    50,           -- duration_minutes
    'Laura Domínguez',
    true,         -- is_published
    false,        -- is_premium
    false,        -- is_featured
    10,           -- order_index
    4,            -- total_lessons
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'El ladrón del tiempo: por qué el día se llena solo',
        'duration', 12,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Si terminas la jornada agotado y con la sensación de no haber hecho "lo importante", no es un problema tuyo de organización personal: es la naturaleza misma de una farmacia. El mostrador genera interrupciones constantes y reales —un paciente que pregunta, una receta que no cuadra, el teléfono— y todas parecen urgentes en el momento. El resultado es un día reactivo: respondes a lo que llega, no a lo que decides.</p>'
          || '<h3>La trampa del titular "imprescindible"</h3>'
          || '<p>Hay un patrón que se repite farmacia tras farmacia: el titular acaba siendo el empleado más ocupado de la plantilla. Hace de farmacéutico, de cajero, de informático, de jefe de almacén y de gestor de incidencias. Lo hace por responsabilidad, pero el efecto secundario es grave: <strong>si todo pasa por ti, nada avanza cuando no estás tú</strong>. Y mientras resuelves lo operativo, lo importante —pensar la farmacia, formar al equipo, revisar números— no encuentra hueco nunca.</p>'
          || '<h3>Urgente no es lo mismo que importante</h3>'
          || '<p>Esta es la distinción que lo cambia todo, y conviene tenerla clara desde el primer minuto:</p>'
          || '<ul>'
          || '<li><strong>Urgente</strong> es lo que reclama atención ahora: el teléfono que suena, el pedido que llega, la cola en el mostrador. Casi siempre lo pone otro.</li>'
          || '<li><strong>Importante</strong> es lo que mueve la farmacia: revisar el stock muerto, preparar una campaña, tener una conversación pendiente con el equipo. Casi nunca urge, y por eso se aplaza.</li>'
          || '</ul>'
          || '<p>El problema no es que haya urgencias: en una farmacia siempre las habrá. El problema es dejar que lo urgente se coma por completo a lo importante, día tras día, hasta que lo importante se convierte en urgente de golpe (el stock caducado, el empleado que se va, la inspección).</p>'
          || '<blockquote>La pregunta que ordena el día no es "¿qué hago ahora?", sino "¿qué pasa si esto que parece urgente espera dos horas?". La mayoría de las veces, no pasa nada.</blockquote>'
          || '<p><strong>Mini-ejercicio.</strong> Mañana, durante una hora, apunta cada vez que cambies de tarea por una interrupción. No para juzgarte: para ver el tamaño real del problema. La mayoría de titulares se sorprende al contar entre 15 y 25 cambios de foco en sesenta minutos. No se puede pensar bien así, y no es culpa tuya: es el entorno. Los módulos siguientes te dan el método para domarlo.</p>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'Priorizar de verdad: la matriz urgente / importante aplicada al mostrador',
        'duration', 13,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Priorizar no es hacer una lista larga de tareas: eso solo organiza el agobio. Priorizar es decidir <strong>qué NO vas a hacer hoy</strong>, o qué va a hacer otra persona. Para eso sirve una herramienta clásica adaptada a la farmacia: clasificar cada tarea según dos ejes, si es urgente y si es importante.</p>'
          || '<h3>Los cuatro cuadrantes, con ejemplos de farmacia</h3>'
          || '<ul>'
          || '<li><strong>Urgente e importante (hazlo ya):</strong> una incidencia con un medicamento, un problema con un pedido refrigerado, una queja seria de un cliente. Es el cuadrante de las crisis. El objetivo a medio plazo es que sea cada vez más pequeño.</li>'
          || '<li><strong>Importante pero no urgente (agéndalo):</strong> revisar márgenes, planificar la campaña de invierno, formar al auxiliar nuevo, ordenar el botiquín de recomendación. Aquí está el verdadero crecimiento de la farmacia. Si no le pones día y hora, no ocurre.</li>'
          || '<li><strong>Urgente pero no importante (delégalo):</strong> contestar al comercial, recolocar un expositor, buscar un producto concreto en el almacén. Reclama atención, pero no hace falta que lo hagas tú.</li>'
          || '<li><strong>Ni urgente ni importante (elimínalo):</strong> rehacer una tarea que ya estaba bien, reuniones sin objetivo, perfeccionar un escaparate tres veces. Tiempo que se va sin retorno.</li>'
          || '</ul>'
          || '<h3>La regla de las tres prioridades del día</h3>'
          || '<p>Una lista de quince tareas no es un plan, es una fuente de frustración. En su lugar, cada mañana (o la noche anterior) elige <strong>tres cosas importantes</strong> que, si las haces, harán que el día haya valido la pena aunque surjan urgencias. Solo tres. Lo demás es relleno que se acomoda alrededor.</p>'
          || '<p>Funciona porque es realista: en una farmacia van a aparecer imprevistos sí o sí, y una lista de tres deja margen. Si terminas las tres, coges más. Si el día se tuerce, al menos has protegido lo que de verdad importaba.</p>'
          || '<blockquote>Una farmacia no mejora por hacer más cosas, sino por hacer las que mueven la aguja. Casi siempre son menos de las que crees.</blockquote>'
          || '<p><strong>Mini-ejercicio.</strong> Coge tu lista mental de pendientes y reparte cada tarea en uno de los cuatro cuadrantes. Te llevará cinco minutos y casi seguro descubrirás dos cosas: que hay tareas en "delégalo" que llevas meses haciendo tú, y que lo "importante no urgente" lleva semanas sin tocarse. Ahí está tu plan de la próxima semana.</p>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'Turnos y reparto de tareas: que la farmacia funcione sin ti delante',
        'duration', 13,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Gestionar el tiempo no va solo de tu agenda: va de la del equipo. Un cuadrante de turnos bien pensado y un reparto claro de responsabilidades te devuelven horas y, sobre todo, tranquilidad. La meta es sencilla de enunciar y difícil de lograr: <strong>que la farmacia funcione bien cuando tú no estás delante</strong>.</p>'
          || '<h3>Diseñar el cuadrante mirando la demanda real</h3>'
          || '<p>El error habitual es repartir turnos "como siempre" sin mirar cuándo entra de verdad la gente. Antes de cuadrar, observa una o dos semanas: a qué horas hay cola, qué días son flojos, cuándo llegan los pedidos. Casi todas las farmacias tienen picos predecibles (la mañana de los lunes, las primeras horas, la salida de los colegios o ambulatorios cercanos). Pon más manos en los picos y menos en los valles. Parece obvio, pero la mayoría de cuadrantes no lo reflejan.</p>'
          || '<h3>De "echar una mano en todo" a responsabilidades con nombre</h3>'
          || '<p>En muchas farmacias todo el mundo hace de todo y, en la práctica, eso significa que algunas cosas no las hace nadie. La alternativa no es la burocracia, es asignar <strong>áreas de responsabilidad</strong> con nombre y apellido:</p>'
          || '<ul>'
          || '<li>Una persona responsable de pedidos y control de caducidades.</li>'
          || '<li>Otra del orden y reposición de la zona de libre dispensación.</li>'
          || '<li>Otra de la dermocosmética o el corner, si lo hay.</li>'
          || '</ul>'
          || '<p>No quita que se ayuden entre todos; añade que haya alguien que responde de cada cosa. Cuando algo tiene dueño, deja de caer siempre sobre el titular.</p>'
          || '<h3>Delegar sin perder el control</h3>'
          || '<p>Delegar no es soltar y desentenderse, pero tampoco es vigilar cada paso. La fórmula que funciona: explica el <strong>qué</strong> y el <strong>para qué</strong> (no el cómo exacto), acuerda cuándo lo revisaréis y deja hacer. La primera vez costará más que hacerlo tú; a la tercera, recuperas el tiempo con intereses. Si nunca dejas que alguien aprenda a hacer los pedidos, estarás haciendo los pedidos el resto de tu vida.</p>'
          || '<blockquote>Toda tarea que solo sabes hacer tú es una cadena, no un signo de valía. Enseñarla es la inversión de tiempo más rentable que existe.</blockquote>'
      ),
      jsonb_build_object(
        'id', v_mod4_id,
        'title', 'Tu rutina semanal: el sistema que sostiene todo lo anterior',
        'duration', 12,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Las buenas intenciones se diluyen en el día a día. Lo que de verdad cambia una farmacia no es un golpe de organización puntual, sino una <strong>rutina</strong> ligera que se repite. La gestión no es un rasgo de carácter, es un hábito; y un hábito necesita un sitio fijo en la semana.</p>'
          || '<h3>El bloque de "trabajar EN la farmacia", no solo EN el mostrador</h3>'
          || '<p>Reserva un hueco fijo a la semana —puede bastar una hora— para lo importante no urgente: mirar números, planificar, revisar el stock, pensar la siguiente acción. Que esté en el cuadrante como un turno más, idealmente en una franja tranquila y, si puede ser, fuera del mostrador. Si esperas a "tener un rato", no llegará nunca: en una farmacia no sobran los ratos.</p>'
          || '<h3>La reunión breve de equipo</h3>'
          || '<p>Diez o quince minutos con frecuencia fija (semanal o quincenal) valen más que una reunión larga al trimestre. Sirve para alinear: qué campaña hay esta semana, qué producto reforzar, qué incidencia ha habido, qué se mejora. Breve, de pie si hace falta, con un par de acuerdos concretos al cierre. La constancia importa más que la duración.</p>'
          || '<h3>Una rutina semanal de ejemplo</h3>'
          || '<ul>'
          || '<li><strong>Lunes:</strong> elige las tres prioridades de la semana y revisa el cuadrante de turnos.</li>'
          || '<li><strong>Mitad de semana:</strong> reunión breve de equipo (15 min) y repaso de pedidos/caducidades.</li>'
          || '<li><strong>Viernes:</strong> bloque de una hora "en la farmacia": un número clave, una mejora, una conversación pendiente.</li>'
          || '</ul>'
          || '<p>No es rígido ni hay que clavarlo: es un esqueleto que evita que la semana te dirija a ti. Adáptalo a tu realidad, pero protégelo. Una farmacia con rutina avanza aunque el día sea caótico; una sin rutina solo apaga fuegos.</p>'
          || '<blockquote>No se trata de trabajar más horas, sino de que una parte de tus horas trabaje para el futuro de la farmacia y no solo para el mostrador de hoy.</blockquote>'
          || '<p>Con esto cierras el método. En el cuestionario final repasarás las ideas clave para empezar a aplicarlas esta misma semana.</p>'
      )
    )
  );

  -- 1b) ESPEJO RELACIONAL (opcional; la web no lo lee)
  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'El ladrón del tiempo', 'Por qué el día se llena solo y urgente no es importante.', 1),
    (r_mod2, v_course_id, 'Priorizar de verdad', 'La matriz urgente/importante y la regla de las tres prioridades.', 2),
    (r_mod3, v_course_id, 'Turnos y reparto de tareas', 'Cuadrantes según demanda y áreas de responsabilidad.', 3),
    (r_mod4, v_course_id, 'Tu rutina semanal', 'El sistema ligero que sostiene la gestión.', 4);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'El ladrón del tiempo', 'Contenido completo en la versión JSONB del módulo 1.', 12, 1, true),
    (r_mod2, 'Priorizar de verdad', 'Contenido completo en la versión JSONB del módulo 2.', 13, 1, true),
    (r_mod3, 'Turnos y reparto de tareas', 'Contenido completo en la versión JSONB del módulo 3.', 13, 1, true),
    (r_mod4, 'Tu rutina semanal', 'Contenido completo en la versión JSONB del módulo 4.', 12, 1, true);

  -- 2) QUIZ
  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: gestión del día a día en la farmacia',
    'Comprueba que dominas la priorización, el reparto de turnos y la rutina semanal. Necesitas un 70 % para aprobar.',
    70, NULL, true, true, 1
  );

  -- 3) PREGUNTAS + OPCIONES
  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     '¿Qué define mejor la diferencia entre una tarea urgente y una importante?',
     '¿Qué define mejor la diferencia entre una tarea urgente y una importante?',
     'multiple_choice',
     '["Urgente es lo que decide el titular; importante lo que decide el equipo","Urgente reclama atención ahora; importante es lo que hace crecer la farmacia aunque no apremie","Son sinónimos: toda urgencia es importante","Importante es siempre lo que tiene que ver con dinero"]'::jsonb,
     1,
     'Lo urgente reclama atención inmediata (y casi siempre lo impone otro); lo importante mueve la farmacia y, como rara vez apremia, se aplaza.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Urgente es lo que decide el titular; importante lo que decide el equipo', false, 0),
    (q1, 'Urgente reclama atención ahora; importante es lo que hace crecer la farmacia aunque no apremie', true, 1),
    (q1, 'Son sinónimos: toda urgencia es importante', false, 2),
    (q1, 'Importante es siempre lo que tiene que ver con dinero', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     'Según la "regla de las tres prioridades", ¿cómo conviene empezar el día?',
     'Según la "regla de las tres prioridades", ¿cómo conviene empezar el día?',
     'multiple_choice',
     '["Con una lista de todas las tareas pendientes, cuantas más mejor","Eligiendo tres cosas importantes que harían que el día valga la pena","Atendiendo primero todo lo que llegue por orden de llegada","Sin plan, para poder reaccionar a lo que surja"]'::jsonb,
     1,
     'Una lista enorme solo organiza el agobio. Elegir tres prioridades realistas protege lo importante aunque surjan urgencias.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'Con una lista de todas las tareas pendientes, cuantas más mejor', false, 0),
    (q2, 'Eligiendo tres cosas importantes que harían que el día valga la pena', true, 1),
    (q2, 'Atendiendo primero todo lo que llegue por orden de llegada', false, 2),
    (q2, 'Sin plan, para poder reaccionar a lo que surja', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     'Un comercial quiere enseñarte un producto justo en hora punta de mostrador. ¿En qué cuadrante encaja y qué deberías hacer?',
     'Un comercial quiere enseñarte un producto justo en hora punta de mostrador. ¿En qué cuadrante encaja y qué deberías hacer?',
     'multiple_choice',
     '["Urgente e importante: atenderlo de inmediato","Importante no urgente: agendarlo para el bloque semanal","Urgente no importante: delegarlo o emplazarlo, no dejar el mostrador por ello","Ni urgente ni importante: ignorarlo siempre"]'::jsonb,
     2,
     'Reclama atención pero no es importante para la marcha de la farmacia: se delega o se emplaza sin abandonar el mostrador en hora punta.',
     2, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, 'Urgente e importante: atenderlo de inmediato', false, 0),
    (q3, 'Importante no urgente: agendarlo para el bloque semanal', false, 1),
    (q3, 'Urgente no importante: delegarlo o emplazarlo, no dejar el mostrador por ello', true, 2),
    (q3, 'Ni urgente ni importante: ignorarlo siempre', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     'Al diseñar el cuadrante de turnos, ¿cuál es el criterio principal?',
     'Al diseñar el cuadrante de turnos, ¿cuál es el criterio principal?',
     'multiple_choice',
     '["Repartirlos como siempre se han hecho, por costumbre","Poner más manos en los picos reales de demanda y menos en los valles","Dar a todos exactamente las mismas horas en cada franja","Concentrar al personal a primera hora y dejar la tarde sola"]'::jsonb,
     1,
     'Antes de cuadrar conviene observar cuándo entra de verdad la gente y reforzar los picos predecibles; el resto del cuadrante se ajusta a esa demanda.',
     3, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Repartirlos como siempre se han hecho, por costumbre', false, 0),
    (q4, 'Poner más manos en los picos reales de demanda y menos en los valles', true, 1),
    (q4, 'Dar a todos exactamente las mismas horas en cada franja', false, 2),
    (q4, 'Concentrar al personal a primera hora y dejar la tarde sola', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     '¿Por qué conviene reservar un bloque semanal fijo para "trabajar EN la farmacia"?',
     '¿Por qué conviene reservar un bloque semanal fijo para "trabajar EN la farmacia"?',
     'multiple_choice',
     '["Porque queda bien de cara al equipo","Porque lo importante no urgente solo ocurre si tiene día y hora reservados","Porque así se trabajan más horas en total","Porque sustituye por completo al trabajo de mostrador"]'::jsonb,
     1,
     'Lo importante rara vez apremia, así que si no tiene un hueco fijo se lo come el día a día. Reservarlo es lo que sostiene toda la gestión.',
     4, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Porque queda bien de cara al equipo', false, 0),
    (q5, 'Porque lo importante no urgente solo ocurre si tiene día y hora reservados', true, 1),
    (q5, 'Porque así se trabajan más horas en total', false, 2),
    (q5, 'Porque sustituye por completo al trabajo de mostrador', false, 3);

  RAISE NOTICE 'Curso 1 creado: % (quiz: %)', v_course_id, v_quiz_id;

END $$;


-- #####################################################################
-- CURSO 2/5 — GESTIÓN / AVANZADO
-- "KPIs y rentabilidad: leer los números de tu farmacia para decidir"
-- slug: fp-gs-kpis-rentabilidad-numeros-farmacia
-- #####################################################################
DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  v_mod1_id text := 'm1-de-la-caja-a-los-kpis';
  v_mod2_id text := 'm2-margen-vs-facturacion';
  v_mod3_id text := 'm3-ticket-rotacion-stock';
  v_mod4_id text := 'm4-cuadro-de-mando';

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

  DELETE FROM public.courses
   WHERE slug = 'fp-gs-kpis-rentabilidad-numeros-farmacia';

  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'KPIs y rentabilidad: leer los números de tu farmacia para decidir',
    'fp-gs-kpis-rentabilidad-numeros-farmacia',
    'Facturar mucho no es lo mismo que ganar dinero. Este curso, de nivel avanzado, te enseña a leer los indicadores que de verdad explican la salud de tu farmacia —margen, ticket medio, rotación de stock, peso del SOE— y a convertirlos en decisiones. Sin jerga contable: ejemplos con números, errores típicos y un cuadro de mando de cinco cifras que puedes revisar en quince minutos al mes. Para titulares que ya gestionan y quieren decidir con datos, no con sensaciones.',
    'gestion',
    'avanzado',
    1,            -- duration_hours
    10,           -- duration_minutes  (1 h 10 min)
    'Laura Domínguez',
    true,         -- is_published
    true,         -- is_premium  -> gancho de suscripción (curso avanzado de valor)
    false,        -- is_featured
    11,           -- order_index
    4,            -- total_lessons
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'De la caja al cuadro de mando: por qué la facturación engaña',
        'duration', 16,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Muchos titulares miran un solo número al final del día: lo que ha entrado en caja. Es comprensible, pero es engañoso. La facturación cuenta cuánto ha pasado por el mostrador, no cuánto te has quedado. Dos farmacias con la misma facturación pueden tener resultados muy distintos según su margen, su estructura de costes y la mezcla de lo que venden. <strong>Gestionar con datos empieza por mirar los números correctos.</strong></p>'
          || '<h3>Qué es un KPI (sin jerga)</h3>'
          || '<p>KPI son las siglas de <em>indicador clave de rendimiento</em>. Suena a consultoría, pero la idea es simple: de todos los números que genera tu farmacia, hay un puñado que de verdad explican cómo va. Un KPI es un número que, cuando sube o baja, te dice algo que puedes accionar. La facturación, por sí sola, no lo es: puede subir mientras tu beneficio baja.</p>'
          || '<h3>Los cinco números que importan (los veremos uno a uno)</h3>'
          || '<ul>'
          || '<li><strong>Margen bruto:</strong> qué porcentaje de lo que vendes se queda como beneficio antes de gastos.</li>'
          || '<li><strong>Ticket medio:</strong> cuánto gasta de media cada cliente que pasa por caja.</li>'
          || '<li><strong>Rotación de stock:</strong> cuántas veces al año "das la vuelta" a tu inventario.</li>'
          || '<li><strong>Peso del SOE frente a venta libre:</strong> cuánto dependes de la receta financiada (margen regulado y bajo) frente a la parafarmacia (margen mayor).</li>'
          || '<li><strong>Coste de personal sobre ventas:</strong> qué parte de lo que vendes se va en salarios.</li>'
          || '</ul>'
          || '<h3>Por qué el margen del SOE lo cambia todo</h3>'
          || '<p>En la farmacia española, la dispensación de receta financiada tiene un margen regulado y bajo, mientras que la venta libre (OTC, dermocosmética, complementos) deja un margen muy superior. Esto significa que <strong>una farmacia muy dependiente del SOE puede facturar mucho y ganar poco</strong>, y que el crecimiento rentable casi siempre pasa por la venta libre. No es un dato menor: es la clave para interpretar el resto de indicadores. (Las cifras exactas dependen de cada farmacia y del marco vigente; trátalas como estimación sectorial y calcula siempre las tuyas.)</p>'
          || '<blockquote>La pregunta del titular que gestiona con datos no es "¿cuánto he facturado?", sino "¿cuánto me he quedado, y de dónde ha venido?".</blockquote>'
          || '<p><strong>Mini-ejercicio.</strong> Antes de seguir, anota de memoria tu margen bruto aproximado y qué porcentaje de tu venta es SOE. Si dudas, ya tienes el primer motivo para terminar este curso: esos dos números deberían estar siempre en tu cabeza.</p>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'Margen frente a facturación: dónde está el beneficio de verdad',
        'duration', 18,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Si solo te quedas con una idea de este curso, que sea esta: <strong>el margen, no la facturación, es lo que paga las nóminas y el alquiler</strong>. Vender más con menos margen puede dejarte peor que vender menos con más margen. Veámoslo con números, que es como se entiende de verdad.</p>'
          || '<h3>Un ejemplo que lo deja claro</h3>'
          || '<p>Imagina dos meses en tu farmacia (cifras de ejemplo para ilustrar el concepto, no un dato del sector):</p>'
          || '<ul>'
          || '<li><strong>Mes A:</strong> facturas 60.000 EUR con un margen medio del 24 %. Beneficio bruto: unos 14.400 EUR.</li>'
          || '<li><strong>Mes B:</strong> facturas 66.000 EUR (un 10 % más) pero, por una promoción agresiva y más peso de receta, el margen baja al 21 %. Beneficio bruto: unos 13.860 EUR.</li>'
          || '</ul>'
          || '<p>Has vendido más en el mes B y has ganado menos. Si solo miraras la caja, celebrarías el mes equivocado. Esto pasa a diario en farmacias que persiguen facturación sin vigilar el margen.</p>'
          || '<h3>Cómo se calcula el margen bruto</h3>'
          || '<p>El margen bruto es lo que te queda de cada venta tras descontar lo que te costó el producto, expresado en porcentaje sobre la venta. En esencia: <em>(venta − coste de lo vendido) ÷ venta × 100</em>. No necesitas una contabilidad sofisticada para estimarlo; tu programa de gestión suele darlo por familias o categorías. Lo importante es mirarlo <strong>por categorías</strong>, no solo en global, porque ahí están las decisiones.</p>'
          || '<h3>Las palancas reales del margen</h3>'
          || '<ul>'
          || '<li><strong>Mezcla de venta:</strong> cuanto mayor sea el peso de la venta libre de buen margen, mejor margen global. Esto se trabaja con la recomendación en el mostrador y con las categorías que potencias.</li>'
          || '<li><strong>Política de descuentos:</strong> un descuento es margen que regalas. A veces tiene sentido (rotar stock, fidelizar); a menudo es una fuga silenciosa. Mídelo.</li>'
          || '<li><strong>Compras y condiciones:</strong> negociar mejor con proveedores y aprovechar el cooperativismo o las centrales mejora el coste y, por tanto, el margen.</li>'
          || '</ul>'
          || '<blockquote>Una subida de tres puntos de margen suele tener más impacto en tu bolsillo que una subida de diez puntos de facturación. Y casi siempre es más fácil de conseguir.</blockquote>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'Ticket medio y rotación de stock: dos indicadores que mueven la aguja',
        'duration', 18,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Margen y facturación cuentan el resultado. El <strong>ticket medio</strong> y la <strong>rotación de stock</strong> explican cómo influir en él: el primero actúa sobre los ingresos, el segundo sobre el dinero inmovilizado. Son los dos indicadores donde un titular avanzado puede ganar más rápido.</p>'
          || '<h3>Ticket medio: el ingreso por cliente</h3>'
          || '<p>El ticket medio es lo que gasta de media cada cliente que pasa por caja. Se calcula dividiendo la facturación de un periodo entre el número de operaciones (tickets). Es potente porque <strong>subirlo no exige más clientes</strong>, solo atender mejor a los que ya entran. Si tu ticket medio sube de 9 a 10 EUR (cifra de ejemplo) con el mismo número de clientes, el efecto sobre la facturación anual es enorme.</p>'
          || '<p>Las palancas del ticket medio son de gestión y de mostrador: la recomendación complementaria honesta, la visibilidad de categorías de buen margen, las promociones por volumen bien pensadas y la formación del equipo en venta cruzada ética. No va de presionar; va de completar bien la necesidad del cliente.</p>'
          || '<h3>Rotación de stock: el dinero dormido en los cajones</h3>'
          || '<p>La rotación mide cuántas veces al año vendes y repones tu inventario. Una rotación baja significa dinero parado en estanterías —dinero que no trabaja y que, además, corre riesgo de caducar. Se estima dividiendo el coste de lo vendido en un año entre el valor medio del stock. Cuanto más alta, mejor usas tu dinero.</p>'
          || '<ul>'
          || '<li><strong>Stock muerto:</strong> referencias que llevan meses sin venderse. Cada una es dinero inmovilizado y espacio ocupado. Identificarlo y liquidarlo o devolverlo libera caja.</li>'
          || '<li><strong>Roturas de stock:</strong> el extremo contrario. Quedarte sin un producto que te piden es una venta perdida y un cliente que se va a la de enfrente. El equilibrio es el arte de la gestión de compras.</li>'
          || '<li><strong>Análisis ABC:</strong> no todas las referencias merecen la misma atención. Un grupo pequeño de productos suele concentrar la mayor parte de tus ventas; vigílalos de cerca y no permitas que se agoten.</li>'
          || '</ul>'
          || '<blockquote>Una farmacia con stock muerto es una farmacia que ha guardado su beneficio en un cajón y ha tirado la llave. La rotación es la palanca para recuperarlo.</blockquote>'
          || '<p><strong>Mini-ejercicio.</strong> Pide a tu programa de gestión el listado de referencias sin venta en los últimos seis meses. Suma su valor de coste. Esa cifra es dinero tuyo dormido: el primer objetivo concreto de tu cuadro de mando.</p>'
      ),
      jsonb_build_object(
        'id', v_mod4_id,
        'title', 'Tu cuadro de mando: cinco cifras y una rutina mensual de 15 minutos',
        'duration', 18,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Tener muchos datos no sirve de nada si no los miras con método. Un cuadro de mando no es un informe complejo: es <strong>una hoja con cinco cifras y su evolución</strong>, revisada con una cadencia fija. El objetivo es decidir, no contemplar.</p>'
          || '<h3>Las cinco cifras del cuadro de mando de farmacia</h3>'
          || '<ol>'
          || '<li><strong>Facturación del mes</strong> (y comparada con el mismo mes del año anterior, no con el mes pasado: la farmacia es estacional).</li>'
          || '<li><strong>Margen bruto medio</strong> en porcentaje, idealmente desglosado entre SOE y venta libre.</li>'
          || '<li><strong>Ticket medio</strong> del mes.</li>'
          || '<li><strong>Valor del stock</strong> y, si puedes, el dato de stock sin movimiento.</li>'
          || '<li><strong>Coste de personal sobre ventas</strong>, tu mayor partida de gasto.</li>'
          || '</ol>'
          || '<h3>Comparar bien: contra el año anterior y contra ti mismo</h3>'
          || '<p>Un número aislado no dice nada. 24 % de margen, ¿es bueno o malo? Depende de tu histórico y de tu mezcla de venta. Por eso el cuadro de mando se mira siempre en evolución: cada cifra al lado de la del mismo periodo del año pasado y de la tendencia de los últimos meses. <strong>La dirección importa más que el valor absoluto.</strong> Un margen del 22 % que sube tres meses seguidos es mejor noticia que un 25 % que cae.</p>'
          || '<h3>La rutina de los 15 minutos</h3>'
          || '<p>Una vez al mes, en tu bloque de gestión, rellena las cinco cifras y hazte tres preguntas:</p>'
          || '<ul>'
          || '<li>¿Qué número se ha movido más respecto al año anterior, y por qué?</li>'
          || '<li>¿Hay alguna fuga evidente (margen que cae, stock que crece, personal que se dispara)?</li>'
          || '<li>¿Cuál es la <strong>una</strong> acción de este mes para mejorar el indicador más flojo?</li>'
          || '</ul>'
          || '<p>Quince minutos al mes te dan algo que la mayoría de farmacias no tiene: criterio. Dejas de decidir por sensación —"este mes ha ido flojo"— y empiezas a decidir por evidencia —"el margen cae porque ha subido el peso del SOE; toca reforzar la venta libre de la categoría X".</p>'
          || '<blockquote>No necesitas ser economista para gestionar bien una farmacia. Necesitas mirar cinco cifras, en evolución, todos los meses, y actuar sobre la más floja.</blockquote>'
          || '<p>Con esto cierras el método. El cuestionario final repasa los conceptos para que el cuadro de mando se convierta en un hábito y no en una buena intención.</p>'
      )
    )
  );

  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'De la caja al cuadro de mando', 'Por qué la facturación engaña y qué cinco KPIs importan.', 1),
    (r_mod2, v_course_id, 'Margen frente a facturación', 'Dónde está el beneficio de verdad y cómo se calcula el margen.', 2),
    (r_mod3, v_course_id, 'Ticket medio y rotación de stock', 'Los dos indicadores que mueven la aguja más rápido.', 3),
    (r_mod4, v_course_id, 'Tu cuadro de mando', 'Cinco cifras y una rutina mensual de 15 minutos.', 4);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'De la caja al cuadro de mando', 'Contenido completo en la versión JSONB del módulo 1.', 16, 1, false),
    (r_mod2, 'Margen frente a facturación', 'Contenido completo en la versión JSONB del módulo 2.', 18, 1, false),
    (r_mod3, 'Ticket medio y rotación de stock', 'Contenido completo en la versión JSONB del módulo 3.', 18, 1, false),
    (r_mod4, 'Tu cuadro de mando', 'Contenido completo en la versión JSONB del módulo 4.', 18, 1, false);

  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: KPIs y rentabilidad de la farmacia',
    'Comprueba que sabes interpretar margen, ticket medio, rotación y construir tu cuadro de mando. Necesitas un 70 % para aprobar.',
    70, NULL, true, true, 1
  );

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     '¿Por qué la facturación, por sí sola, es un indicador engañoso?',
     '¿Por qué la facturación, por sí sola, es un indicador engañoso?',
     'multiple_choice',
     '["Porque siempre es más baja de lo que parece","Porque mide cuánto pasa por el mostrador, no cuánto te quedas tras coste y margen","Porque no la registra el programa de gestión","Porque solo importa en las farmacias grandes"]'::jsonb,
     1,
     'Dos farmacias con la misma facturación pueden tener beneficios muy distintos según su margen y su mezcla de venta. La caja no mide lo que te quedas.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Porque siempre es más baja de lo que parece', false, 0),
    (q1, 'Porque mide cuánto pasa por el mostrador, no cuánto te quedas tras coste y margen', true, 1),
    (q1, 'Porque no la registra el programa de gestión', false, 2),
    (q1, 'Porque solo importa en las farmacias grandes', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     'Un mes facturas un 10 % más, pero el margen medio baja del 24 % al 21 %. ¿Qué ha pasado, probablemente?',
     'Un mes facturas un 10 % más, pero el margen medio baja del 24 % al 21 %. ¿Qué ha pasado, probablemente?',
     'multiple_choice',
     '["Has ganado seguro más dinero porque has vendido más","Puedes haber ganado menos: más facturación con menos margen no garantiza más beneficio","El margen no influye en el beneficio","Es imposible que ocurra"]'::jsonb,
     1,
     'Vender más con menos margen puede dejar un beneficio bruto igual o inferior. Por eso el margen se vigila siempre junto a la facturación.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'Has ganado seguro más dinero porque has vendido más', false, 0),
    (q2, 'Puedes haber ganado menos: más facturación con menos margen no garantiza más beneficio', true, 1),
    (q2, 'El margen no influye en el beneficio', false, 2),
    (q2, 'Es imposible que ocurra', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     '¿Por qué subir el ticket medio es una palanca tan eficaz?',
     '¿Por qué subir el ticket medio es una palanca tan eficaz?',
     'multiple_choice',
     '["Porque obliga a subir los precios de todo","Porque mejora la facturación sin necesidad de atraer más clientes, atendiendo mejor a los que ya entran","Porque reduce el número de clientes","Porque solo depende de la publicidad exterior"]'::jsonb,
     1,
     'El ticket medio sube atendiendo mejor a los clientes actuales (recomendación complementaria, categorías visibles), sin depender de captar más tráfico.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, 'Porque obliga a subir los precios de todo', false, 0),
    (q3, 'Porque mejora la facturación sin necesidad de atraer más clientes, atendiendo mejor a los que ya entran', true, 1),
    (q3, 'Porque reduce el número de clientes', false, 2),
    (q3, 'Porque solo depende de la publicidad exterior', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     'Una rotación de stock baja indica, sobre todo, que…',
     'Una rotación de stock baja indica, sobre todo, que…',
     'multiple_choice',
     '["Estás vendiendo demasiado rápido","Hay dinero inmovilizado en inventario que no trabaja y puede caducar","Tu margen es necesariamente alto","No tienes suficientes referencias"]'::jsonb,
     1,
     'Rotación baja = inventario parado. Es dinero dormido y riesgo de caducidad; identificar el stock muerto libera caja.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Estás vendiendo demasiado rápido', false, 0),
    (q4, 'Hay dinero inmovilizado en inventario que no trabaja y puede caducar', true, 1),
    (q4, 'Tu margen es necesariamente alto', false, 2),
    (q4, 'No tienes suficientes referencias', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     'Al revisar el cuadro de mando, ¿con qué conviene comparar cada cifra del mes?',
     'Al revisar el cuadro de mando, ¿con qué conviene comparar cada cifra del mes?',
     'multiple_choice',
     '["Con la farmacia de enfrente","Con el mismo periodo del año anterior y la tendencia reciente, porque la dirección importa más que el valor absoluto","Con un número redondo que suene bien","No hace falta comparar, basta el valor del mes"]'::jsonb,
     1,
     'Un número aislado no dice nada. Se interpreta en evolución: contra el mismo mes del año anterior (la farmacia es estacional) y contra la tendencia.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Con la farmacia de enfrente', false, 0),
    (q5, 'Con el mismo periodo del año anterior y la tendencia reciente, porque la dirección importa más que el valor absoluto', true, 1),
    (q5, 'Con un número redondo que suene bien', false, 2),
    (q5, 'No hace falta comparar, basta el valor del mes', false, 3);

  RAISE NOTICE 'Curso 2 creado: % (quiz: %)', v_course_id, v_quiz_id;

END $$;


-- #####################################################################
-- CURSO 3/5 — LIDERAZGO / PRINCIPIANTE
-- "Liderar tu equipo de farmacia: del compañero al referente"
-- slug: fp-ld-del-companero-al-referente
-- #####################################################################
DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  v_mod1_id text := 'm1-jefe-sin-distancia';
  v_mod2_id text := 'm2-claridad-de-rol';
  v_mod3_id text := 'm3-autoridad-sin-imponer';
  v_mod4_id text := 'm4-primeros-pasos';

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

  DELETE FROM public.courses
   WHERE slug = 'fp-ld-del-companero-al-referente';

  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'Liderar tu equipo de farmacia: del compañero al referente',
    'fp-ld-del-companero-al-referente',
    'Dirigir un equipo de cuatro personas puede ser más difícil que dirigir cuarenta: no hay distancia, hay historia compartida. Este curso es el primer paso para titulares que nunca recibieron formación en liderazgo. Aprenderás a pasar de "uno más" a referente sin perder la cercanía, a dar claridad de rol y a ejercer una autoridad sana basada en ser predecible. Sin teoría de manual: el liderazgo concreto que cabe en una farmacia pequeña.',
    'liderazgo',
    'principiante',
    1,            -- duration_hours
    0,            -- duration_minutes (1 h justa)
    'Laura Domínguez',
    true,         -- is_published
    false,        -- is_premium
    false,        -- is_featured
    12,           -- order_index
    4,            -- total_lessons
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'El jefe que come cada día con su equipo: el dilema del titular',
        'duration', 14,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Hay una diferencia entre dirigir una empresa de cuarenta personas y dirigir una farmacia de cuatro que casi nadie nombra: la distancia. En la empresa grande, el jefe tiene despacho, agenda y capas intermedias. En tu farmacia no. La persona a la que tienes que llamar la atención por llegar tarde es la misma con la que compartirás mostrador toda la mañana, el café de media tarde y, posiblemente, la guardia del sábado. No hay distancia. Hay historia compartida.</p>'
          || '<h3>Por qué un equipo pequeño es más difícil de liderar</h3>'
          || '<p>Precisamente por esa cercanía. En un equipo grande puedes tomar una decisión impopular y no cruzarte con los afectados hasta la siguiente reunión. En una farmacia, todo es cara a cara y en caliente. Por eso tantos titulares brillantes en lo profesional —formados, rigurosos, queridos por sus pacientes— conviven con problemas de equipo enquistados durante años: el retraso que se volvió costumbre, el reparto de tareas que nadie revisa, la tensión entre dos compañeras que todo el mundo nota y nadie nombra.</p>'
          || '<p><strong>No es falta de carácter. Es que nadie nos enseñó.</strong> En la facultad había farmacología y legislación; no había una sola hora sobre cómo decirle a alguien que aprecias que su actitud está afectando al equipo. Liderar es una habilidad, y como toda habilidad se aprende. Empieza por desmontar el mito de que el líder "se nace".</p>'
          || '<h3>El precio de no ejercer</h3>'
          || '<p>Cuando el titular no ejerce de líder, el liderazgo no desaparece: se redistribuye solo, y casi nunca bien. Lo ocupa la persona con más carácter, o la más antigua, o directamente el caos. Y el coste es muy concreto, según vemos farmacia tras farmacia (estimación sectorial):</p>'
          || '<ul>'
          || '<li><strong>Se trabaja por inercia, no por criterio:</strong> "se hace así porque siempre se ha hecho así", aunque ya no tenga sentido.</li>'
          || '<li><strong>Los buenos se desgastan:</strong> el empleado responsable absorbe el trabajo del que no lo es; al principio calla, con el tiempo se quema o se va. Y se va el que no querías perder.</li>'
          || '<li><strong>El mostrador lo nota:</strong> un equipo tenso atiende peor; no hace falta que discutan delante del cliente, la frialdad se percibe.</li>'
          || '<li><strong>Las iniciativas mueren:</strong> toda novedad —una campaña, una categoría— necesita un equipo que reme; sin liderazgo, se recibe como "más trabajo".</li>'
          || '</ul>'
          || '<blockquote>La mayoría de los problemas de equipo en farmacia no nacen de un mal profesional, sino de expectativas que nunca se pusieron en palabras.</blockquote>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'Claridad de rol: el primer regalo que puedes hacerle a tu equipo',
        'duration', 15,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Antes de pensar en motivar, en dar feedback o en resolver conflictos, hay un cimiento sin el cual nada se sostiene: la <strong>claridad</strong>. La mayoría de los roces en una farmacia no son por mala fe, sino porque nadie dijo qué se esperaba de cada uno. Cada persona rellenó el silencio con su propia versión, y esas versiones no encajan.</p>'
          || '<h3>La pregunta que casi nadie sabe responder</h3>'
          || '<p>Cada miembro del equipo debería poder contestar en una frase a tres preguntas: <em>qué se espera de mí, qué decido yo y qué decide el titular</em>. En la mayoría de farmacias, nadie sabría responderlas con claridad —empezando, muchas veces, por el propio titular. Ese vacío es la raíz del "eso no es mi trabajo", de las tareas que no hace nadie y de las decisiones que se atascan esperando al titular.</p>'
          || '<h3>Dar claridad no es burocratizar</h3>'
          || '<p>No hace falta un organigrama ni manuales de cien páginas. Basta con poner en palabras lo que ahora está implícito:</p>'
          || '<ul>'
          || '<li><strong>Responsabilidades con nombre:</strong> quién responde de los pedidos, quién del orden de la parafarmacia, quién del corner. No para que lo haga solo esa persona, sino para que haya alguien que responde.</li>'
          || '<li><strong>Qué se puede decidir sin preguntar:</strong> hasta qué importe se acepta una devolución, qué se puede recomendar, cuándo llamar al titular. La autonomía clara libera al titular y dignifica al equipo.</li>'
          || '<li><strong>Qué significa "hacerlo bien":</strong> el estándar de atención, de orden, de protocolo. Si no se dice, cada uno aplica el suyo.</li>'
          || '</ul>'
          || '<h3>Un mini-ejercicio para esta semana</h3>'
          || '<p>Coge un papel y, para cada persona del equipo, escribe en una línea: cuál es su responsabilidad principal y qué decisiones puede tomar sola. Si te cuesta, ya has encontrado el origen de varios problemas. Después, contrástalo con cada una en una conversación corta: "quiero que tengamos claro qué esperamos el uno del otro". No es un examen; es un alivio. La gente trabaja mucho mejor cuando sabe a qué atenerse.</p>'
          || '<blockquote>La claridad es una forma de respeto. Un equipo no necesita un jefe que lo controle todo; necesita saber qué se espera de cada cual.</blockquote>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'Autoridad sin imponer: ser referente por ser predecible',
        'duration', 16,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Muchos titulares confunden liderar con mandar, y como no se sienten cómodos mandando, no lideran. Pero en una farmacia pequeña la autoridad sana no viene de imponer: <strong>viene de ser predecible</strong>. El referente no es el que más grita ni el que más ordena; es aquel con quien se puede contar con regularidad.</p>'
          || '<h3>Qué hace a alguien un referente</h3>'
          || '<ul>'
          || '<li><strong>Coherencia:</strong> dice las cosas y las cumple; lo que vale el lunes vale el jueves. Un jefe imprevisible genera más estrés que uno exigente.</li>'
          || '<li><strong>Ejemplo:</strong> el estándar lo marca lo que el titular hace, no lo que dice. Si pides puntualidad y llegas tarde, no hay discurso que valga.</li>'
          || '<li><strong>Justicia:</strong> trata los mismos hechos de la misma manera, venga de quien venga. El equipo detecta al instante los favoritismos, y nada erosiona más la autoridad.</li>'
          || '<li><strong>Decir las cosas a tiempo:</strong> el referente no acumula reproches ni explota; nombra los temas cuando son pequeños, en privado y sin dramatismo.</li>'
          || '</ul>'
          || '<h3>Separar la persona del comportamiento</h3>'
          || '<p>La clave para corregir sin romper la relación —especialmente con alguien con quien llevas años— es distinguir la persona del comportamiento. La conversación bien tenida no dice "eres impuntual" (juicio a la persona, genera defensa); dice "estas tres semanas has llegado tarde cuatro veces y eso obliga a tu compañera a abrir sola" (hecho + consecuencia, genera cambio). La primera versión hiere; la segunda, en la mayoría de los casos, corrige. Y, sorprendentemente, refuerza la relación: el equipo respeta al titular que dice las cosas claras y a tiempo, y desconfía del que sonríe en el mostrador y se queja en la rebotica.</p>'
          || '<h3>Cercanía y autoridad no se excluyen</h3>'
          || '<p>Se puede ser compañero y jefe a la vez. Ser compañero no es evitar las conversaciones difíciles: es tenerlas tan bien que la relación salga fortalecida. El titular que separa el aprecio personal de la exigencia profesional no pierde la cercanía; gana respeto. Y un equipo que respeta a su titular rema con él.</p>'
          || '<blockquote>La autoridad en una farmacia pequeña no se impone, se gana. Y se gana siendo predecible: a tiempo, en privado, y cumpliendo lo que prometes.</blockquote>'
      ),
      jsonb_build_object(
        'id', v_mod4_id,
        'title', 'Tus primeros pasos como referente: qué hacer esta semana',
        'duration', 15,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>El liderazgo de tu farmacia no se decide en los momentos grandes: se decide en si tienes o no la conversación de mañana. Cerramos el curso con un plan concreto y pequeño, porque los grandes propósitos de liderazgo no sobreviven al primer día de mostrador. Tres movimientos, por orden.</p>'
          || '<h3>1. Haz la lista de lo pendiente</h3>'
          || '<p>Escribe las conversaciones que llevas meses aplazando y las responsabilidades que nadie tiene asignadas. Solo nombrarlas reduce su peso y te da un mapa. No hace falta resolverlo todo de golpe; hace falta verlo.</p>'
          || '<h3>2. Ten una conversación pequeña, no la más grave</h3>'
          || '<p>Empieza a entrenar el músculo de las conversaciones por la más fácil, no por la más espinosa. En privado, con hechos concretos (no con juicios), sin acumular reproches antiguos. El objetivo de esta primera no es resolver el mayor problema de la farmacia: es comprobar que puedes decir las cosas y que el mundo no se hunde. Casi siempre, va mejor de lo que temías.</p>'
          || '<h3>3. Da claridad a una persona</h3>'
          || '<p>Elige a un miembro del equipo y deja claro, en una conversación corta, cuál es su responsabilidad principal y qué puede decidir sin preguntarte. Practica en terreno fácil, con quien tengas mejor relación. Estás construyendo un hábito, no haciendo una reforma.</p>'
          || '<h3>El siguiente nivel</h3>'
          || '<p>Cuando estos tres movimientos te resulten naturales, el paso siguiente es incorporar una rutina de liderazgo: la reunión breve de equipo y la conversación individual periódica (el 1:1). Esas herramientas, junto con el feedback y la motivación, se trabajan en el curso de nivel intermedio. Pero no corras: un referente se construye con constancia, no con un golpe de intensidad. Empieza por la conversación de mañana.</p>'
          || '<blockquote>No tienes que convertirte en otra persona para liderar tu farmacia. Tienes que decir, a tiempo y con cariño, lo que hoy te callas.</blockquote>'
          || '<p>Con esto cierras el primer paso. El cuestionario final repasa las ideas clave para que pases del compañero al referente sin perder lo que te hace cercano.</p>'
      )
    )
  );

  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'El dilema del titular', 'Por qué un equipo pequeño es más difícil y el precio de no ejercer.', 1),
    (r_mod2, v_course_id, 'Claridad de rol', 'Qué se espera de cada uno: el cimiento del liderazgo.', 2),
    (r_mod3, v_course_id, 'Autoridad sin imponer', 'Ser referente por ser predecible; separar persona y comportamiento.', 3),
    (r_mod4, v_course_id, 'Primeros pasos', 'El plan concreto de esta semana para empezar a liderar.', 4);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'El dilema del titular', 'Contenido completo en la versión JSONB del módulo 1.', 14, 1, true),
    (r_mod2, 'Claridad de rol', 'Contenido completo en la versión JSONB del módulo 2.', 15, 1, true),
    (r_mod3, 'Autoridad sin imponer', 'Contenido completo en la versión JSONB del módulo 3.', 16, 1, true),
    (r_mod4, 'Primeros pasos', 'Contenido completo en la versión JSONB del módulo 4.', 15, 1, true);

  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: del compañero al referente',
    'Comprueba que entiendes por qué liderar un equipo pequeño es distinto y cómo dar claridad y autoridad sana. Necesitas un 70 % para aprobar.',
    70, NULL, true, true, 1
  );

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     '¿Por qué dirigir un equipo de cuatro puede ser más difícil que dirigir uno de cuarenta?',
     '¿Por qué dirigir un equipo de cuatro puede ser más difícil que dirigir uno de cuarenta?',
     'multiple_choice',
     '["Porque hay más tareas administrativas","Porque no hay distancia: el titular comparte mostrador, café y guardias con la persona a la que debe corregir","Porque los equipos pequeños cobran más","Porque la ley lo exige"]'::jsonb,
     1,
     'En un equipo pequeño no hay capas ni despacho: todo es cara a cara y con historia compartida, lo que hace más difícil corregir y decidir.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Porque hay más tareas administrativas', false, 0),
    (q1, 'Porque no hay distancia: el titular comparte mostrador, café y guardias con la persona a la que debe corregir', true, 1),
    (q1, 'Porque los equipos pequeños cobran más', false, 2),
    (q1, 'Porque la ley lo exige', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     'Cuando el titular no ejerce de líder, ¿qué ocurre con el liderazgo?',
     'Cuando el titular no ejerce de líder, ¿qué ocurre con el liderazgo?',
     'multiple_choice',
     '["Desaparece y el equipo se autogestiona perfectamente","No desaparece: lo ocupa la inercia, la persona con más carácter o el caos","Lo asume automáticamente el proveedor","Se resuelve solo con el tiempo"]'::jsonb,
     1,
     'El liderazgo no se evapora: se redistribuye solo y casi nunca bien, con costes concretos en desgaste, atención y iniciativas.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'Desaparece y el equipo se autogestiona perfectamente', false, 0),
    (q2, 'No desaparece: lo ocupa la inercia, la persona con más carácter o el caos', true, 1),
    (q2, 'Lo asume automáticamente el proveedor', false, 2),
    (q2, 'Se resuelve solo con el tiempo', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     '¿Qué significa "dar claridad de rol" al equipo?',
     '¿Qué significa "dar claridad de rol" al equipo?',
     'multiple_choice',
     '["Crear un organigrama de cien páginas y manuales detallados","Que cada persona sepa qué se espera de ella, qué decide y qué decide el titular","Controlar cada tarea que hacen","Subir el sueldo a quien asuma más responsabilidad"]'::jsonb,
     1,
     'La claridad de rol es poner en palabras lo implícito: responsabilidades con nombre y qué se puede decidir sin preguntar. No es burocracia.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, 'Crear un organigrama de cien páginas y manuales detallados', false, 0),
    (q3, 'Que cada persona sepa qué se espera de ella, qué decide y qué decide el titular', true, 1),
    (q3, 'Controlar cada tarea que hacen', false, 2),
    (q3, 'Subir el sueldo a quien asuma más responsabilidad', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     'En una farmacia pequeña, la autoridad sana del titular se basa sobre todo en…',
     'En una farmacia pequeña, la autoridad sana del titular se basa sobre todo en…',
     'multiple_choice',
     '["Imponerse y recordar quién manda","Ser predecible: coherencia, ejemplo, justicia y decir las cosas a tiempo","Mantener distancia y no comer nunca con el equipo","Premiar siempre a la persona más antigua"]'::jsonb,
     1,
     'El referente es aquel con quien se puede contar con regularidad. La autoridad se gana siendo predecible, no imponiéndose.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Imponerse y recordar quién manda', false, 0),
    (q4, 'Ser predecible: coherencia, ejemplo, justicia y decir las cosas a tiempo', true, 1),
    (q4, 'Mantener distancia y no comer nunca con el equipo', false, 2),
    (q4, 'Premiar siempre a la persona más antigua', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     'Para corregir a un compañero de años sin dañar la relación, conviene…',
     'Para corregir a un compañero de años sin dañar la relación, conviene…',
     'multiple_choice',
     '["Decirle que es impuntual y desordenado, para que reaccione","Hablar de hechos y consecuencias concretas, no juzgar a la persona","Esperar a acumular varios fallos y soltarlos juntos","Comentarlo delante del resto para que sirva de ejemplo"]'::jsonb,
     1,
     'Separar persona y comportamiento (hecho + consecuencia, no juicio) genera cambio en lugar de defensa y, bien hecho, refuerza la relación.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Decirle que es impuntual y desordenado, para que reaccione', false, 0),
    (q5, 'Hablar de hechos y consecuencias concretas, no juzgar a la persona', true, 1),
    (q5, 'Esperar a acumular varios fallos y soltarlos juntos', false, 2),
    (q5, 'Comentarlo delante del resto para que sirva de ejemplo', false, 3);

  RAISE NOTICE 'Curso 3 creado: % (quiz: %)', v_course_id, v_quiz_id;

END $$;


-- #####################################################################
-- CURSO 4/5 — LIDERAZGO / INTERMEDIO
-- "Comunicación, feedback y motivación del equipo"
-- slug: fp-ld-comunicacion-feedback-motivacion
-- #####################################################################
DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  v_mod1_id text := 'm1-conversaciones-difciles';
  v_mod2_id text := 'm2-feedback-que-funciona';
  v_mod3_id text := 'm3-motivacion-real';
  v_mod4_id text := 'm4-rutina-1a1-y-reuniones';

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

  DELETE FROM public.courses
   WHERE slug = 'fp-ld-comunicacion-feedback-motivacion';

  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'Comunicación, feedback y motivación del equipo',
    'fp-ld-comunicacion-feedback-motivacion',
    'Ya sabes que liderar tu farmacia pasa por hablar. Este curso, de nivel intermedio, te da las herramientas: cómo preparar y tener las conversaciones difíciles que llevas aplazando, cómo dar feedback que de verdad cambie comportamientos (en positivo y en negativo) y qué motiva a un equipo de farmacia más allá del sueldo. Cierra con la rutina que lo sostiene todo: la reunión breve de equipo y el 1:1. Con guiones y frases literales para usar mañana.',
    'liderazgo',
    'intermedio',
    1,            -- duration_hours
    5,            -- duration_minutes (1 h 5 min)
    'Laura Domínguez',
    true,         -- is_published
    false,        -- is_premium
    false,        -- is_featured
    13,           -- order_index
    4,            -- total_lessons
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'Las conversaciones que todo titular evita (y cómo tenerlas)',
        'duration', 16,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Casi todos los conflictos graves en una farmacia fueron antes conversaciones pequeñas que no se tuvieron. El retraso de cinco minutos que no se nombró se convirtió en veinte. El "ya lo hago yo" repetido se convirtió en resentimiento. Hablar a tiempo, en privado y sin dramatismo es la herramienta de gestión más rentable que existe, y es gratis. Pero no es fácil, sobre todo con personas con las que compartes mostrador a diario.</p>'
          || '<h3>Las cinco que más se repiten</h3>'
          || '<p>Si te preguntara qué conversación llevas meses aplazando, seguramente ya te ha venido una cara a la cabeza. Estas son las cinco más habituales en una farmacia (estimación sectorial a partir de lo que vemos):</p>'
          || '<ul>'
          || '<li><strong>El retraso que se volvió costumbre.</strong> Empezó siendo "no pasa nada, son cinco minutos"; ya son veinte y el resto del equipo toma nota.</li>'
          || '<li><strong>El "eso no es mi trabajo".</strong> Alguien ha decidido por su cuenta los límites de su puesto y nadie se lo ha discutido.</li>'
          || '<li><strong>El conflicto entre dos compañeras.</strong> Todo el mundo lo nota, el mostrador lo nota, y el titular hace de mensajero en lugar de sentarlas a hablar.</li>'
          || '<li><strong>La subida que no puedes dar.</strong> Te la han pedido, no puedes darla, y el silencio responde por ti en lugar de una explicación honesta.</li>'
          || '<li><strong>El buen profesional con mala actitud.</strong> La más difícil: técnicamente impecable, humanamente corrosivo. Como trabaja bien, nadie se atreve.</li>'
          || '</ul>'
          || '<h3>El método para tener una conversación difícil</h3>'
          || '<ol>'
          || '<li><strong>Prepárala:</strong> ten claro el hecho concreto (qué ha pasado, cuándo) y la consecuencia (a quién afecta y cómo). Sin datos, la conversación deriva en "tú siempre / yo nunca".</li>'
          || '<li><strong>Ábrela sin que suene a tribunal:</strong> "Quería comentar una cosa contigo, en buen tono", mejor que entrar en frío con un reproche.</li>'
          || '<li><strong>Expón hecho + consecuencia, no juicio:</strong> "estas tres semanas has llegado tarde cuatro veces y eso obliga a María a abrir sola", no "eres un impuntual".</li>'
          || '<li><strong>Escucha:</strong> a veces detrás hay una causa que no conocías. No es ceder, es entender antes de acordar.</li>'
          || '<li><strong>Cierra con un compromiso concreto:</strong> qué va a cambiar, desde cuándo, y cuándo lo revisaréis. Una conversación sin acuerdo se evapora.</li>'
          || '</ol>'
          || '<blockquote>La regla de oro: hechos y consecuencias, nunca juicios a la persona. La primera versión genera defensa; la segunda, cambio.</blockquote>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'Feedback que funciona: corregir y reconocer sin romper nada',
        'duration', 16,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>El feedback no es solo para corregir lo que va mal: también, y sobre todo, para reforzar lo que va bien. Un equipo que solo recibe noticias cuando se equivoca acaba a la defensiva; uno que escucha también cuando acierta, crece. El titular que da buen feedback convierte cada día de mostrador en una pequeña escuela.</p>'
          || '<h3>El feedback positivo: el más olvidado y el más barato</h3>'
          || '<p>Reconocer cuesta cero euros y rinde muchísimo, pero la mayoría de titulares lo da por supuesto ("para eso cobra"). Error. El reconocimiento concreto y a tiempo es uno de los mayores motores de motivación que existen. Y la clave es que sea <strong>específico</strong>: no "muy bien, buen trabajo" (suena a relleno), sino "me ha gustado cómo has manejado a ese cliente difícil: le has escuchado, no has entrado al choque y se ha ido contento". Lo concreto se cree y, además, enseña: la persona sabe exactamente qué repetir.</p>'
          || '<h3>El feedback de mejora: en privado, sobre hechos, hacia delante</h3>'
          || '<p>Para corregir sin generar defensa, tres reglas:</p>'
          || '<ul>'
          || '<li><strong>En privado, nunca delante de clientes ni compañeros.</strong> Corregir en público humilla y rompe la confianza, aunque tengas razón.</li>'
          || '<li><strong>Sobre comportamientos, no sobre la persona.</strong> "Esta ficha ha quedado incompleta" en lugar de "eres un descuidado".</li>'
          || '<li><strong>Mirando hacia delante.</strong> El feedback útil no se recrea en el error; acuerda qué hacer distinto la próxima vez.</li>'
          || '</ul>'
          || '<h3>Un mini-ejercicio: el reconocimiento de la semana</h3>'
          || '<p>Esta semana, propón te dar un feedback positivo concreto a cada persona del equipo. Solo eso. Observa el efecto: en el ambiente, en la disposición, en cómo te responden cuando luego toque corregir algo. El feedback positivo no es blandura; es construir el crédito que después te permite ser exigente sin que duela.</p>'
          || '<blockquote>Un equipo bien dirigido recibe feedback de los dos tipos, a tiempo y en privado lo de mejorar, a tiempo y sin reparos lo de reconocer.</blockquote>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'Motivación real: qué mueve a un equipo de farmacia más allá del sueldo',
        'duration', 16,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>"Es que si no les subo el sueldo, no hay manera." Es una de las frases que más se oyen, y es media verdad. El sueldo importa, claro, y tiene que ser justo; pero por encima de cierto umbral, deja de ser la palanca principal. Lo que de verdad mantiene a un buen profesional en una farmacia —y lo que hace que reme— suele ser otra cosa.</p>'
          || '<h3>Los motores que no cuestan dinero</h3>'
          || '<ul>'
          || '<li><strong>Sentirse parte, no mano de obra.</strong> Que su opinión cuente, que se le pregunte antes de cambiar algo que le afecta, que vea que sus ideas a veces se aplican.</li>'
          || '<li><strong>Crecer y aprender.</strong> Formación, una categoría nueva que dominar, más responsabilidad cuando está preparado. El estancamiento desmotiva incluso a quien cobra bien.</li>'
          || '<li><strong>Reconocimiento.</strong> Ya visto: el feedback positivo concreto es combustible puro.</li>'
          || '<li><strong>Autonomía.</strong> Poder decidir dentro de un marco claro. Microgestionar a un buen profesional es la forma más rápida de quemarlo.</li>'
          || '<li><strong>Un buen clima.</strong> Trabajar a gusto, sin tensiones enquistadas. Aquí se cierra el círculo con los módulos anteriores: las conversaciones a tiempo y el feedback construyen el clima.</li>'
          || '</ul>'
          || '<h3>Motivar es, sobre todo, no desmotivar</h3>'
          || '<p>A veces el titular busca grandes gestos motivadores cuando lo urgente es quitar los frenos. Lo que más desmotiva a un buen profesional es muy concreto: la injusticia (que el que no trabaja igual cobre o se le exija lo mismo), la falta de reconocimiento, el caos por ausencia de claridad y un jefe imprevisible. Si eliminas eso, la motivación aparece casi sola. <strong>Primero retira los frenos; después, si quieres, pisa el acelerador.</strong></p>'
          || '<h3>Cuidado con la motivación "de oferta"</h3>'
          || '<p>Las recompensas puntuales (una comida, un detalle) están bien y suman, pero no sustituyen a lo de fondo. Un equipo no se fideliza con un jamón en Navidad si el resto del año se siente invisible. La motivación sólida se construye en el día a día, con claridad, reconocimiento y trato justo.</p>'
          || '<blockquote>La gente no deja farmacias, deja jefes. Y casi nunca por dinero: por no sentirse escuchada, reconocida ni tratada con justicia.</blockquote>'
      ),
      jsonb_build_object(
        'id', v_mod4_id,
        'title', 'La rutina que lo sostiene: reunión de equipo y 1:1',
        'duration', 16,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Todo lo anterior —conversaciones, feedback, motivación— se diluye sin una rutina que le dé sitio en la semana. El liderazgo no es un rasgo, es una rutina. Dos hábitos lo sostienen casi todo: la reunión breve de equipo y la conversación individual periódica. Ninguno cuesta dinero; ambos cuestan constancia.</p>'
          || '<h3>La reunión breve de equipo</h3>'
          || '<p>Diez o quince minutos con frecuencia fija (semanal o quincenal) valen más que una reunión larga al trimestre. Sirve para alinear, no para sermonear: qué campaña hay esta semana, qué producto reforzar, qué incidencia ha habido, qué se mejora. De pie si hace falta, breve, con un par de acuerdos concretos al cierre. Y deja un hueco para que el equipo aporte: una reunión donde solo habla el titular se convierte en monólogo y deja de servir.</p>'
          || '<h3>El 1:1: el hábito que más cambia una farmacia</h3>'
          || '<p>Si solo pudieras incorporar un hábito de gestión este año, que sea este: la reunión individual periódica con cada miembro del equipo. Quince o veinte minutos, a solas, con tres preguntas sencillas:</p>'
          || '<ul>'
          || '<li><strong>¿Cómo estás?</strong> (de verdad, no de pasada entre cliente y cliente)</li>'
          || '<li><strong>¿Qué te está frenando?</strong> (qué le complica el trabajo y podrías quitar)</li>'
          || '<li><strong>¿Qué harías distinto en la farmacia?</strong> (su mirada vale oro y casi nunca se le pregunta)</li>'
          || '</ul>'
          || '<p>Parece poca cosa. No lo es. El 1:1 saca los problemas a la superficie cuando aún son pequeños, le da a cada persona un espacio donde ser escuchada de verdad y te convierte en un jefe predecible. El titular que hace 1:1 sabe lo que pasa en su farmacia antes de que pase; el que no, se entera por una carta de renuncia.</p>'
          || '<h3>Cómo empezar sin que se quede en intención</h3>'
          || '<p>Empieza por un 1:1 con la persona con la que tengas mejor relación, para practicar el formato en terreno fácil. Ponle fecha y hora reales, no "cuando podamos". Registra los compromisos para darles seguimiento el mes siguiente: un 1:1 sin seguimiento pierde fuerza. Y protégelo como protegerías una cita importante, porque lo es.</p>'
          || '<blockquote>El liderazgo de tu farmacia no se decide en los momentos grandes. Se decide en si tienes o no la conversación de mañana, y en si tienes o no la rutina que la hace ocurrir.</blockquote>'
          || '<p>Con esto cierras el curso intermedio. El cuestionario final repasa las herramientas para que la comunicación, el feedback y la motivación dejen de depender de la inspiración y pasen a ser una rutina.</p>'
      )
    )
  );

  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'Conversaciones difíciles', 'Las cinco que todo titular evita y el método para tenerlas.', 1),
    (r_mod2, v_course_id, 'Feedback que funciona', 'Reconocer y corregir sin romper la relación.', 2),
    (r_mod3, v_course_id, 'Motivación real', 'Qué mueve a un equipo de farmacia más allá del sueldo.', 3),
    (r_mod4, v_course_id, 'La rutina: reunión y 1:1', 'Los hábitos que sostienen el liderazgo.', 4);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'Conversaciones difíciles', 'Contenido completo en la versión JSONB del módulo 1.', 16, 1, true),
    (r_mod2, 'Feedback que funciona', 'Contenido completo en la versión JSONB del módulo 2.', 16, 1, true),
    (r_mod3, 'Motivación real', 'Contenido completo en la versión JSONB del módulo 3.', 16, 1, true),
    (r_mod4, 'La rutina: reunión y 1:1', 'Contenido completo en la versión JSONB del módulo 4.', 16, 1, true);

  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: comunicación, feedback y motivación',
    'Comprueba que dominas las conversaciones difíciles, el feedback eficaz y las palancas de motivación del equipo. Necesitas un 70 % para aprobar.',
    70, NULL, true, true, 1
  );

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     'Al tener una conversación difícil, ¿cómo conviene exponer el problema?',
     'Al tener una conversación difícil, ¿cómo conviene exponer el problema?',
     'multiple_choice',
     '["Con un juicio claro a la persona, para que reaccione","Con hechos concretos y su consecuencia, no con juicios a la persona","De forma ambigua, para no herir","Delante del equipo, para que quede claro"]'::jsonb,
     1,
     'La regla de oro es hecho + consecuencia, nunca juicio. El juicio genera defensa; el hecho concreto, en privado, genera cambio.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Con un juicio claro a la persona, para que reaccione', false, 0),
    (q1, 'Con hechos concretos y su consecuencia, no con juicios a la persona', true, 1),
    (q1, 'De forma ambigua, para no herir', false, 2),
    (q1, 'Delante del equipo, para que quede claro', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     '¿Cómo debe cerrarse una conversación difícil para que sirva de algo?',
     '¿Cómo debe cerrarse una conversación difícil para que sirva de algo?',
     'multiple_choice',
     '["Con un compromiso concreto: qué cambia, desde cuándo y cuándo se revisa","Dejándola abierta para no presionar","Con una advertencia de despido","Cambiando de tema para rebajar la tensión"]'::jsonb,
     0,
     'Una conversación sin acuerdo se evapora. Cerrar con un compromiso concreto y una fecha de revisión es lo que la convierte en cambio real.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'Con un compromiso concreto: qué cambia, desde cuándo y cuándo se revisa', true, 0),
    (q2, 'Dejándola abierta para no presionar', false, 1),
    (q2, 'Con una advertencia de despido', false, 2),
    (q2, 'Cambiando de tema para rebajar la tensión', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     '¿Qué caracteriza a un buen feedback positivo?',
     '¿Qué caracteriza a un buen feedback positivo?',
     'multiple_choice',
     '["Que sea genérico, tipo \"muy bien, buen trabajo\"","Que sea específico: nombra el comportamiento concreto que se quiere reforzar","Que se dé solo en la evaluación anual","Que se reserve para cuando se pide un esfuerzo extra"]'::jsonb,
     1,
     'El reconocimiento concreto se cree y enseña: la persona sabe exactamente qué repetir. El genérico suena a relleno y no refuerza nada.',
     2, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, 'Que sea genérico, tipo "muy bien, buen trabajo"', false, 0),
    (q3, 'Que sea específico: nombra el comportamiento concreto que se quiere reforzar', true, 1),
    (q3, 'Que se dé solo en la evaluación anual', false, 2),
    (q3, 'Que se reserve para cuando se pide un esfuerzo extra', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     'Más allá del sueldo justo, ¿qué motiva de verdad a un buen profesional de farmacia?',
     'Más allá del sueldo justo, ¿qué motiva de verdad a un buen profesional de farmacia?',
     'multiple_choice',
     '["Únicamente las primas económicas","Sentirse parte, crecer, ser reconocido, tener autonomía y un buen clima","Que no se le pida opinión para no molestar","Trabajar siempre en solitario"]'::jsonb,
     1,
     'Por encima de cierto umbral salarial, las palancas que retienen y movilizan son la pertenencia, el desarrollo, el reconocimiento, la autonomía y el clima.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Únicamente las primas económicas', false, 0),
    (q4, 'Sentirse parte, crecer, ser reconocido, tener autonomía y un buen clima', true, 1),
    (q4, 'Que no se le pida opinión para no molestar', false, 2),
    (q4, 'Trabajar siempre en solitario', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     '¿Por qué el 1:1 es el hábito de liderazgo que más cambia una farmacia?',
     '¿Por qué el 1:1 es el hábito de liderazgo que más cambia una farmacia?',
     'multiple_choice',
     '["Porque permite controlar todo lo que hace cada empleado","Porque saca los problemas a la superficie cuando aún son pequeños y da un espacio real de escucha","Porque sustituye a la reunión de equipo","Porque permite subir el sueldo con criterio"]'::jsonb,
     1,
     'El 1:1 periódico detecta los problemas temprano, hace que cada persona se sienta escuchada y vuelve al titular predecible. Saber antes de que pase.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Porque permite controlar todo lo que hace cada empleado', false, 0),
    (q5, 'Porque saca los problemas a la superficie cuando aún son pequeños y da un espacio real de escucha', true, 1),
    (q5, 'Porque sustituye a la reunión de equipo', false, 2),
    (q5, 'Porque permite subir el sueldo con criterio', false, 3);

  RAISE NOTICE 'Curso 4 creado: % (quiz: %)', v_course_id, v_quiz_id;

END $$;


-- #####################################################################
-- CURSO 5/5 — OTROS / PRINCIPIANTE (ONBOARDING, curso corto)
-- "Bienvenido a farmapro: cómo sacar partido al portal"
-- slug: fp-bv-bienvenido-a-farmapro-portal
-- #####################################################################
DO $$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();

  v_mod1_id text := 'm1-que-es-el-portal';
  v_mod2_id text := 'm2-cursos-y-retos';
  v_mod3_id text := 'm3-comunidad-y-recursos';

  r_mod1 uuid := gen_random_uuid();
  r_mod2 uuid := gen_random_uuid();
  r_mod3 uuid := gen_random_uuid();

  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
  q5 uuid := gen_random_uuid();
BEGIN

  DELETE FROM public.courses
   WHERE slug = 'fp-bv-bienvenido-a-farmapro-portal';

  INSERT INTO public.courses (
    id, title, slug, description, category, difficulty,
    duration_hours, duration_minutes, instructor,
    is_published, is_premium, is_featured, order_index,
    total_lessons, course_modules
  ) VALUES (
    v_course_id,
    'Bienvenido a farmapro: cómo sacar partido al portal',
    'fp-bv-bienvenido-a-farmapro-portal',
    'Un recorrido de 20 minutos para empezar con buen pie en el portal de farmapro. En tres módulos cortos verás cómo funcionan los cursos y los cuestionarios, cómo los retos y los puntos te ayudan a coger ritmo, cómo participar en la comunidad y dónde encontrar los recursos descargables. Al terminar tendrás claro por dónde seguir y te llevarás tu primer logro. Pensado para que dediques tu tiempo a lo que de verdad mejora tu farmacia.',
    'otros',
    'principiante',
    0,            -- duration_hours
    20,           -- duration_minutes
    'farmapro',
    true,         -- is_published
    false,        -- is_premium
    true,         -- is_featured -> destacado: es la puerta de entrada
    1,            -- order_index  (primero del catálogo)
    3,            -- total_lessons
    jsonb_build_array(
      jsonb_build_object(
        'id', v_mod1_id,
        'title', 'Qué es este portal y cómo orientarte en 5 minutos',
        'duration', 6,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Bienvenido a farmapro. Este portal es vuestro espacio de formación y comunidad pensado para una sola cosa: ayudaros a gestionar y hacer crecer vuestra farmacia. No es teoría de manual ni marketing genérico; es formación práctica de negocio, gestión, liderazgo y atención, hecha por gente que conoce el sector y pensada para aplicarse en el mostrador.</p>'
          || '<h3>Qué vais a encontrar</h3>'
          || '<ul>'
          || '<li><strong>Cursos:</strong> el corazón del portal. Cortos, divididos en módulos, con un cuestionario al final para fijar lo aprendido. Organizados por categorías (ventas, marketing, gestión, liderazgo y atención al cliente) para que vayáis directos a lo que necesitáis.</li>'
          || '<li><strong>Retos:</strong> pequeños objetivos que os ayudan a coger el hábito de formaros sin agobios.</li>'
          || '<li><strong>Puntos y niveles:</strong> según avanzáis, sumáis puntos y subís de nivel. Es una forma amable de medir vuestro progreso y manteneros con ritmo.</li>'
          || '<li><strong>Comunidad:</strong> un foro para compartir dudas y soluciones con otros titulares y profesionales de farmacia.</li>'
          || '<li><strong>Recursos:</strong> plantillas, checklists, calculadoras y guías descargables, listas para usar.</li>'
          || '</ul>'
          || '<h3>Cómo aprovecharlo si vais cortos de tiempo</h3>'
          || '<p>Sabemos que el día de una farmacia no deja muchos huecos. La buena noticia: este portal está hecho para ratos pequeños. Un módulo se ve en diez o quince minutos, así que podéis avanzar un poco entre tareas, en una franja tranquila o al cerrar. No hace falta sentarse una tarde entera; hace falta constancia, aunque sea de quince minutos.</p>'
          || '<p>Una recomendación para empezar: terminad este curso de bienvenida (os quedan dos módulos cortos) y, justo después, elegid un curso de la categoría que más os interese ahora mismo. Si tenéis dudas, el de gestión del día a día es un buen primer paso para casi cualquier titular.</p>'
          || '<blockquote>No tenéis que verlo todo de golpe. Tenéis que empezar. Quince minutos bien aprovechados valen más que una tarde que nunca llega.</blockquote>'
      ),
      jsonb_build_object(
        'id', v_mod2_id,
        'title', 'Cómo funcionan los cursos, los cuestionarios, los retos y los puntos',
        'duration', 7,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>Aquí os explicamos la mecánica para que la primera vez no perdáis ni un minuto. Es muy sencilla.</p>'
          || '<h3>Los cursos, módulo a módulo</h3>'
          || '<p>Cada curso se divide en módulos cortos que se ven en orden. Al abrir un curso veréis la lista de módulos; al terminar uno, se desbloquea el siguiente. No hay prisa: podéis salir y retomarlo donde lo dejasteis, el portal recuerda por dónde ibais. Cada módulo indica su duración aproximada para que sepáis si os da tiempo antes de empezar.</p>'
          || '<h3>El cuestionario final</h3>'
          || '<p>Cada curso termina con un breve cuestionario de varias preguntas. No es un examen para suspender a nadie: sirve para fijar las ideas clave y para dar por completado el curso. Necesitáis acertar un mínimo (normalmente el 70 %) para superarlo; si no lo conseguís a la primera, podéis repasar el módulo y volver a intentarlo. Aprender, no aprobar, es el objetivo.</p>'
          || '<h3>Retos, puntos y niveles</h3>'
          || '<ul>'
          || '<li><strong>Retos:</strong> son objetivos breves (por ejemplo, completar un curso o superar un cuestionario) que os proponen una meta concreta para no perder el ritmo.</li>'
          || '<li><strong>Puntos:</strong> cada avance suma. Completar módulos, superar cuestionarios y participar os da puntos.</li>'
          || '<li><strong>Niveles y logros:</strong> al acumular puntos subís de nivel y desbloqueáis logros (insignias). El primero, "Primer Paso", lo conseguiréis al completar vuestro primer curso, que bien puede ser este.</li>'
          || '</ul>'
          || '<p>La gamificación no es un juego por el juego: está para ayudaros a convertir la formación en un hábito. Ver el progreso motiva, y el progreso constante es lo que de verdad mejora una farmacia.</p>'
          || '<blockquote>El primer logro está a un curso de distancia. Terminad este y ya habréis dado el "Primer Paso", literalmente.</blockquote>'
          || '<p><strong>Mini-ejercicio.</strong> Cuando acabéis este curso de bienvenida, fijaos en vuestro perfil: veréis los primeros puntos sumados y, si habéis completado el cuestionario, el curso marcado como terminado. Esa es la mecánica que repetiréis con cada curso.</p>'
      ),
      jsonb_build_object(
        'id', v_mod3_id,
        'title', 'La comunidad, los recursos y por dónde seguir',
        'duration', 7,
        'video_url', NULL,
        'downloadable_resources', '[]'::jsonb,
        'content',
          '<p>El portal no es solo cursos: es también un sitio donde no estáis solos. Dos espacios os van a resultar muy útiles desde el primer día.</p>'
          || '<h3>La comunidad: el valor de hablar con otros titulares</h3>'
          || '<p>El foro de la comunidad es para lo que los cursos no pueden daros: la experiencia de otros que están en lo mismo que vosotros. Cómo gestionan las reseñas negativas, qué hacen con el stock que no rota después del verano, cómo organizan los turnos en agosto. Participar es sencillo: entrad, leed lo que se cuece y, cuando os apetezca, abrid un hilo con vuestra duda o responded a la de otro. Cuanto más aportéis, más valor le sacaréis. Una comunidad se construye entre todos.</p>'
          || '<h3>Los recursos descargables</h3>'
          || '<p>En la sección de recursos encontraréis materiales listos para usar: plantillas de Excel (cuadrantes, calculadoras), checklists para el mostrador, guías en PDF y protocolos. Están pensados para que no tengáis que crearlos desde cero: los descargáis, los adaptáis a vuestra farmacia y al lío. Muchos acompañan a un curso o a un tema concreto, así que cuando uno os encaje, miradlo: probablemente haya una herramienta que os ahorra trabajo.</p>'
          || '<h3>Por dónde seguir ahora mismo</h3>'
          || '<p>Ya conocéis el terreno. Estos son los siguientes pasos recomendados, por orden:</p>'
          || '<ol>'
          || '<li><strong>Completad el cuestionario de este curso</strong> (lo tenéis justo después). Con eso conseguiréis vuestro primer logro y dejaréis el onboarding cerrado.</li>'
          || '<li><strong>Elegid vuestro primer curso "de verdad".</strong> Mirad las categorías y empezad por la que más os pique hoy. No hay orden obligatorio.</li>'
          || '<li><strong>Pasad por la comunidad y presentaos.</strong> Un saludo, de qué farmacia sois, qué os gustaría mejorar. Romper el hielo cuesta cinco minutos y abre muchas puertas.</li>'
          || '</ol>'
          || '<blockquote>Lo mejor que podéis hacer ahora es empezar. Terminad el cuestionario, elegid un curso y dad el primer paso de verdad. Vuestra farmacia lo notará.</blockquote>'
          || '<p>Gracias por estar aquí. En farmapro creemos que una farmacia bien gestionada es una farmacia más fuerte, y este portal existe para ayudaros a conseguirlo, paso a paso.</p>'
      )
    )
  );

  INSERT INTO public.course_modules (id, course_id, title, description, order_index) VALUES
    (r_mod1, v_course_id, 'Qué es este portal', 'Visión general y cómo orientarte en 5 minutos.', 1),
    (r_mod2, v_course_id, 'Cursos, cuestionarios, retos y puntos', 'La mecánica del portal y la gamificación.', 2),
    (r_mod3, v_course_id, 'Comunidad, recursos y por dónde seguir', 'Foro, descargables y próximos pasos.', 3);

  INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free) VALUES
    (r_mod1, 'Qué es este portal', 'Contenido completo en la versión JSONB del módulo 1.', 6, 1, true),
    (r_mod2, 'Cursos, cuestionarios, retos y puntos', 'Contenido completo en la versión JSONB del módulo 2.', 7, 1, true),
    (r_mod3, 'Comunidad, recursos y por dónde seguir', 'Contenido completo en la versión JSONB del módulo 3.', 7, 1, true);

  INSERT INTO public.course_quizzes (
    id, course_id, title, description,
    passing_score, time_limit_minutes,
    is_active, is_published, order_index
  ) VALUES (
    v_quiz_id, v_course_id,
    'Cuestionario: bienvenida a farmapro',
    'Un repaso rápido para confirmar que sabes moverte por el portal y aprovecharlo. Necesitas un 70 % para aprobar y conseguir tu primer logro.',
    70, NULL, true, true, 1
  );

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q1, v_quiz_id,
     '¿De qué trata principalmente la formación del portal de farmapro?',
     '¿De qué trata principalmente la formación del portal de farmapro?',
     'multiple_choice',
     '["Consejos clínicos y sobre medicamentos","Gestión, negocio, liderazgo y atención al cliente de la farmacia","Recetas de cocina saludable","Oposiciones a farmacéutico"]'::jsonb,
     1,
     'El portal se centra en habilidades de negocio y gestión de la farmacia (ventas, marketing, gestión, liderazgo y atención), no en contenido clínico.',
     0, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q1, 'Consejos clínicos y sobre medicamentos', false, 0),
    (q1, 'Gestión, negocio, liderazgo y atención al cliente de la farmacia', true, 1),
    (q1, 'Recetas de cocina saludable', false, 2),
    (q1, 'Oposiciones a farmacéutico', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q2, v_quiz_id,
     '¿Cómo están organizados los cursos?',
     '¿Cómo están organizados los cursos?',
     'multiple_choice',
     '["En un único vídeo largo de varias horas","En módulos cortos que se ven en orden, con un cuestionario final","En archivos PDF sueltos sin orden","Solo en directo, a una hora fija"]'::jsonb,
     1,
     'Cada curso se divide en módulos cortos que se ven en orden; al terminar, un breve cuestionario fija lo aprendido y da por completado el curso.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q2, 'En un único vídeo largo de varias horas', false, 0),
    (q2, 'En módulos cortos que se ven en orden, con un cuestionario final', true, 1),
    (q2, 'En archivos PDF sueltos sin orden', false, 2),
    (q2, 'Solo en directo, a una hora fija', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q3, v_quiz_id,
     'Si no superas un cuestionario a la primera, ¿qué puedes hacer?',
     'Si no superas un cuestionario a la primera, ¿qué puedes hacer?',
     'multiple_choice',
     '["Nada, el curso queda bloqueado para siempre","Repasar el módulo y volver a intentarlo: el objetivo es aprender, no aprobar","Pagar para desbloquearlo","Esperar un año para reintentarlo"]'::jsonb,
     1,
     'El cuestionario no está para suspender a nadie: si no se supera, se repasa el módulo y se vuelve a intentar. Aprender es el objetivo.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q3, 'Nada, el curso queda bloqueado para siempre', false, 0),
    (q3, 'Repasar el módulo y volver a intentarlo: el objetivo es aprender, no aprobar', true, 1),
    (q3, 'Pagar para desbloquearlo', false, 2),
    (q3, 'Esperar un año para reintentarlo', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q4, v_quiz_id,
     '¿Para qué sirven los puntos, los niveles y los logros del portal?',
     '¿Para qué sirven los puntos, los niveles y los logros del portal?',
     'multiple_choice',
     '["Para competir y eliminar a otros usuarios","Para ayudarte a coger el hábito de formarte y ver tu progreso","Para canjearlos por dinero","No tienen ninguna función"]'::jsonb,
     1,
     'La gamificación está para convertir la formación en hábito: medir el progreso de forma amable y mantener el ritmo, no para competir ni canjear.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q4, 'Para competir y eliminar a otros usuarios', false, 0),
    (q4, 'Para ayudarte a coger el hábito de formarte y ver tu progreso', true, 1),
    (q4, 'Para canjearlos por dinero', false, 2),
    (q4, 'No tienen ninguna función', false, 3);

  INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points) VALUES
    (q5, v_quiz_id,
     'Según el curso, ¿cuál es la mejor forma de empezar a sacar partido al portal?',
     'Según el curso, ¿cuál es la mejor forma de empezar a sacar partido al portal?',
     'multiple_choice',
     '["Intentar ver todos los cursos en una sola tarde","Completar este cuestionario, elegir un primer curso y presentarse en la comunidad","Esperar a tener mucho tiempo libre","Descargar todos los recursos sin más"]'::jsonb,
     1,
     'El portal está hecho para ratos pequeños: lo mejor es cerrar el onboarding, empezar un curso y pasar por la comunidad. Constancia, no maratones.',
     1, 10);
  INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
    (q5, 'Intentar ver todos los cursos en una sola tarde', false, 0),
    (q5, 'Completar este cuestionario, elegir un primer curso y presentarse en la comunidad', true, 1),
    (q5, 'Esperar a tener mucho tiempo libre', false, 2),
    (q5, 'Descargar todos los recursos sin más', false, 3);

  RAISE NOTICE 'Curso 5 creado: % (quiz: %)', v_course_id, v_quiz_id;

END $$;


-- =====================================================================
-- VERIFICACIÓN RÁPIDA (opcional, ejecutar tras los bloques anteriores)
-- =====================================================================
-- 1) Los cinco cursos publicados y con módulos:
-- SELECT slug, category, difficulty, is_published, is_premium,
--        jsonb_array_length(course_modules) AS n_modulos
--   FROM public.courses
--  WHERE slug IN (
--    'fp-gs-dia-a-dia-tiempo-turnos-prioridades',
--    'fp-gs-kpis-rentabilidad-numeros-farmacia',
--    'fp-ld-del-companero-al-referente',
--    'fp-ld-comunicacion-feedback-motivacion',
--    'fp-bv-bienvenido-a-farmapro-portal'
--  )
--  ORDER BY order_index;
--
-- 2) Un quiz activo y publicado por curso, con sus preguntas:
-- SELECT c.slug, cq.title, cq.is_active, cq.is_published, COUNT(qq.id) AS n_preguntas
--   FROM public.courses c
--   JOIN public.course_quizzes cq ON cq.course_id = c.id
--   LEFT JOIN public.quiz_questions qq ON qq.quiz_id = cq.id
--  WHERE c.slug LIKE 'fp-%'
--  GROUP BY c.slug, cq.id, cq.title, cq.is_active, cq.is_published
--  ORDER BY c.slug;
--
-- 3) Cada pregunta con exactamente una opción correcta:
-- SELECT c.slug, qq.order_index, qq.question,
--        COUNT(*) FILTER (WHERE qqo.is_correct) AS correctas
--   FROM public.courses c
--   JOIN public.course_quizzes cq ON cq.course_id = c.id
--   JOIN public.quiz_questions qq ON qq.quiz_id = cq.id
--   JOIN public.quiz_question_options qqo ON qqo.question_id = qq.id
--  WHERE c.slug LIKE 'fp-%'
--  GROUP BY c.slug, qq.id, qq.order_index, qq.question
--  ORDER BY c.slug, qq.order_index;
-- =====================================================================
