-- ---------------------------------------------------------------------
-- FIX CONTENIDO QUIZ (13-07-2026). Tres defectos de datos detectados al
-- verificar el aviso de Francesc "todas las correctas eran la 2ª opción":
--
-- 1) SESGO: en la serie nueva ("Cuestionario:", 18 píldoras cargadas por
--    SQL) 81 de 97 correctas (84%) están en la 2ª posición. La serie
--    antigua ("Evaluación:") está equilibrada y NO se toca.
-- 2) order_index de preguntas duplicado en 5 cuestionarios (orden
--    indeterminado al renderizar).
-- 3) Los 6 cursos premium legacy de marzo tienen su quiz "Test:"
--    DUPLICADO ENTERO (2 quizzes activos idénticos por curso, creados
--    23-03 y 24-03) -> el maybeSingle() del frontend da error y el curso
--    muestra "No hay evaluación disponible". Además sus preguntas están
--    en formato legacy (options jsonb + correct_answer entero 0-based)
--    con la tabla quiz_question_options VACÍA. 0 intentos registrados
--    en los 12: no hay datos de usuarios que proteger.
--
-- Comprobado antes: no existe ninguna opción tipo "todas las anteriores"
-- (barajar es seguro) y las respuestas guardadas referencian option_id,
-- no posición (barajar no altera intentos pasados).
-- ---------------------------------------------------------------------

-- A1) Desactivar la copia duplicada de cada Test (la del 24-03)
UPDATE public.course_quizzes
SET is_active = false
WHERE title LIKE 'Test:%' AND created_at::date = '2026-03-24';

-- A2) Migrar las opciones legacy (jsonb) del Test activo a quiz_question_options.
--     correct_answer es 0-based (verificado con contenido real: "margen neto
--     medio" -> correct_answer=1 -> "6-8%", que es el índice 1).
INSERT INTO public.quiz_question_options (question_id, option_text, order_index, is_correct)
SELECT qq.id,
       opt.value #>> '{}',
       (opt.ordinality - 1)::int,
       (opt.ordinality - 1)::int = qq.correct_answer
FROM public.quiz_questions qq
JOIN public.course_quizzes cq ON cq.id = qq.quiz_id
CROSS JOIN LATERAL jsonb_array_elements(qq.options) WITH ORDINALITY AS opt(value, ordinality)
WHERE cq.title LIKE 'Test:%'
  AND cq.is_active = true
  AND qq.options IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.quiz_question_options o WHERE o.question_id = qq.id);

-- B) Renumerar order_index de preguntas en TODOS los quizzes (0..n-1,
--    estable: respeta el orden actual y desempata por created_at).
WITH nueva AS (
  SELECT id,
         row_number() OVER (PARTITION BY quiz_id ORDER BY order_index, created_at, id) - 1 AS idx
  FROM public.quiz_questions
)
UPDATE public.quiz_questions q
SET order_index = n.idx
FROM nueva n
WHERE n.id = q.id AND q.order_index IS DISTINCT FROM n.idx;

-- C) Barajar la posición de las opciones en la serie sesgada y en los
--    Tests recién migrados. La serie "Evaluación:" no se toca.
WITH baraja AS (
  SELECT o.id,
         row_number() OVER (PARTITION BY o.question_id ORDER BY random()) - 1 AS idx
  FROM public.quiz_question_options o
  JOIN public.quiz_questions qq ON qq.id = o.question_id
  JOIN public.course_quizzes cq ON cq.id = qq.quiz_id
  WHERE cq.title LIKE 'Cuestionario:%' OR cq.title LIKE 'Test:%'
)
UPDATE public.quiz_question_options o
SET order_index = b.idx
FROM baraja b
WHERE b.id = o.id;

-- ---------------------------------------------------------------------
-- VERIFICACIÓN (ejecutar después; las 3 consultas):
--
-- 1. Distribución de la posición correcta (debe salir repartida, sin
--    dominar ninguna posición):
-- SELECT o.order_index AS posicion, count(*) FROM public.quiz_question_options o
-- JOIN public.quiz_questions qq ON qq.id=o.question_id
-- JOIN public.course_quizzes cq ON cq.id=qq.quiz_id
-- WHERE o.is_correct AND (cq.title LIKE 'Cuestionario:%' OR cq.title LIKE 'Test:%')
-- GROUP BY 1 ORDER BY 1;
--
-- 2. Ningún curso con más de un quiz activo (debe devolver 0 filas):
-- SELECT course_id, count(*) FROM public.course_quizzes WHERE is_active
-- GROUP BY 1 HAVING count(*) > 1;
--
-- 3. REVISA A OJO el mapeo de correctas de los Tests (42 filas; si alguna
--    respuesta marcada como correcta es absurda, avisar a Claude: sería
--    señal de que correct_answer era 1-based y hay que recolocar):
-- SELECT cq.title, COALESCE(qq.question_text, qq.question) AS pregunta,
--        o.option_text AS marcada_como_correcta
-- FROM public.quiz_questions qq
-- JOIN public.course_quizzes cq ON cq.id = qq.quiz_id
-- JOIN public.quiz_question_options o ON o.question_id = qq.id AND o.is_correct
-- WHERE cq.title LIKE 'Test:%' AND cq.is_active = true
-- ORDER BY cq.title, qq.order_index;
-- ---------------------------------------------------------------------
