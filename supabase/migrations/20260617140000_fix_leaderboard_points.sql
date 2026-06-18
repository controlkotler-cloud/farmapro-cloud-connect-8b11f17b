-- =====================================================================
-- Fix leaderboard/puntos (2026-06-17) — el ranking debe FUNCIONAR.
-- Problema: user_points solo se intentaba escribir desde el cliente, pero la
-- RLS lo impide (solo SELECT) y además syncUserPoints() no se llamaba nunca
-- -> la tabla quedaba vacía -> ranking, EngagementWidget y badges por puntos a 0.
-- Solución: poblar user_points en el SERVIDOR vía triggers (SECURITY DEFINER)
-- a partir de la actividad real, sin abrir escritura al cliente.
-- Idempotente y no destructivo. Ejecutar en el SQL Editor del proyecto del PORTAL.
-- =====================================================================

-- Nivel coherente con pointsService (mismos tramos en TODA la app).
CREATE OR REPLACE FUNCTION public.level_for_points(p integer)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p >= 2000 THEN 6
    WHEN p >= 1000 THEN 5
    WHEN p >= 600  THEN 4
    WHEN p >= 300  THEN 3
    WHEN p >= 100  THEN 2
    ELSE 1
  END;
$$;

-- Recalcula los puntos totales de un usuario desde su actividad real.
-- Valores alineados con POINT_VALUES de src/services/pointsService.ts:
--   reto completado = points_earned · curso completado = 50 · quiz aprobado = 20
--   hilo de foro = 5 · respuesta = 3 · descarga de recurso = 2
CREATE OR REPLACE FUNCTION public.recompute_user_points(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total integer;
BEGIN
  total :=
      COALESCE((SELECT SUM(points_earned) FROM public.user_challenge_progress
                 WHERE user_id = _user_id AND completed_at IS NOT NULL), 0)
    + 50 * COALESCE((SELECT COUNT(*) FROM public.course_enrollments
                 WHERE user_id = _user_id AND is_completed = true), 0)
    + 20 * COALESCE((SELECT COUNT(DISTINCT quiz_id) FROM public.quiz_attempts
                 WHERE user_id = _user_id AND passed = true), 0)
    +  5 * COALESCE((SELECT COUNT(*) FROM public.forum_threads
                 WHERE author_id = _user_id), 0)
    +  3 * COALESCE((SELECT COUNT(*) FROM public.forum_replies
                 WHERE author_id = _user_id), 0)
    +  2 * COALESCE((SELECT COUNT(*) FROM public.resource_downloads
                 WHERE user_id = _user_id), 0);

  INSERT INTO public.user_points (user_id, total_points, level, updated_at)
  VALUES (_user_id, total, public.level_for_points(total), now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_points = EXCLUDED.total_points,
        level        = EXCLUDED.level,
        updated_at   = now();
END;
$$;

-- Disparadores: recalcular cuando cambia la actividad puntuable.
CREATE OR REPLACE FUNCTION public.trg_points_by_user_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recompute_user_points(COALESCE(NEW.user_id, OLD.user_id));
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_points_by_author_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recompute_user_points(COALESCE(NEW.author_id, OLD.author_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS pts_challenge ON public.user_challenge_progress;
CREATE TRIGGER pts_challenge AFTER INSERT OR UPDATE OR DELETE ON public.user_challenge_progress
  FOR EACH ROW EXECUTE FUNCTION public.trg_points_by_user_id();

DROP TRIGGER IF EXISTS pts_enrollment ON public.course_enrollments;
CREATE TRIGGER pts_enrollment AFTER INSERT OR UPDATE OR DELETE ON public.course_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.trg_points_by_user_id();

DROP TRIGGER IF EXISTS pts_quiz ON public.quiz_attempts;
CREATE TRIGGER pts_quiz AFTER INSERT OR UPDATE OR DELETE ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.trg_points_by_user_id();

DROP TRIGGER IF EXISTS pts_downloads ON public.resource_downloads;
CREATE TRIGGER pts_downloads AFTER INSERT OR UPDATE OR DELETE ON public.resource_downloads
  FOR EACH ROW EXECUTE FUNCTION public.trg_points_by_user_id();

DROP TRIGGER IF EXISTS pts_threads ON public.forum_threads;
CREATE TRIGGER pts_threads AFTER INSERT OR UPDATE OR DELETE ON public.forum_threads
  FOR EACH ROW EXECUTE FUNCTION public.trg_points_by_author_id();

DROP TRIGGER IF EXISTS pts_replies ON public.forum_replies;
CREATE TRIGGER pts_replies AFTER INSERT OR UPDATE OR DELETE ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.trg_points_by_author_id();

-- Backfill de todos los perfiles existentes (crea su fila en user_points).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recompute_user_points(r.id);
  END LOOP;
END $$;

-- NOTA: los puntos de retos usan points_earned (lo fija el cliente al completar);
-- las demás fuentes usan recuentos autoritativos. Si se quiere blindar del todo
-- el anti-trampa de retos, validar points_earned contra challenges.points_reward.
