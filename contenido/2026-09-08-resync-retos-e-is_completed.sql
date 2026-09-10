-- 08-09-2026. Resincronización de retos y del flag is_completed.
-- PENDIENTE DE CONFIRMAR POR FRANCESC (toca >3 filas). Idempotente.
--
-- Contexto: hasta el commit 5b6525b cada acción mandaba "1" como cuenta absoluta
-- del reto, así que solo contaba la primera (3 recursos = "Cinco recursos" 1/5).
-- El código nuevo se resincroniza solo con la SIGUIENTE acción de cada usuario,
-- así que este bloque solo adelanta lo que pasará de todas formas.
--
-- Alcance medido el 08-09 (SELECT previo): 7 inscripciones completadas sin
-- is_completed=true (control@mkpro.es, laura@mkpro.es, fantafrenchie@gmail.com)
-- y una docena de filas de progreso desfasadas de esos mismos usuarios.

BEGIN;

-- 1) Cursos terminados sin flag: recompute_user_points (+50) y "Continuar curso" lo leen.
UPDATE public.course_enrollments
   SET is_completed = true
 WHERE completed_at IS NOT NULL AND is_completed IS DISTINCT FROM true;

-- 2) Progreso de retos = cuenta real (solo retos activos no semanales, solo sube).
CREATE TEMP TABLE _real AS
  SELECT user_id, 'resource_downloaded'::challenge_type AS type, COUNT(DISTINCT resource_id)::int AS n FROM public.resource_downloads GROUP BY 1
  UNION ALL SELECT user_id, 'course_started', COUNT(*)::int FROM public.course_enrollments GROUP BY 1
  UNION ALL SELECT user_id, 'course_completed', COUNT(*)::int FROM public.course_enrollments WHERE completed_at IS NOT NULL GROUP BY 1
  UNION ALL SELECT user_id, 'quiz_completed', COUNT(DISTINCT quiz_id)::int FROM public.quiz_attempts WHERE passed GROUP BY 1
  UNION ALL SELECT author_id, 'forum_post', COUNT(*)::int FROM public.forum_threads GROUP BY 1
  UNION ALL SELECT author_id, 'forum_reply', COUNT(*)::int FROM public.forum_replies GROUP BY 1;

CREATE TEMP TABLE _target AS
  SELECT r.user_id, c.id AS challenge_id, r.n, c.target_count, COALESCE(c.points_reward, 0) AS points_reward
    FROM _real r
    JOIN public.challenges c ON c.type = r.type AND c.is_active AND NOT c.is_weekly
   WHERE r.n > 0 AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = r.user_id);

-- Filas existentes no completadas: subir cuenta y completar si toca.
UPDATE public.user_challenge_progress p
   SET current_count = GREATEST(p.current_count, t.n),
       points_earned = CASE WHEN t.n >= t.target_count THEN t.points_reward ELSE p.points_earned END,
       completed_at  = CASE WHEN t.n >= t.target_count THEN now() ELSE NULL END
  FROM _target t
 WHERE p.user_id = t.user_id AND p.challenge_id = t.challenge_id
   AND p.completed_at IS NULL
   AND (t.n > p.current_count OR t.n >= t.target_count);

-- Filas que no existían.
INSERT INTO public.user_challenge_progress (user_id, challenge_id, current_count, points_earned, completed_at)
SELECT t.user_id, t.challenge_id, t.n,
       CASE WHEN t.n >= t.target_count THEN t.points_reward ELSE 0 END,
       CASE WHEN t.n >= t.target_count THEN now() END
  FROM _target t
 WHERE NOT EXISTS (SELECT 1 FROM public.user_challenge_progress p WHERE p.user_id = t.user_id AND p.challenge_id = t.challenge_id);

-- Los triggers pts_challenge / pts_enrollment recalculan user_points solos.
COMMIT;
