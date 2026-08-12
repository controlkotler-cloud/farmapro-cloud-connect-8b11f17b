-- ---------------------------------------------------------------------
-- FIX QUIZ (10-07-2026): los intentos nacían "completados".
-- quiz_attempts.completed_at era NOT NULL DEFAULT now() (tabla creada por
-- Lovable en marzo; el default nunca estuvo en migraciones). La migración
-- de seguridad 20260702083641 añadió a submit_quiz_answer la guarda
-- "completed_at IS NULL", que nunca se cumplía → todas las respuestas
-- rechazadas en silencio desde el 02-07.
-- Un intento en curso debe tener completed_at NULL hasta terminarlo
-- (finishQuizAttempt es quien lo rellena).
-- ---------------------------------------------------------------------

ALTER TABLE public.quiz_attempts ALTER COLUMN completed_at DROP DEFAULT;
ALTER TABLE public.quiz_attempts ALTER COLUMN completed_at DROP NOT NULL;

-- Limpieza de intentos zombis: nacidos ya completados tras la migración
-- del 02-07 y sin ninguna respuesta guardada (2 de Francesc del 10-07).
DELETE FROM public.quiz_attempts qa
WHERE qa.completed_at = qa.started_at
  AND qa.started_at >= '2026-07-02'
  AND NOT EXISTS (SELECT 1 FROM public.quiz_answers a WHERE a.attempt_id = qa.id);

-- Verificación (debe devolver column_default = NULL, is_nullable = YES):
-- SELECT column_default, is_nullable FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='quiz_attempts' AND column_name='completed_at';
