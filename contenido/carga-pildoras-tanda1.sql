-- =====================================================================
-- farmapro portal - CARGA DE LAS 8 PILDORAS DE LA REBOTICA (tanda 1)
-- =====================================================================
-- Que hace este script
--   Inserta las 8 pildoras formativas de la Rebotica (tanda 1) como CURSOS
--   del portal, seccion "Formacion". Cada pildora es un curso de UNA sola
--   leccion (1 modulo con el contenido completo: problema, metodo en 5 pasos,
--   "hazlo hoy" y referencia al descargable en Recursos) mas su quiz de 4
--   preguntas de opcion multiple. Reutiliza la infra existente (tarjetas por
--   categoria, gating premium por get_course_modules, quiz por las RPCs
--   get_active_quiz_questions / submit_quiz_answer). No crea tablas ni RPCs.
--   (Los textos INSERTADOS van en castellano correcto, con tildes y enes; solo
--    estos comentarios y los RAISE NOTICE van sin tildes, por comodidad.)
--
--   Fuente de contenido: farmapro-portal/contenido/pildora-01..08-*.md
--   (lista validada por Francesc el 09-07). Firma editorial: Laura Dominguez.
--
-- Reparto is_premium (decision de Francesc, 10-07-2026; ver contenido/README.md)
--   - Pildora 01 "Farmacia silenciosa" (onboarding): is_premium = FALSE.
--     Es la que activa el primer cajon de la Rebotica: un usuario del plan
--     Gratis debe poder completarla (leccion + quiz). Por eso NO es premium.
--   - Pildoras 02 a 08: is_premium = TRUE (contenido de pago).
--   - Las 8: is_published = TRUE.
--   (El gating real lo aplica la RPC public.get_course_modules segun el plan
--    del usuario; este script solo fija las banderas is_premium/is_published.
--    NO toca la logica de trial ni la de planes.)
--
-- IMPORTANTE sobre el "primer cajon" (onboarding recompensado)
--   Este script SOLO carga el curso + quiz de la pildora 01. La recompensa
--   "completar la pildora 01 = se abre el primer cajon" es un FLUJO aparte
--   (onboarding + rebotica_openings) que NO se cablea aqui. Queda como TODO
--   para la sesion que monte el onboarding (ver README, ultimo punto pendiente).
--
-- Esquema real usado (verificado en el repo, 10-07-2026)
--   public.courses(
--     id, title, slug [UNIQUE NOT NULL], description, category [enum
--     course_category], difficulty [text], duration_hours, duration_minutes,
--     instructor, is_published, is_premium, is_featured, order_index,
--     total_lessons, course_modules [jsonb]  <-- LO QUE LEE LA WEB, via RPC)
--     * featured_image_url / thumbnail_url: se dejan NULL a proposito. El
--       cliente pinta una PORTADA DE MARCA POR CATEGORIA como fallback
--       (CourseCard -> getCourseCover(category)). NO se inventan URLs de imagen.
--   JSONB course_modules = array de objetos con las claves EXACTAS que lee el
--     cliente (src/types/course.ts CourseModule):
--       { id (text, estable y unico), title, duration (minutos, NO
--         duration_minutes), video_url, downloadable_resources ([]), content
--         (HTML saneado con DOMPurify y pintado en .prose) }
--   Espejo relacional opcional (higiene de datos; la web del alumno NO lo lee):
--     public.course_modules(id, course_id, title, description, order_index)
--     public.course_lessons(module_id, title, content, duration_minutes,
--                           order_index, is_free)
--   Quiz:
--     public.course_quizzes(id, course_id, title, description, passing_score,
--       time_limit_minutes, is_active, is_published, order_index)
--       * is_active = TRUE es lo que hace que la web vea el quiz
--         (useCourseData: course_quizzes WHERE is_active = true).
--     public.quiz_questions(id, quiz_id, question, question_text,
--       question_type, options [jsonb], correct_answer [int 0-based],
--       explanation, order_index, points)
--     public.quiz_question_options(question_id, option_text, is_correct,
--       order_index [0-based])
--       * FUENTE DE VERDAD de la correccion: quiz_question_options.is_correct
--         (asi puntua submit_quiz_answer, y de aqui salen las opciones que ve
--          el alumno via get_active_quiz_questions). quiz_questions.options y
--          correct_answer se rellenan por compatibilidad con el panel admin.
--   Categorias: se usa la categoria propia de cada pildora, todas valores
--     reales del enum course_category (ventas, marketing, gestion, liderazgo,
--     atencion_cliente). NO existe categoria "Impulso" para cursos (solo para
--     resources), asi que cada pildora va en su categoria tematica.
--
-- IDEMPOTENCIA (relanzable sin duplicar)
--   Cada pildora va en su propio bloque DO. Antes de insertar comprueba
--   IF EXISTS (SELECT 1 FROM public.courses WHERE slug = '...'): si ya existe,
--   OMITE ese bloque entero (no duplica curso, ni modulos, ni quiz, ni
--   preguntas). El slug es UNIQUE NOT NULL y el trigger generate_course_slug()
--   respeta el slug explicito (solo lo autogenera si viene NULL/''), asi que la
--   guarda por slug es fiable. Se puede re-ejecutar el script tantas veces como
--   se quiera: solo carga las pildoras que falten.
--
--   Para FORZAR una recarga limpia (p. ej. tras editar los textos), descomenta
--   y ejecuta antes este DELETE (el ON DELETE CASCADE se lleva modulos,
--   lecciones, quizzes, preguntas y opciones):
--     -- DELETE FROM public.courses WHERE slug IN (
--     --   'fp-pildora-farmacia-silenciosa',
--     --   'fp-pildora-google-my-business',
--     --   'fp-pildora-stock-muerto',
--     --   'fp-pildora-categorias-responsables',
--     --   'fp-pildora-rentabilidad-categorias',
--     --   'fp-pildora-corner-dermocosmetica',
--     --   'fp-pildora-cliente-que-no-vuelve',
--     --   'fp-pildora-cinco-palancas'
--     -- );
--
-- COMO EJECUTARLO
--   Pegar este script entero en el editor SQL de Lovable / Supabase y ejecutar.
--   Las migraciones no se autoaplican: lo ejecuta Francesc a mano.
--
-- REGLAS DE CONTENIDO (heredadas, no negociables)
--   farmapro en minusculas. Castellano de Espana (vosotros). Sin emojis. Sin
--   raya larga. Cifras etiquetadas como "estimacion sectorial". Sin promesas
--   sanitarias (nota deontologica explicita en la pildora de dermocosmetica).
--
-- QUOTING
--   Bloque externo: DO $pil$ ... $pil$. Textos largos (HTML): $html$ ... $html$.
--   Resto de textos: $$ ... $$ (etiqueta vacia, distinta de $pil$ y $html$).
--   Los textos no llevan comilla simple, asi que no hay nada que escapar; en los
--   arrays JSON de quiz_questions.options las comillas dobles internas van con \".
--
-- TODO / pendiente de validar antes o despues de ejecutar
--   [ ] Validacion editorial de Laura Dominguez sobre los 8 textos (README).
--   [ ] Descargables en Recursos: hoy cada leccion referencia el descargable
--       por TEXTO (no hay URL real). Cuando esten subidos a Recursos, sustituir
--       la referencia textual y/o poblar downloadable_resources con {title,url,
--       type}. NO se inventan URLs (hubo un bug con URLs a imagenes inexistentes).
--   [ ] Cablear el flujo "pildora 01 completada -> primer cajon" (onboarding).
--   [ ] Revisar order_index (banda 101-108) e is_featured (false) si se quiere
--       destacar alguna en el catalogo.
-- =====================================================================


-- =====================================================================
-- PILDORA 01 - onboarding - categoria atencion_cliente - is_premium FALSE
-- N01 "La farmacia silenciosa". Completarla activa el primer cajon.
-- slug: fp-pildora-farmacia-silenciosa
-- =====================================================================
DO $pil$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();
  v_mod_id    text := 'fp-pildora-farmacia-silenciosa-l1';
  r_mod       uuid := gen_random_uuid();
  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.courses WHERE slug = 'fp-pildora-farmacia-silenciosa') THEN
    RAISE NOTICE 'Pildora 01 ya existe (fp-pildora-farmacia-silenciosa), se omite.';
  ELSE
    INSERT INTO public.courses (
      id, title, slug, description, category, difficulty,
      duration_hours, duration_minutes, instructor,
      is_published, is_premium, is_featured, order_index,
      total_lessons, course_modules
    ) VALUES (
      v_course_id,
      $$Detecta las 5 señales silenciosas que te están espantando clientes$$,
      'fp-pildora-farmacia-silenciosa',
      $$Píldora de bienvenida de la Rebotica. Aprende a detectar las cinco señales silenciosas que hacen que un cliente entre y se vaya sin comprar todo lo que necesitaba, y mide hoy mismo cuánto tarda tu equipo en dar el primer contacto. Completar esta lección y su quiz activa tu primer cajón.$$,
      'atencion_cliente',
      'principiante',
      0, 8, $$Laura Domínguez$$,
      true, false, false, 101,
      1,
      jsonb_build_array(
        jsonb_build_object(
          'id', v_mod_id,
          'title', $$Las 5 señales silenciosas y cómo medirlas$$,
          'duration', 8,
          'video_url', NULL,
          'downloadable_resources', '[]'::jsonb,
          'content', $html$
<blockquote><p>Píldora de onboarding: completar esta lección y su quiz desbloquea el primer cajón de la Rebotica.</p></blockquote>
<h3>El problema</h3>
<p>Muchos clientes que entran en tu farmacia se van sin comprar todo lo que necesitaban, y no es porque no quisierais atenderles: es porque ni tu equipo ni tú detectáis la señal a tiempo. Estimación sectorial: buena parte de las necesidades adicionales que expresa un cliente en el mostrador nunca llegan a convertirse en venta. La farmacia no pierde esas ventas por un fallo evidente, las pierde en silencio: un mostrador que actúa de barrera, un equipo que parece "ocupado", una señalización confusa.</p>
<h3>El método en 5 pasos</h3>
<ol>
<li><strong>El mostrador barrera.</strong> Revisa si tu mostrador invita a acercarse o si actúa como frontera física entre el equipo y el cliente. Los espacios abiertos facilitan la conversación.</li>
<li><strong>El personal "ocupado".</strong> Si tu equipo está siempre enfrascado en tareas administrativas cuando entra alguien, esa persona interpreta que molesta si pregunta. Cuida la primera imagen que se ve al entrar.</li>
<li><strong>El lenguaje corporal.</strong> Brazos cruzados, mirada fija en la pantalla, postura rígida: son mensajes de "no me molestes" que el equipo transmite sin querer.</li>
<li><strong>La señalización.</strong> Si el cliente tiene que preguntar dónde está cada cosa, muchos prefieren no preguntar y simplemente no comprar. Una señalización clara vende sola.</li>
<li><strong>Los tiempos muertos.</strong> Cada momento de espera pasiva mientras se busca un producto o se cobra es una oportunidad de conversación desperdiciada. Conviértelo en un momento de atención, no de silencio.</li>
</ol>
<h3>Hazlo hoy (10 minutos)</h3>
<p>Coge un papel y, durante la próxima hora de apertura, cronometra a los primeros 5 clientes que entren: cuánto tarda tu equipo en darles la primera señal de atención (contacto visual o saludo). El estándar de referencia es menos de 20 segundos para el primer contacto. Apunta los tiempos: es tu primer dato real de cómo suena, o calla, tu farmacia.</p>
<h3>Para seguir</h3>
<p>El descargable de esta píldora, el checklist "10 señales de alarma en la experiencia del cliente" (N01), está disponible en Recursos.</p>
$html$
        )
      )
    );

    INSERT INTO public.course_modules (id, course_id, title, description, order_index)
    VALUES (r_mod, v_course_id, $$Las 5 señales silenciosas y cómo medirlas$$, $$El contenido completo vive en la versión JSONB del módulo.$$, 1);

    INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free)
    VALUES (r_mod, $$Las 5 señales silenciosas y cómo medirlas$$, $$Contenido completo en la versión JSONB del módulo.$$, 8, 1, true);

    INSERT INTO public.course_quizzes (id, course_id, title, description, passing_score, time_limit_minutes, is_active, is_published, order_index)
    VALUES (v_quiz_id, v_course_id, $$Cuestionario: las 5 señales silenciosas$$, $$Comprueba que has captado las ideas clave de esta píldora. Necesitas un 70 % para superarla.$$, 70, NULL, true, true, 1);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q1, v_quiz_id,
      $$¿Cuál de estas NO es una de las 5 señales silenciosas descritas en esta píldora?$$,
      $$¿Cuál de estas NO es una de las 5 señales silenciosas descritas en esta píldora?$$,
      'multiple_choice',
      $$["El mostrador barrera","El exceso de personal contratado","La señalización ausente o confusa","Los tiempos muertos en la atención"]$$::jsonb,
      1,
      $$Las 5 señales son el mostrador barrera, el personal "ocupado", el lenguaje corporal defensivo, la señalización ausente y los tiempos muertos. El exceso de personal contratado no es una de ellas.$$,
      0, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q1, $$El mostrador barrera$$, false, 0),
      (q1, $$El exceso de personal contratado$$, true, 1),
      (q1, $$La señalización ausente o confusa$$, false, 2),
      (q1, $$Los tiempos muertos en la atención$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q2, v_quiz_id,
      $$Según el estándar de referencia de esta píldora, ¿en cuánto tiempo debería producirse el primer contacto visual o saludo a un cliente que entra?$$,
      $$Según el estándar de referencia de esta píldora, ¿en cuánto tiempo debería producirse el primer contacto visual o saludo a un cliente que entra?$$,
      'multiple_choice',
      $$["Menos de 20 segundos","Entre 2 y 3 minutos","No hay estándar, depende del cliente","Solo cuando el cliente lo pida"]$$::jsonb,
      0,
      $$El "cronómetro de la verdad" fija el estándar en menos de 20 segundos para el reconocimiento inicial.$$,
      1, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q2, $$Menos de 20 segundos$$, true, 0),
      (q2, $$Entre 2 y 3 minutos$$, false, 1),
      (q2, $$No hay estándar, depende del cliente$$, false, 2),
      (q2, $$Solo cuando el cliente lo pida$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q3, v_quiz_id,
      $$¿Qué transmite un equipo con los brazos cruzados y la mirada fija en el ordenador, aunque no diga nada?$$,
      $$¿Qué transmite un equipo con los brazos cruzados y la mirada fija en el ordenador, aunque no diga nada?$$,
      'multiple_choice',
      $$["Profesionalidad y concentración","Un mensaje no verbal de \"no me molestes\"","Que están esperando al cliente","Nada, el cliente no se fija en el lenguaje corporal"]$$::jsonb,
      1,
      $$Gran parte de la comunicación es no verbal. Una postura defensiva se percibe como una barrera aunque nadie diga una palabra.$$,
      2, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q3, $$Profesionalidad y concentración$$, false, 0),
      (q3, $$Un mensaje no verbal de "no me molestes"$$, true, 1),
      (q3, $$Que están esperando al cliente$$, false, 2),
      (q3, $$Nada, el cliente no se fija en el lenguaje corporal$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q4, v_quiz_id,
      $$¿Por qué los "tiempos muertos" (esperar mientras se busca un producto o se cobra) son una oportunidad?$$,
      $$¿Por qué los "tiempos muertos" (esperar mientras se busca un producto o se cobra) son una oportunidad?$$,
      'multiple_choice',
      $$["Porque el cliente aprovecha para irse","Porque es un momento en el que se puede mantener la conversación y detectar necesidades adicionales","Porque así se agiliza la caja","No son una oportunidad, hay que eliminarlos siempre"]$$::jsonb,
      1,
      $$Convertir la espera pasiva en un momento de atención, una pregunta, una recomendación, transforma un tiempo muerto en una oportunidad de venta cruzada.$$,
      3, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q4, $$Porque el cliente aprovecha para irse$$, false, 0),
      (q4, $$Porque es un momento en el que se puede mantener la conversación y detectar necesidades adicionales$$, true, 1),
      (q4, $$Porque así se agiliza la caja$$, false, 2),
      (q4, $$No son una oportunidad, hay que eliminarlos siempre$$, false, 3);

    RAISE NOTICE 'Pildora 01 cargada: curso % / quiz %', v_course_id, v_quiz_id;
  END IF;
END $pil$;


-- =====================================================================
-- PILDORA 02 - categoria marketing - is_premium TRUE
-- N06 Google My Business. slug: fp-pildora-google-my-business
-- =====================================================================
DO $pil$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();
  v_mod_id    text := 'fp-pildora-google-my-business-l1';
  r_mod       uuid := gen_random_uuid();
  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.courses WHERE slug = 'fp-pildora-google-my-business') THEN
    RAISE NOTICE 'Pildora 02 ya existe (fp-pildora-google-my-business), se omite.';
  ELSE
    INSERT INTO public.courses (
      id, title, slug, description, category, difficulty,
      duration_hours, duration_minutes, instructor,
      is_published, is_premium, is_featured, order_index,
      total_lessons, course_modules
    ) VALUES (
      v_course_id,
      $$Convierte tu ficha de Google en la puerta de entrada de tu farmacia$$,
      'fp-pildora-google-my-business',
      $$Tu ficha de Google Business Profile es, para mucha gente, la puerta de entrada a tu farmacia. Aprende a ponerla a punto en cinco pasos, del horario a las reseñas, para que quien busca farmacia cerca te elija a ti.$$,
      'marketing',
      'principiante',
      0, 8, $$Laura Domínguez$$,
      true, true, false, 102,
      1,
      jsonb_build_array(
        jsonb_build_object(
          'id', v_mod_id,
          'title', $$Tu ficha de Google, a punto en 5 pasos$$,
          'duration', 8,
          'video_url', NULL,
          'downloadable_resources', '[]'::jsonb,
          'content', $html$
<h3>El problema</h3>
<p>Cuando alguien busca "farmacia cerca" en Google, la decisión de qué farmacia visitar se toma en segundos, antes incluso de salir de casa. Estimación sectorial: la mayoría de estas búsquedas locales terminan en visita física a una de las farmacias que aparecen en los primeros resultados. Si tu ficha de Google Business Profile está incompleta, desactualizada o sin reseñas, esa decisión se la estás regalando a la farmacia de al lado.</p>
<h3>El método en 5 pasos</h3>
<ol>
<li>Verifica y actualiza lo básico: nombre exacto, dirección, teléfono directo y horarios completos, incluidos festivos y guardias. Una ficha desactualizada genera desconfianza y llamadas innecesarias preguntando si estás abierto.</li>
<li>Completa los atributos específicos de farmacia: servicios (formulación, asesoramiento), accesibilidad, métodos de pago, consultas online. Cuantos más atributos reales completes, más interacciones recibe tu ficha.</li>
<li>Activa un sistema sencillo para pedir reseñas a clientes satisfechos, por ejemplo un cartel o tarjeta con QR al perfil. La mayoría de farmacias tiene muy pocas reseñas, y eso es justo lo que compara el cliente antes de decidir.</li>
<li>Sube entre 5 y 8 fotos reales de tu farmacia: fachada, interior, equipo, servicios. Nada de imágenes genéricas de stock.</li>
<li>Publica un post semanal, una promoción, un servicio o un consejo de salud general sin prometer resultados clínicos. Es gratis y muy pocas farmacias lo hacen, así que destaca fácilmente.</li>
</ol>
<h3>Hazlo hoy (10 minutos)</h3>
<p>Entra en tu perfil de Google Business Profile (business.google.com) y revisa solo tres datos: horario actual (incluidos festivos próximos), teléfono directo y categoría principal. Corrige lo que esté mal. Es la acción con mejor relación esfuerzo-resultado de todo el marketing digital de una farmacia.</p>
<h3>Para seguir</h3>
<p>El descargable de esta píldora, el tutorial "Posicionamiento local paso a paso para farmacias" (N06), está disponible en Recursos.</p>
$html$
        )
      )
    );

    INSERT INTO public.course_modules (id, course_id, title, description, order_index)
    VALUES (r_mod, v_course_id, $$Tu ficha de Google, a punto en 5 pasos$$, $$El contenido completo vive en la versión JSONB del módulo.$$, 1);

    INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free)
    VALUES (r_mod, $$Tu ficha de Google, a punto en 5 pasos$$, $$Contenido completo en la versión JSONB del módulo.$$, 8, 1, false);

    INSERT INTO public.course_quizzes (id, course_id, title, description, passing_score, time_limit_minutes, is_active, is_published, order_index)
    VALUES (v_quiz_id, v_course_id, $$Cuestionario: tu ficha de Google Business Profile$$, $$Comprueba que has captado las ideas clave de esta píldora. Necesitas un 70 % para superarla.$$, 70, NULL, true, true, 1);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q1, v_quiz_id,
      $$¿Qué tres elementos básicos hay que revisar primero en la ficha de Google Business Profile?$$,
      $$¿Qué tres elementos básicos hay que revisar primero en la ficha de Google Business Profile?$$,
      'multiple_choice',
      $$["Horario, teléfono directo y categoría principal","Número de seguidores, logo y color corporativo","Precio de los productos y catálogo completo","Solo el nombre de la farmacia"]$$::jsonb,
      0,
      $$Son los datos que más rápido genera desconfianza si están mal, y los que más llamadas innecesarias provocan si fallan.$$,
      0, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q1, $$Horario, teléfono directo y categoría principal$$, true, 0),
      (q1, $$Número de seguidores, logo y color corporativo$$, false, 1),
      (q1, $$Precio de los productos y catálogo completo$$, false, 2),
      (q1, $$Solo el nombre de la farmacia$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q2, v_quiz_id,
      $$¿Por qué es importante subir fotos reales de la farmacia en lugar de imágenes genéricas?$$,
      $$¿Por qué es importante subir fotos reales de la farmacia en lugar de imágenes genéricas?$$,
      'multiple_choice',
      $$["Porque Google penaliza las fotos de stock","Porque transmiten confianza y familiaridad al cliente potencial","Porque es obligatorio por normativa","No influye en la decisión del cliente"]$$::jsonb,
      1,
      $$Las fotos reales ayudan al cliente a reconocer el espacio antes de entrar y refuerzan la confianza.$$,
      1, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q2, $$Porque Google penaliza las fotos de stock$$, false, 0),
      (q2, $$Porque transmiten confianza y familiaridad al cliente potencial$$, true, 1),
      (q2, $$Porque es obligatorio por normativa$$, false, 2),
      (q2, $$No influye en la decisión del cliente$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q3, v_quiz_id,
      $$¿Qué acción gratuita, y poco usada por las farmacias, aumenta la visibilidad de la ficha de forma regular?$$,
      $$¿Qué acción gratuita, y poco usada por las farmacias, aumenta la visibilidad de la ficha de forma regular?$$,
      'multiple_choice',
      $$["Cambiar el nombre de la farmacia cada mes","Publicar un post semanal con novedades, servicios o consejos","Responder solo a las reseñas negativas","Eliminar los atributos de accesibilidad"]$$::jsonb,
      1,
      $$La función de posts es gratuita y la usan muy pocas farmacias, así que es fácil destacar con poco esfuerzo.$$,
      2, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q3, $$Cambiar el nombre de la farmacia cada mes$$, false, 0),
      (q3, $$Publicar un post semanal con novedades, servicios o consejos$$, true, 1),
      (q3, $$Responder solo a las reseñas negativas$$, false, 2),
      (q3, $$Eliminar los atributos de accesibilidad$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q4, v_quiz_id,
      $$¿Cuál es, según esta píldora, la mejor forma de conseguir más reseñas de clientes satisfechos?$$,
      $$¿Cuál es, según esta píldora, la mejor forma de conseguir más reseñas de clientes satisfechos?$$,
      'multiple_choice',
      $$["Pedir solo a los clientes que se quejan","Comprar reseñas","Facilitar el proceso con un sistema sencillo, por ejemplo un QR directo al perfil","Esperar a que lleguen solas"]$$::jsonb,
      2,
      $$Reducir la fricción del proceso (un QR, un cartel) es lo que realmente multiplica el número de reseñas obtenidas.$$,
      3, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q4, $$Pedir solo a los clientes que se quejan$$, false, 0),
      (q4, $$Comprar reseñas$$, false, 1),
      (q4, $$Facilitar el proceso con un sistema sencillo, por ejemplo un QR directo al perfil$$, true, 2),
      (q4, $$Esperar a que lleguen solas$$, false, 3);

    RAISE NOTICE 'Pildora 02 cargada: curso % / quiz %', v_course_id, v_quiz_id;
  END IF;
END $pil$;


-- =====================================================================
-- PILDORA 03 - categoria gestion - is_premium TRUE
-- N05 Stock muerto. slug: fp-pildora-stock-muerto
-- =====================================================================
DO $pil$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();
  v_mod_id    text := 'fp-pildora-stock-muerto-l1';
  r_mod       uuid := gen_random_uuid();
  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.courses WHERE slug = 'fp-pildora-stock-muerto') THEN
    RAISE NOTICE 'Pildora 03 ya existe (fp-pildora-stock-muerto), se omite.';
  ELSE
    INSERT INTO public.courses (
      id, title, slug, description, category, difficulty,
      duration_hours, duration_minutes, instructor,
      is_published, is_premium, is_featured, order_index,
      total_lessons, course_modules
    ) VALUES (
      v_course_id,
      $$Clasifica tu stock y libera el capital que tienes dormido en el almacén$$,
      'fp-pildora-stock-muerto',
      $$Buena parte del capital de una farmacia duerme en stock de baja rotación. Aprende el método semáforo para clasificar tu inventario y liberar espacio y liquidez hacia las categorías que sí rotan.$$,
      'gestion',
      'principiante',
      0, 8, $$Laura Domínguez$$,
      true, true, false, 103,
      1,
      jsonb_build_array(
        jsonb_build_object(
          'id', v_mod_id,
          'title', $$El método semáforo para tu stock$$,
          'duration', 8,
          'video_url', NULL,
          'downloadable_resources', '[]'::jsonb,
          'content', $html$
<h3>El problema</h3>
<p>Estimación sectorial: buena parte del stock de una farmacia media está en situación de baja o nula rotación, inmovilizando capital sin generar ingresos. Esto no son solo productos caducados: es también espacio de mostrador ocupado, tiempo de gestión perdido y liquidez atrapada que podría destinarse a categorías con más rotación.</p>
<h3>El método en 5 pasos</h3>
<ol>
<li>Clasifica tu inventario en tres zonas: verde (alta rotación, el motor económico), amarilla (rotación media, revisión mensual) y roja (baja o nula rotación).</li>
<li>Dentro de la zona roja, distingue entre productos estratégicos que hay que mantener con stock mínimo, productos en declive que necesitan un plan de reactivación o salida, y productos que simplemente nunca funcionaron.</li>
<li>Fija un punto de pedido realista para cada zona: la verde nunca debe faltar, la roja no debe reponerse sin revisión previa.</li>
<li>Aplica un plan gradual: mes 1 diagnóstico y clasificación, meses 2-3 intervención en el "top 20" de cada zona, a partir del mes 4 revisión periódica ya convertida en rutina.</li>
<li>Libera el espacio ganado hacia categorías de alta rotación y margen, en lugar de dejarlo vacío.</li>
</ol>
<h3>Hazlo hoy (10 minutos)</h3>
<p>Abre tu programa de gestión y saca el listado de las 20 referencias sin ningún movimiento en los últimos 3 meses. No hace falta actuar todavía: solo tener la lista delante ya es el primer paso de la clasificación semáforo.</p>
<h3>Para seguir</h3>
<p>El descargable de esta píldora, el checklist de clasificación de inventario por rotación (N05), está disponible en Recursos.</p>
$html$
        )
      )
    );

    INSERT INTO public.course_modules (id, course_id, title, description, order_index)
    VALUES (r_mod, v_course_id, $$El método semáforo para tu stock$$, $$El contenido completo vive en la versión JSONB del módulo.$$, 1);

    INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free)
    VALUES (r_mod, $$El método semáforo para tu stock$$, $$Contenido completo en la versión JSONB del módulo.$$, 8, 1, false);

    INSERT INTO public.course_quizzes (id, course_id, title, description, passing_score, time_limit_minutes, is_active, is_published, order_index)
    VALUES (v_quiz_id, v_course_id, $$Cuestionario: clasificar el stock por rotación$$, $$Comprueba que has captado las ideas clave de esta píldora. Necesitas un 70 % para superarla.$$, 70, NULL, true, true, 1);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q1, v_quiz_id,
      $$En el método de clasificación semáforo, ¿qué representa la zona roja?$$,
      $$En el método de clasificación semáforo, ¿qué representa la zona roja?$$,
      'multiple_choice',
      $$["Los productos de alta rotación que nunca deben faltar","Los productos de baja o nula rotación","Los productos en oferta puntual","Los productos que solo se venden en verano"]$$::jsonb,
      1,
      $$La zona roja agrupa los productos de baja o nula rotación, donde se concentra el verdadero problema del stock muerto.$$,
      0, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q1, $$Los productos de alta rotación que nunca deben faltar$$, false, 0),
      (q1, $$Los productos de baja o nula rotación$$, true, 1),
      (q1, $$Los productos en oferta puntual$$, false, 2),
      (q1, $$Los productos que solo se venden en verano$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q2, v_quiz_id,
      $$Dentro de la zona roja, ¿qué tipo de producto NO debería eliminarse aunque tenga poca rotación?$$,
      $$Dentro de la zona roja, ¿qué tipo de producto NO debería eliminarse aunque tenga poca rotación?$$,
      'multiple_choice',
      $$["Los productos \"error\" que nunca funcionaron","Los productos estratégicos, necesarios aunque roten poco","Los productos en declive","Todos deben eliminarse por igual"]$$::jsonb,
      1,
      $$Los productos estratégicos se mantienen con stock mínimo porque son necesarios, aunque su rotación sea baja.$$,
      1, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q2, $$Los productos "error" que nunca funcionaron$$, false, 0),
      (q2, $$Los productos estratégicos, necesarios aunque roten poco$$, true, 1),
      (q2, $$Los productos en declive$$, false, 2),
      (q2, $$Todos deben eliminarse por igual$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q3, v_quiz_id,
      $$¿Cuál es el primer paso del plan de acción gradual para abordar el stock muerto?$$,
      $$¿Cuál es el primer paso del plan de acción gradual para abordar el stock muerto?$$,
      'multiple_choice',
      $$["Liquidar de golpe todo el stock de baja rotación","Diagnóstico y clasificación del inventario","Contratar más personal","Ampliar el local"]$$::jsonb,
      1,
      $$El mes 1 del plan se dedica siempre a diagnosticar y clasificar antes de tomar ninguna decisión de liquidación.$$,
      2, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q3, $$Liquidar de golpe todo el stock de baja rotación$$, false, 0),
      (q3, $$Diagnóstico y clasificación del inventario$$, true, 1),
      (q3, $$Contratar más personal$$, false, 2),
      (q3, $$Ampliar el local$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q4, v_quiz_id,
      $$¿Qué consigue una farmacia al liberar el capital y el espacio inmovilizado en stock de baja rotación?$$,
      $$¿Qué consigue una farmacia al liberar el capital y el espacio inmovilizado en stock de baja rotación?$$,
      'multiple_choice',
      $$["Nada, el espacio liberado se queda vacío","Puede destinarlo a categorías con más rotación y margen","Solo sirve para reducir el alquiler","Aumenta automáticamente las ventas sin hacer nada más"]$$::jsonb,
      1,
      $$El objetivo final del método es reinvertir ese capital y ese espacio en categorías que generan más rentabilidad.$$,
      3, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q4, $$Nada, el espacio liberado se queda vacío$$, false, 0),
      (q4, $$Puede destinarlo a categorías con más rotación y margen$$, true, 1),
      (q4, $$Solo sirve para reducir el alquiler$$, false, 2),
      (q4, $$Aumenta automáticamente las ventas sin hacer nada más$$, false, 3);

    RAISE NOTICE 'Pildora 03 cargada: curso % / quiz %', v_course_id, v_quiz_id;
  END IF;
END $pil$;


-- =====================================================================
-- PILDORA 04 - categoria liderazgo - is_premium TRUE
-- N04 Equipo y categorias responsables. slug: fp-pildora-categorias-responsables
-- =====================================================================
DO $pil$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();
  v_mod_id    text := 'fp-pildora-categorias-responsables-l1';
  r_mod       uuid := gen_random_uuid();
  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.courses WHERE slug = 'fp-pildora-categorias-responsables') THEN
    RAISE NOTICE 'Pildora 04 ya existe (fp-pildora-categorias-responsables), se omite.';
  ELSE
    INSERT INTO public.courses (
      id, title, slug, description, category, difficulty,
      duration_hours, duration_minutes, instructor,
      is_published, is_premium, is_featured, order_index,
      total_lessons, course_modules
    ) VALUES (
      v_course_id,
      $$Motiva a tu equipo con el sistema de categorías responsables$$,
      'fp-pildora-categorias-responsables',
      $$Un equipo desconectado vende menos sin decirlo. Aprende a identificar el perfil motivacional de cada persona y a delegar categorías con autoridad real para que tu equipo se implique de verdad.$$,
      'liderazgo',
      'principiante',
      0, 8, $$Laura Domínguez$$,
      true, true, false, 104,
      1,
      jsonb_build_array(
        jsonb_build_object(
          'id', v_mod_id,
          'title', $$Perfiles del equipo y categorías responsables$$,
          'duration', 8,
          'video_url', NULL,
          'downloadable_resources', '[]'::jsonb,
          'content', $html$
<h3>El problema</h3>
<p>Estimación sectorial: la gestión del personal es uno de los principales desafíos que señalan los titulares de farmacia, por delante incluso de la presión de márgenes. Un equipo desconectado no lo dice en voz alta: se traduce en comunicación estrictamente funcional, cero iniciativa y una frase que lo resume todo, "no es mi responsabilidad". Cada persona desmotivada se traduce en menos venta cruzada y peor experiencia de cliente.</p>
<h3>El método en 5 pasos</h3>
<ol>
<li>Identifica el perfil motivacional de cada miembro del equipo: el sanitario vocacional (busca propósito e impacto en el paciente), el desarrollador de categoría (quiere especializarse), el equilibrista familiar (valora estabilidad y conciliación), el impulsor de equipo (liderazgo natural) y el técnico especialista (busca excelencia técnica).</li>
<li>Asigna categorías responsables: entrega a cada persona una categoría completa (dermocosmética, nutrición, infantil) con autoridad real sobre pedidos, merchandising y formación interna, no solo la tarea de reponer estantería.</li>
<li>Fija KPIs claros por categoría (rotación, margen, número de clientes fidelizados) para que la responsabilidad se pueda medir y reconocer.</li>
<li>Combina incentivos inmediatos e individuales (feedback específico, flexibilidad puntual) con incentivos periódicos y colectivos (celebración de objetivos trimestrales, participación en decisiones).</li>
<li>Convierte el feedback en un sistema continuo, no en un evento puntual: reuniones individuales breves y periódicas funcionan mejor que una cena de equipo una vez al año.</li>
</ol>
<h3>Hazlo hoy (10 minutos)</h3>
<p>Escribe en un papel el nombre de cada persona de tu equipo y, al lado, qué perfil motivacional crees que encaja mejor con cada una (sanitario vocacional, desarrollador de categoría, equilibrista familiar, impulsor de equipo o técnico especialista). No hace falta acertar a la primera: es el punto de partida para personalizar cómo reconoces el trabajo de cada uno.</p>
<h3>Para seguir</h3>
<p>El descargable de esta píldora, el plan de incentivos personalizado para farmacias (N04), está disponible en Recursos.</p>
$html$
        )
      )
    );

    INSERT INTO public.course_modules (id, course_id, title, description, order_index)
    VALUES (r_mod, v_course_id, $$Perfiles del equipo y categorías responsables$$, $$El contenido completo vive en la versión JSONB del módulo.$$, 1);

    INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free)
    VALUES (r_mod, $$Perfiles del equipo y categorías responsables$$, $$Contenido completo en la versión JSONB del módulo.$$, 8, 1, false);

    INSERT INTO public.course_quizzes (id, course_id, title, description, passing_score, time_limit_minutes, is_active, is_published, order_index)
    VALUES (v_quiz_id, v_course_id, $$Cuestionario: motivar al equipo por categorías$$, $$Comprueba que has captado las ideas clave de esta píldora. Necesitas un 70 % para superarla.$$, 70, NULL, true, true, 1);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q1, v_quiz_id,
      $$¿Cuál de estas frases es una señal silenciosa de que un miembro del equipo está desconectado?$$,
      $$¿Cuál de estas frases es una señal silenciosa de que un miembro del equipo está desconectado?$$,
      'multiple_choice',
      $$["\"No es mi responsabilidad\"","\"He detectado una interacción con este paciente\"","\"Propongo cambiar el expositor de esta categoría\"","\"Voy a formarme en esto\""]$$::jsonb,
      0,
      $$Esta frase evidencia falta de compromiso con el proyecto común, frente a las otras opciones, que muestran iniciativa.$$,
      0, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q1, $$"No es mi responsabilidad"$$, true, 0),
      (q1, $$"He detectado una interacción con este paciente"$$, false, 1),
      (q1, $$"Propongo cambiar el expositor de esta categoría"$$, false, 2),
      (q1, $$"Voy a formarme en esto"$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q2, v_quiz_id,
      $$¿Qué caracteriza al perfil "desarrollador de categoría"?$$,
      $$¿Qué caracteriza al perfil "desarrollador de categoría"?$$,
      'multiple_choice',
      $$["Prioriza la conciliación y la estabilidad","Le interesa especializarse en un área concreta y tener autonomía sobre ella","Solo se motiva con incentivos económicos","Prefiere no asumir ninguna responsabilidad"]$$::jsonb,
      1,
      $$Este perfil se motiva con autonomía y desarrollo técnico dentro de una categoría concreta, no solo con dinero.$$,
      1, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q2, $$Prioriza la conciliación y la estabilidad$$, false, 0),
      (q2, $$Le interesa especializarse en un área concreta y tener autonomía sobre ella$$, true, 1),
      (q2, $$Solo se motiva con incentivos económicos$$, false, 2),
      (q2, $$Prefiere no asumir ninguna responsabilidad$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q3, v_quiz_id,
      $$En el sistema de categorías responsables, ¿qué es imprescindible entregar además de la responsabilidad?$$,
      $$En el sistema de categorías responsables, ¿qué es imprescindible entregar además de la responsabilidad?$$,
      'multiple_choice',
      $$["Un aumento de sueldo automático","Autoridad real para decidir sobre pedidos, merchandising y formación","Un despacho propio","Nada más, con la responsabilidad basta"]$$::jsonb,
      1,
      $$Delegar solo la tarea sin autoridad real para decidir no genera el mismo compromiso ni los mismos resultados.$$,
      2, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q3, $$Un aumento de sueldo automático$$, false, 0),
      (q3, $$Autoridad real para decidir sobre pedidos, merchandising y formación$$, true, 1),
      (q3, $$Un despacho propio$$, false, 2),
      (q3, $$Nada más, con la responsabilidad basta$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q4, v_quiz_id,
      $$Según esta píldora, ¿qué formato de feedback tiene más impacto en la motivación del equipo?$$,
      $$Según esta píldora, ¿qué formato de feedback tiene más impacto en la motivación del equipo?$$,
      'multiple_choice',
      $$["Una cena de equipo una vez al año","Un bono navideño puntual","Reuniones individuales breves y periódicas","No dar feedback para no generar presión"]$$::jsonb,
      2,
      $$El feedback estructurado y frecuente funciona mejor que los gestos puntuales, porque convierte el reconocimiento en un sistema continuo.$$,
      3, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q4, $$Una cena de equipo una vez al año$$, false, 0),
      (q4, $$Un bono navideño puntual$$, false, 1),
      (q4, $$Reuniones individuales breves y periódicas$$, true, 2),
      (q4, $$No dar feedback para no generar presión$$, false, 3);

    RAISE NOTICE 'Pildora 04 cargada: curso % / quiz %', v_course_id, v_quiz_id;
  END IF;
END $pil$;


-- =====================================================================
-- PILDORA 05 - categoria gestion - is_premium TRUE
-- N03 Rentabilidad por categorias. slug: fp-pildora-rentabilidad-categorias
-- =====================================================================
DO $pil$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();
  v_mod_id    text := 'fp-pildora-rentabilidad-categorias-l1';
  r_mod       uuid := gen_random_uuid();
  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.courses WHERE slug = 'fp-pildora-rentabilidad-categorias') THEN
    RAISE NOTICE 'Pildora 05 ya existe (fp-pildora-rentabilidad-categorias), se omite.';
  ELSE
    INSERT INTO public.courses (
      id, title, slug, description, category, difficulty,
      duration_hours, duration_minutes, instructor,
      is_published, is_premium, is_featured, order_index,
      total_lessons, course_modules
    ) VALUES (
      v_course_id,
      $$Reorganiza tu espacio por rentabilidad, no por costumbre$$,
      'fp-pildora-rentabilidad-categorias',
      $$El espacio de tu farmacia es una decisión financiera, no estética. Aprende a repartir cada metro según su rentabilidad con una matriz sencilla de estrella, vaca, interrogante y perro.$$,
      'gestion',
      'principiante',
      0, 8, $$Laura Domínguez$$,
      true, true, false, 105,
      1,
      jsonb_build_array(
        jsonb_build_object(
          'id', v_mod_id,
          'title', $$Reparte el espacio por rentabilidad$$,
          'duration', 8,
          'video_url', NULL,
          'downloadable_resources', '[]'::jsonb,
          'content', $html$
<h3>El problema</h3>
<p>Estimación sectorial: buena parte del espacio comercial de una farmacia está ocupado por categorías de bajo rendimiento, simplemente porque siempre ha estado ahí. El espacio de tu farmacia no es solo una cuestión estética: es una decisión financiera que casi nunca se revisa con datos.</p>
<h3>El método en 5 pasos</h3>
<ol>
<li>Calcula, aunque sea de forma aproximada, la venta y el margen por metro cuadrado de cada categoría de tu farmacia en los últimos 12 meses.</li>
<li>Clasifica cada categoría en la matriz de decisión: estrella (alta rentabilidad y alto potencial, dale más espacio), vaca (alta rentabilidad pero poco potencial de crecimiento, mantén su espacio), interrogante (bajo rendimiento actual pero potencial, pruébala en una ubicación estratégica) y perro (bajo rendimiento y bajo potencial, reduce su espacio).</li>
<li>Identifica tu "top 5" y tu "bottom 5" de categorías por rentabilidad. En una farmacia bien organizada, el top 5 debería ocupar bastante más espacio que el bottom 5.</li>
<li>Busca adyacencias con sentido comercial: coloca cerca categorías que se complementan de forma natural, por ejemplo protección solar cerca de productos para después del sol en primavera.</li>
<li>Implementa los cambios de forma progresiva, no de golpe, y mide el antes y el después con los mismos indicadores.</li>
</ol>
<h3>Hazlo hoy (10 minutos)</h3>
<p>Dibuja en un papel un plano muy simple de tu farmacia y marca con tres colores (verde, amarillo, rojo) qué zonas crees, a ojo, que generan más y menos rentabilidad por metro cuadrado. No necesitas datos exactos todavía: es el primer boceto del mapa de calor de rentabilidad.</p>
<h3>Para seguir</h3>
<p>El descargable de esta píldora, la guía "Distribución estratégica por categorías de alto margen" (N03), está disponible en Recursos.</p>
$html$
        )
      )
    );

    INSERT INTO public.course_modules (id, course_id, title, description, order_index)
    VALUES (r_mod, v_course_id, $$Reparte el espacio por rentabilidad$$, $$El contenido completo vive en la versión JSONB del módulo.$$, 1);

    INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free)
    VALUES (r_mod, $$Reparte el espacio por rentabilidad$$, $$Contenido completo en la versión JSONB del módulo.$$, 8, 1, false);

    INSERT INTO public.course_quizzes (id, course_id, title, description, passing_score, time_limit_minutes, is_active, is_published, order_index)
    VALUES (v_quiz_id, v_course_id, $$Cuestionario: espacio y rentabilidad por categorías$$, $$Comprueba que has captado las ideas clave de esta píldora. Necesitas un 70 % para superarla.$$, 70, NULL, true, true, 1);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q1, v_quiz_id,
      $$En la matriz de decisión de esta píldora, ¿qué tipo de categoría es "alta rentabilidad, bajo potencial de crecimiento"?$$,
      $$En la matriz de decisión de esta píldora, ¿qué tipo de categoría es "alta rentabilidad, bajo potencial de crecimiento"?$$,
      'multiple_choice',
      $$["Estrella","Vaca","Interrogante","Perro"]$$::jsonb,
      1,
      $$La categoría "vaca" ya rinde bien pero tiene poco recorrido de crecimiento, por lo que se mantiene su espacio sin ampliarlo.$$,
      0, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q1, $$Estrella$$, false, 0),
      (q1, $$Vaca$$, true, 1),
      (q1, $$Interrogante$$, false, 2),
      (q1, $$Perro$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q2, v_quiz_id,
      $$¿Qué se recomienda hacer con una categoría clasificada como "perro" (baja rentabilidad y bajo potencial)?$$,
      $$¿Qué se recomienda hacer con una categoría clasificada como "perro" (baja rentabilidad y bajo potencial)?$$,
      'multiple_choice',
      $$["Ampliar su espacio","Reducir su espacio de forma drástica o eliminarla","Ponerla en la mejor ubicación de la farmacia","No hacer nada"]$$::jsonb,
      1,
      $$Al no generar rentabilidad ni tener potencial de crecimiento, mantener espacio en esta categoría es el uso menos eficiente del local.$$,
      1, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q2, $$Ampliar su espacio$$, false, 0),
      (q2, $$Reducir su espacio de forma drástica o eliminarla$$, true, 1),
      (q2, $$Ponerla en la mejor ubicación de la farmacia$$, false, 2),
      (q2, $$No hacer nada$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q3, v_quiz_id,
      $$¿Qué relación de espacio se recomienda entre el "top 5" y el "bottom 5" de categorías en una farmacia optimizada?$$,
      $$¿Qué relación de espacio se recomienda entre el "top 5" y el "bottom 5" de categorías en una farmacia optimizada?$$,
      'multiple_choice',
      $$["El top 5 debería tener bastante más espacio que el bottom 5","Deben tener exactamente el mismo espacio","El bottom 5 debe tener más espacio que el top 5","No importa la distribución de espacio"]$$::jsonb,
      0,
      $$El espacio debe asignarse en proporción a la rentabilidad, no al volumen histórico de ventas ni a la costumbre.$$,
      2, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q3, $$El top 5 debería tener bastante más espacio que el bottom 5$$, true, 0),
      (q3, $$Deben tener exactamente el mismo espacio$$, false, 1),
      (q3, $$El bottom 5 debe tener más espacio que el top 5$$, false, 2),
      (q3, $$No importa la distribución de espacio$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q4, v_quiz_id,
      $$¿Por qué es útil analizar las "adyacencias" entre categorías?$$,
      $$¿Por qué es útil analizar las "adyacencias" entre categorías?$$,
      'multiple_choice',
      $$["Porque ayuda a la venta cruzada natural entre productos complementarios","Porque así se ahorra en decoración","Porque lo exige la normativa farmacéutica","No tiene ninguna utilidad comercial"]$$::jsonb,
      0,
      $$Colocar cerca categorías que se complementan facilita que el cliente descubra un producto relacionado sin tener que buscarlo.$$,
      3, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q4, $$Porque ayuda a la venta cruzada natural entre productos complementarios$$, true, 0),
      (q4, $$Porque así se ahorra en decoración$$, false, 1),
      (q4, $$Porque lo exige la normativa farmacéutica$$, false, 2),
      (q4, $$No tiene ninguna utilidad comercial$$, false, 3);

    RAISE NOTICE 'Pildora 05 cargada: curso % / quiz %', v_course_id, v_quiz_id;
  END IF;
END $pil$;


-- =====================================================================
-- PILDORA 06 - categoria ventas - is_premium TRUE
-- N17 Corner de dermocosmetica. slug: fp-pildora-corner-dermocosmetica
-- =====================================================================
DO $pil$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();
  v_mod_id    text := 'fp-pildora-corner-dermocosmetica-l1';
  r_mod       uuid := gen_random_uuid();
  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.courses WHERE slug = 'fp-pildora-corner-dermocosmetica') THEN
    RAISE NOTICE 'Pildora 06 ya existe (fp-pildora-corner-dermocosmetica), se omite.';
  ELSE
    INSERT INTO public.courses (
      id, title, slug, description, category, difficulty,
      duration_hours, duration_minutes, instructor,
      is_published, is_premium, is_featured, order_index,
      total_lessons, course_modules
    ) VALUES (
      v_course_id,
      $$Convierte tu rincón de dermocosmética en un corner que vende solo$$,
      'fp-pildora-corner-dermocosmetica',
      $$La dermocosmética es una de las categorías con más margen, pero rara vez se trabaja como merece. Aprende a montar un corner que vende por consejo, no por precio, dentro del marco deontológico.$$,
      'ventas',
      'principiante',
      0, 8, $$Laura Domínguez$$,
      true, true, false, 106,
      1,
      jsonb_build_array(
        jsonb_build_object(
          'id', v_mod_id,
          'title', $$Monta tu corner de dermocosmética$$,
          'duration', 8,
          'video_url', NULL,
          'downloadable_resources', '[]'::jsonb,
          'content', $html$
<h3>El problema</h3>
<p>La dermocosmética es una de las categorías con mayor margen de la farmacia, pero la mayoría la trata como un lineal más: pocas estanterías, poca formación del equipo y ninguna estrategia de exposición. El resultado es que se compite por precio con internet y grandes superficies, una batalla que la farmacia siempre pierde si no aporta algo más: consejo profesional.</p>
<h3>El método en 5 pasos</h3>
<ol>
<li>Diagnostica tu punto de partida: qué porcentaje de tu facturación de parafarmacia representa hoy la dermocosmética, cuántas marcas tienes y cuáles rotan de verdad.</li>
<li>Reduce el número de marcas y aumenta la profundidad: mejor 3-5 marcas bien trabajadas, con formación real del equipo, que 15 marcas con tres referencias cada una que nadie domina.</li>
<li>Organiza el espacio por necesidad del paciente (piel sensible, manchas, hidratación, acné) en lugar de por marca o laboratorio. Así el cliente encuentra su solución sin tener que preguntar.</li>
<li>Forma a tu equipo en un protocolo de consulta breve: escuchar la preocupación del paciente, observar el tipo de piel, recomendar una rutina completa (no un producto suelto) y programar un seguimiento.</li>
<li>Ofrece un servicio de diagnóstico de piel de 10-15 minutos, sin coste, siempre dentro del criterio profesional: se recomienda lo que el paciente necesita, no lo que tiene más margen.</li>
</ol>
<h3>Hazlo hoy (10 minutos)</h3>
<p>Coge el listado de tus marcas de dermocosmética y marca cuáles generan la mayor parte de tu facturación en la categoría. Esas son tus marcas clave. El resto son candidatas a sustituirse por más profundidad de las que ya funcionan.</p>
<h3>Para seguir</h3>
<p>El descargable de esta píldora, el plan "Transformación de zona tradicional a corner dermocosmético" con retorno estimado por fases (N17), está disponible en Recursos.</p>
<p><strong>Nota deontológica:</strong> la recomendación dermocosmética debe basarse siempre en la necesidad real del paciente, nunca prometer resultados clínicos concretos, y derivar al dermatólogo cuando la consulta exceda el ámbito de la farmacia.</p>
$html$
        )
      )
    );

    INSERT INTO public.course_modules (id, course_id, title, description, order_index)
    VALUES (r_mod, v_course_id, $$Monta tu corner de dermocosmética$$, $$El contenido completo vive en la versión JSONB del módulo.$$, 1);

    INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free)
    VALUES (r_mod, $$Monta tu corner de dermocosmética$$, $$Contenido completo en la versión JSONB del módulo.$$, 8, 1, false);

    INSERT INTO public.course_quizzes (id, course_id, title, description, passing_score, time_limit_minutes, is_active, is_published, order_index)
    VALUES (v_quiz_id, v_course_id, $$Cuestionario: el corner de dermocosmética$$, $$Comprueba que has captado las ideas clave de esta píldora. Necesitas un 70 % para superarla.$$, 70, NULL, true, true, 1);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q1, v_quiz_id,
      $$Según esta píldora, ¿qué genera más ventas en dermocosmética: tener muchas marcas o pocas marcas bien trabajadas?$$,
      $$Según esta píldora, ¿qué genera más ventas en dermocosmética: tener muchas marcas o pocas marcas bien trabajadas?$$,
      'multiple_choice',
      $$["Tener el mayor número posible de marcas","Tener pocas marcas, con más profundidad y equipo formado en ellas","Es indiferente, no influye en las ventas","Solo influye el precio de los productos"]$$::jsonb,
      1,
      $$El equipo puede dominar en profundidad 3-5 marcas, pero no 15, y esa seguridad al recomendar es lo que genera más ventas.$$,
      0, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q1, $$Tener el mayor número posible de marcas$$, false, 0),
      (q1, $$Tener pocas marcas, con más profundidad y equipo formado en ellas$$, true, 1),
      (q1, $$Es indiferente, no influye en las ventas$$, false, 2),
      (q1, $$Solo influye el precio de los productos$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q2, v_quiz_id,
      $$¿Cómo se recomienda organizar la exposición de productos dermocosméticos?$$,
      $$¿Cómo se recomienda organizar la exposición de productos dermocosméticos?$$,
      'multiple_choice',
      $$["Por orden alfabético de marca","Por necesidad del paciente (piel sensible, manchas, hidratación...)","Por precio, de más barato a más caro","Por fecha de caducidad únicamente"]$$::jsonb,
      1,
      $$Organizar por necesidad facilita que el paciente encuentre su solución y permite recomendaciones cruzadas entre marcas.$$,
      1, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q2, $$Por orden alfabético de marca$$, false, 0),
      (q2, $$Por necesidad del paciente (piel sensible, manchas, hidratación...)$$, true, 1),
      (q2, $$Por precio, de más barato a más caro$$, false, 2),
      (q2, $$Por fecha de caducidad únicamente$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q3, v_quiz_id,
      $$En el protocolo de consulta dermocosmética, ¿qué se recomienda hacer después de escuchar y observar la piel del paciente?$$,
      $$En el protocolo de consulta dermocosmética, ¿qué se recomienda hacer después de escuchar y observar la piel del paciente?$$,
      'multiple_choice',
      $$["Vender el producto más caro disponible","Recomendar una rutina completa adecuada a su caso, no un producto suelto","Decirle que compre por internet","No recomendar nada hasta la próxima visita"]$$::jsonb,
      1,
      $$Presentar una rutina completa, con su porqué, genera más confianza y mejor conversión que ofrecer un producto aislado.$$,
      2, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q3, $$Vender el producto más caro disponible$$, false, 0),
      (q3, $$Recomendar una rutina completa adecuada a su caso, no un producto suelto$$, true, 1),
      (q3, $$Decirle que compre por internet$$, false, 2),
      (q3, $$No recomendar nada hasta la próxima visita$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q4, v_quiz_id,
      $$¿Qué límite deontológico debe respetar siempre la consulta dermocosmética en la farmacia?$$,
      $$¿Qué límite deontológico debe respetar siempre la consulta dermocosmética en la farmacia?$$,
      'multiple_choice',
      $$["Prometer que el producto eliminará las manchas o arrugas","Basar la recomendación en la necesidad real del paciente y derivar al dermatólogo cuando corresponda","Vender siempre el producto de mayor margen","No hay ningún límite, es una venta como cualquier otra"]$$::jsonb,
      1,
      $$La honestidad profesional y la derivación cuando procede son las que sostienen la confianza que justifica el precio premium de la categoría.$$,
      3, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q4, $$Prometer que el producto eliminará las manchas o arrugas$$, false, 0),
      (q4, $$Basar la recomendación en la necesidad real del paciente y derivar al dermatólogo cuando corresponda$$, true, 1),
      (q4, $$Vender siempre el producto de mayor margen$$, false, 2),
      (q4, $$No hay ningún límite, es una venta como cualquier otra$$, false, 3);

    RAISE NOTICE 'Pildora 06 cargada: curso % / quiz %', v_course_id, v_quiz_id;
  END IF;
END $pil$;


-- =====================================================================
-- PILDORA 07 - categoria atencion_cliente - is_premium TRUE
-- N08 El cliente que no vuelve. slug: fp-pildora-cliente-que-no-vuelve
-- =====================================================================
DO $pil$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();
  v_mod_id    text := 'fp-pildora-cliente-que-no-vuelve-l1';
  r_mod       uuid := gen_random_uuid();
  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.courses WHERE slug = 'fp-pildora-cliente-que-no-vuelve') THEN
    RAISE NOTICE 'Pildora 07 ya existe (fp-pildora-cliente-que-no-vuelve), se omite.';
  ELSE
    INSERT INTO public.courses (
      id, title, slug, description, category, difficulty,
      duration_hours, duration_minutes, instructor,
      is_published, is_premium, is_featured, order_index,
      total_lessons, course_modules
    ) VALUES (
      v_course_id,
      $$Detecta a tiempo al cliente que está a punto de dejarte$$,
      'fp-pildora-cliente-que-no-vuelve',
      $$La mayoría de clientes que abandonan una farmacia no se quejan: dejan de venir. Aprende a leer las señales silenciosas de fuga y a clasificar a tus clientes en un semáforo de riesgo para actuar a tiempo.$$,
      'atencion_cliente',
      'principiante',
      0, 8, $$Laura Domínguez$$,
      true, true, false, 107,
      1,
      jsonb_build_array(
        jsonb_build_object(
          'id', v_mod_id,
          'title', $$Detecta la fuga silenciosa de clientes$$,
          'duration', 8,
          'video_url', NULL,
          'downloadable_resources', '[]'::jsonb,
          'content', $html$
<h3>El problema</h3>
<p>Estimación sectorial: la mayoría de clientes que abandonan una farmacia no se quejan antes de irse, simplemente dejan de venir. Casi nunca es un incidente grave: es una acumulación de pequeñas decepciones que nunca llegan a ser una queja formal. Y recuperar a un cliente perdido cuesta bastante más que fidelizar a uno que ya confía en la farmacia.</p>
<h3>El método en 5 pasos</h3>
<ol>
<li>Detecta las señales silenciosas: menos frecuencia de visita, menos categorías de compra (solo lo imprescindible), menos conversación en el mostrador, dejar de usar la tarjeta de fidelización o preguntar si un producto se puede conseguir en otro sitio.</li>
<li>Clasifica a tus clientes habituales en un semáforo de riesgo: verde (relación estable), amarillo (algún cambio de patrón), rojo (señales claras de distanciamiento).</li>
<li>Presta especial atención a los momentos críticos: la primera vez que un cliente acude con una necesidad importante, cualquier situación de desabastecimiento y los cambios en tu farmacia (reformas, personal nuevo, horarios).</li>
<li>Ante una señal de alerta, actúa con un diálogo de recuperación sencillo y sin incomodar: preguntar cómo le fue con un tratamiento anterior, ofrecer algo de valor ajustado a su situación actual.</li>
<li>Convierte la prevención en cultura de equipo: un canal fácil para que el cliente exprese una sugerencia menor evita que esa insatisfacción se acumule en silencio.</li>
</ol>
<h3>Hazlo hoy (10 minutos)</h3>
<p>Piensa en tus 10 clientes más habituales y marca junto a cada nombre un color: verde si su relación con la farmacia sigue igual de activa, amarillo si notas algún cambio (menos visitas, menos conversación), rojo si hace tiempo que no lo ves. Es tu primera auditoría de "clientes semáforo".</p>
<h3>Para seguir</h3>
<p>El descargable de esta píldora, el sistema de alerta temprana para detectar clientes en riesgo (N08), está disponible en Recursos.</p>
$html$
        )
      )
    );

    INSERT INTO public.course_modules (id, course_id, title, description, order_index)
    VALUES (r_mod, v_course_id, $$Detecta la fuga silenciosa de clientes$$, $$El contenido completo vive en la versión JSONB del módulo.$$, 1);

    INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free)
    VALUES (r_mod, $$Detecta la fuga silenciosa de clientes$$, $$Contenido completo en la versión JSONB del módulo.$$, 8, 1, false);

    INSERT INTO public.course_quizzes (id, course_id, title, description, passing_score, time_limit_minutes, is_active, is_published, order_index)
    VALUES (v_quiz_id, v_course_id, $$Cuestionario: detectar al cliente en fuga$$, $$Comprueba que has captado las ideas clave de esta píldora. Necesitas un 70 % para superarla.$$, 70, NULL, true, true, 1);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q1, v_quiz_id,
      $$Según esta píldora, ¿cuál es el motivo más habitual por el que un cliente abandona una farmacia?$$,
      $$Según esta píldora, ¿cuál es el motivo más habitual por el que un cliente abandona una farmacia?$$,
      'multiple_choice',
      $$["Un incidente grave y puntual","Una acumulación de pequeñas decepciones que nunca se comunican","Siempre el precio","Un cambio de domicilio"]$$::jsonb,
      1,
      $$La mayoría de abandonos no responde a un fallo grave único, sino a varias experiencias mediocres acumuladas que nunca llegan a ser una queja.$$,
      0, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q1, $$Un incidente grave y puntual$$, false, 0),
      (q1, $$Una acumulación de pequeñas decepciones que nunca se comunican$$, true, 1),
      (q1, $$Siempre el precio$$, false, 2),
      (q1, $$Un cambio de domicilio$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q2, v_quiz_id,
      $$¿Cuál de estas es una señal silenciosa de que un cliente habitual se está distanciando?$$,
      $$¿Cuál de estas es una señal silenciosa de que un cliente habitual se está distanciando?$$,
      'multiple_choice',
      $$["Sigue comprando exactamente las mismas categorías que antes","Reduce su compra a solo lo imprescindible y habla menos en el mostrador","Pide más consejo que nunca","Se apunta al programa de fidelización"]$$::jsonb,
      1,
      $$La reducción del espectro de compra y de la interacción son dos de los indicadores más claros de desenganche progresivo.$$,
      1, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q2, $$Sigue comprando exactamente las mismas categorías que antes$$, false, 0),
      (q2, $$Reduce su compra a solo lo imprescindible y habla menos en el mostrador$$, true, 1),
      (q2, $$Pide más consejo que nunca$$, false, 2),
      (q2, $$Se apunta al programa de fidelización$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q3, v_quiz_id,
      $$¿Qué clasificación se propone para priorizar la atención a los clientes habituales?$$,
      $$¿Qué clasificación se propone para priorizar la atención a los clientes habituales?$$,
      'multiple_choice',
      $$["Alfabética por apellido","Por importe de la última compra únicamente","Un semáforo de riesgo: verde, amarillo, rojo","No se propone ninguna clasificación"]$$::jsonb,
      2,
      $$El semáforo de riesgo permite priorizar la atención sobre los clientes en amarillo y rojo antes de que se conviertan en una baja definitiva.$$,
      2, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q3, $$Alfabética por apellido$$, false, 0),
      (q3, $$Por importe de la última compra únicamente$$, false, 1),
      (q3, $$Un semáforo de riesgo: verde, amarillo, rojo$$, true, 2),
      (q3, $$No se propone ninguna clasificación$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q4, v_quiz_id,
      $$¿Cuál de estos es un "momento crítico" en el que aumenta el riesgo de perder a un cliente?$$,
      $$¿Cuál de estos es un "momento crítico" en el que aumenta el riesgo de perder a un cliente?$$,
      'multiple_choice',
      $$["Una situación de desabastecimiento mal gestionada","Un día de lluvia","Que el cliente compre más de lo habitual","Que el cliente deje una reseña positiva"]$$::jsonb,
      0,
      $$No es la falta del producto en sí lo que hace perder al cliente, sino cómo se gestiona esa situación de desabastecimiento.$$,
      3, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q4, $$Una situación de desabastecimiento mal gestionada$$, true, 0),
      (q4, $$Un día de lluvia$$, false, 1),
      (q4, $$Que el cliente compre más de lo habitual$$, false, 2),
      (q4, $$Que el cliente deje una reseña positiva$$, false, 3);

    RAISE NOTICE 'Pildora 07 cargada: curso % / quiz %', v_course_id, v_quiz_id;
  END IF;
END $pil$;


-- =====================================================================
-- PILDORA 08 - categoria gestion - is_premium TRUE
-- N21 Las 5 palancas (cierre de tanda). slug: fp-pildora-cinco-palancas
-- =====================================================================
DO $pil$
DECLARE
  v_course_id uuid := gen_random_uuid();
  v_quiz_id   uuid := gen_random_uuid();
  v_mod_id    text := 'fp-pildora-cinco-palancas-l1';
  r_mod       uuid := gen_random_uuid();
  q1 uuid := gen_random_uuid();
  q2 uuid := gen_random_uuid();
  q3 uuid := gen_random_uuid();
  q4 uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.courses WHERE slug = 'fp-pildora-cinco-palancas') THEN
    RAISE NOTICE 'Pildora 08 ya existe (fp-pildora-cinco-palancas), se omite.';
  ELSE
    INSERT INTO public.courses (
      id, title, slug, description, category, difficulty,
      duration_hours, duration_minutes, instructor,
      is_published, is_premium, is_featured, order_index,
      total_lessons, course_modules
    ) VALUES (
      v_course_id,
      $$Identifica tu momento y activa la palanca que te toca este trimestre$$,
      'fp-pildora-cinco-palancas',
      $$No todas las farmacias que trabajan mucho crecen. Aprende cuáles son las cinco palancas de la rentabilidad y por qué conviene activar solo una por trimestre, con disciplina, en lugar de las cinco a la vez.$$,
      'gestion',
      'principiante',
      0, 8, $$Laura Domínguez$$,
      true, true, false, 108,
      1,
      jsonb_build_array(
        jsonb_build_object(
          'id', v_mod_id,
          'title', $$Las 5 palancas y cómo priorizarlas$$,
          'duration', 8,
          'video_url', NULL,
          'downloadable_resources', '[]'::jsonb,
          'content', $html$
<h3>El problema</h3>
<p>No todas las farmacias que trabajan mucho crecen. Hay farmacias estancadas (facturan lo mismo año tras año), farmacias que crecen a trompicones (aciertan algunos meses y otros no) y farmacias maduras (crecen poco pero de forma sostenida). La diferencia no es el tamaño ni la ubicación: es que las maduras mueven las mismas cinco palancas, una detrás de otra, con disciplina.</p>
<h3>El método en 5 pasos (las 5 palancas)</h3>
<ol>
<li><strong>Visibilidad</strong>: que te encuentren antes de necesitarte. Si estás estancada, empieza por tu ficha de Google (píldora N06). Si creces, mantén un canal social bien hecho. Si eres madura, construye autoridad local con contenido propio.</li>
<li><strong>Conversión</strong>: que cada visita termine en la mejor decisión para esa persona. Empieza trabajando una sola categoría en profundidad, como la dermocosmética (píldora N17), antes de sistematizar la recomendación cruzada.</li>
<li><strong>Captación</strong>: atraer al cliente que aún no te conoce. La forma más barata es pedir reseñas a los clientes satisfechos; más adelante, la captación digital y las alianzas con otros profesionales de la salud.</li>
<li><strong>Diversificación</strong>: convertir la farmacia en un centro de servicios, no solo de dispensación. Empieza por un único servicio sencillo, por ejemplo una cabina de medición con seguimiento, antes de ampliar la cartera.</li>
<li><strong>Sistematización</strong>: convertir el crecimiento en un proceso planificado. Empieza planificando con antelación tus campañas estacionales grandes del año, antes de pasar a un calendario completo con medición.</li>
</ol>
<p>La regla que lo sostiene todo: una palanca activa por trimestre, no las cinco a la vez. Cuatro transformaciones reales al año valen más que cinco intentos simultáneos que se quedan a medias.</p>
<h3>Hazlo hoy (10 minutos)</h3>
<p>Responde con sinceridad a estas cinco preguntas: ¿sabes cuánto facturaste el mismo mes del año pasado sin mirar el ordenador? ¿tienes una campaña planificada con más de 60 días de antelación? ¿tu farmacia funcionaría igual dos semanas sin ti? ¿conoces el ticket medio de cada categoría? ¿has captado algún cliente nuevo en los últimos meses? Cuenta cuántos "no" tienes: es tu punto de partida para elegir la primera palanca.</p>
<h3>Para seguir</h3>
<p>El descargable de esta píldora, "Diagnóstico de las 5 palancas + plan de acción según tu momento" (N21), está disponible en Recursos.</p>
$html$
        )
      )
    );

    INSERT INTO public.course_modules (id, course_id, title, description, order_index)
    VALUES (r_mod, v_course_id, $$Las 5 palancas y cómo priorizarlas$$, $$El contenido completo vive en la versión JSONB del módulo.$$, 1);

    INSERT INTO public.course_lessons (module_id, title, content, duration_minutes, order_index, is_free)
    VALUES (r_mod, $$Las 5 palancas y cómo priorizarlas$$, $$Contenido completo en la versión JSONB del módulo.$$, 8, 1, false);

    INSERT INTO public.course_quizzes (id, course_id, title, description, passing_score, time_limit_minutes, is_active, is_published, order_index)
    VALUES (v_quiz_id, v_course_id, $$Cuestionario: las 5 palancas de la rentabilidad$$, $$Comprueba que has captado las ideas clave de esta píldora. Necesitas un 70 % para superarla.$$, 70, NULL, true, true, 1);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q1, v_quiz_id,
      $$Según esta píldora, ¿qué diferencia principalmente a una farmacia estancada de una farmacia madura?$$,
      $$Según esta píldora, ¿qué diferencia principalmente a una farmacia estancada de una farmacia madura?$$,
      'multiple_choice',
      $$["El tamaño del local","La ubicación geográfica","Que la madura mueve las cinco palancas con disciplina y de forma secuencial","El número de empleados"]$$::jsonb,
      2,
      $$Ni el tamaño ni la ubicación explican la diferencia; el factor decisivo es la disciplina en activar las palancas una a una.$$,
      0, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q1, $$El tamaño del local$$, false, 0),
      (q1, $$La ubicación geográfica$$, false, 1),
      (q1, $$Que la madura mueve las cinco palancas con disciplina y de forma secuencial$$, true, 2),
      (q1, $$El número de empleados$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q2, v_quiz_id,
      $$¿Cuántas palancas se recomienda activar a la vez, según el método de esta píldora?$$,
      $$¿Cuántas palancas se recomienda activar a la vez, según el método de esta píldora?$$,
      'multiple_choice',
      $$["Las cinco a la vez, cuanto antes mejor","Ninguna, hay que esperar al momento perfecto","Una palanca activa por trimestre","Dos palancas por semana"]$$::jsonb,
      2,
      $$Activar una sola palanca por trimestre permite llevarla hasta el resultado, en lugar de dispersar el esfuerzo entre varias a la vez.$$,
      1, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q2, $$Las cinco a la vez, cuanto antes mejor$$, false, 0),
      (q2, $$Ninguna, hay que esperar al momento perfecto$$, false, 1),
      (q2, $$Una palanca activa por trimestre$$, true, 2),
      (q2, $$Dos palancas por semana$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q3, v_quiz_id,
      $$¿Cuál de estas es la palanca de "captación" más barata para empezar, según esta píldora?$$,
      $$¿Cuál de estas es la palanca de "captación" más barata para empezar, según esta píldora?$$,
      'multiple_choice',
      $$["Contratar publicidad en televisión","Pedir reseñas a los clientes satisfechos","Abrir una segunda farmacia","Bajar los precios de forma generalizada"]$$::jsonb,
      1,
      $$Pedir reseñas tiene coste prácticamente cero y es el punto de partida recomendado antes de pasar a captación digital o alianzas.$$,
      2, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q3, $$Contratar publicidad en televisión$$, false, 0),
      (q3, $$Pedir reseñas a los clientes satisfechos$$, true, 1),
      (q3, $$Abrir una segunda farmacia$$, false, 2),
      (q3, $$Bajar los precios de forma generalizada$$, false, 3);

    INSERT INTO public.quiz_questions (id, quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
    VALUES (q4, v_quiz_id,
      $$Si una farmacia intenta activar las cinco palancas a la vez, ¿qué suele ocurrir según esta píldora?$$,
      $$Si una farmacia intenta activar las cinco palancas a la vez, ¿qué suele ocurrir según esta píldora?$$,
      'multiple_choice',
      $$["Los resultados llegan el doble de rápido","El equipo se agota y ninguna palanca avanza lo suficiente para dar resultado","No hay ningún riesgo, es la estrategia recomendada","Solo funciona en farmacias grandes"]$$::jsonb,
      1,
      $$Intentarlo todo a la vez suele traducirse en frustración y cero resultados medibles, frente al enfoque secuencial de una palanca por trimestre.$$,
      3, 10);
    INSERT INTO public.quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
      (q4, $$Los resultados llegan el doble de rápido$$, false, 0),
      (q4, $$El equipo se agota y ninguna palanca avanza lo suficiente para dar resultado$$, true, 1),
      (q4, $$No hay ningún riesgo, es la estrategia recomendada$$, false, 2),
      (q4, $$Solo funciona en farmacias grandes$$, false, 3);

    RAISE NOTICE 'Pildora 08 cargada: curso % / quiz %', v_course_id, v_quiz_id;
  END IF;
END $pil$;


-- =====================================================================
-- VERIFICACION RAPIDA (opcional; descomentar y ejecutar tras la carga)
-- =====================================================================
-- 1) Las 8 pildoras, con su reparto premium y numero de modulos (debe ser 1):
-- SELECT order_index, slug, category, is_published, is_premium,
--        jsonb_array_length(course_modules) AS n_modulos, total_lessons
--   FROM public.courses
--  WHERE slug LIKE 'fp-pildora-%'
--  ORDER BY order_index;
--
-- 2) Que cada pildora tenga su quiz activo con 4 preguntas:
-- SELECT c.slug, cq.title, cq.is_active, cq.is_published,
--        COUNT(qq.id) AS n_preguntas
--   FROM public.courses c
--   JOIN public.course_quizzes cq ON cq.course_id = c.id
--   LEFT JOIN public.quiz_questions qq ON qq.quiz_id = cq.id
--  WHERE c.slug LIKE 'fp-pildora-%'
--  GROUP BY c.slug, cq.title, cq.is_active, cq.is_published
--  ORDER BY c.slug;
--
-- 3) Que cada pregunta tenga EXACTAMENTE una opcion correcta (n_correctas = 1):
-- SELECT c.slug, qq.order_index, qq.question,
--        COUNT(*) FILTER (WHERE qqo.is_correct) AS n_correctas,
--        COUNT(*) AS n_opciones
--   FROM public.courses c
--   JOIN public.course_quizzes cq ON cq.course_id = c.id
--   JOIN public.quiz_questions qq ON qq.quiz_id = cq.id
--   JOIN public.quiz_question_options qqo ON qqo.question_id = qq.id
--  WHERE c.slug LIKE 'fp-pildora-%'
--  GROUP BY c.slug, qq.id, qq.order_index, qq.question
--  ORDER BY c.slug, qq.order_index;
-- =====================================================================
