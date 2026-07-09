-- Smoke test 2026-07-09 (portal.farmapro.es) encontró 3 problemas. Esta migración
-- agrupa los 3 fixes. Idempotente: se puede ejecutar más de una vez sin efectos
-- adicionales. No borra ni modifica datos de negocio, solo limpia URLs de imagen
-- rotas y ajusta esquema (función huérfana + índices).

-- ============================================================================
-- FIX 1: RPC update_challenge_progress devuelve 400 (PGRST203) en /retos
-- ============================================================================
-- Causa raíz: la única versión versionada de la función tiene 3 parámetros
-- (supabase/migrations/20260323185319_1f4c1ad1-8b5e-4c5e-a955-443305a7490b.sql:
-- challenge_id_param uuid, points_earned_param integer DEFAULT 0,
-- new_count_param integer DEFAULT 1). El frontend (src/utils/challengeUtils.ts:54-58)
-- llama con 3 argumentos. En producción existe además un overload de 2 argumentos
-- que NO viene de ninguna migración del repo (types.ts generado desde la BD real
-- lo confirma: hay dos firmas de update_challenge_progress). Es decir, alguien
-- creó una versión antigua directamente en el SQL editor de Lovable/Supabase y
-- nunca se hizo DROP FUNCTION al versionar la de 3 argumentos. Con defaults en
-- los parámetros opcionales, PostgREST no puede decidir de forma unívoca qué
-- overload usar y responde 400 "could not choose the best candidate function".
--
-- Fix: localizar dinámicamente cualquier overload de 2 argumentos de
-- update_challenge_progress y eliminarlo, sin asumir sus tipos exactos (no están
-- documentados en ninguna migración). Aborta la migración si tras la limpieza no
-- queda ninguna versión de 3 argumentos (para no dejar el sistema sin la función).
DO $$
DECLARE
  r RECORD;
  remaining_3arg INTEGER;
BEGIN
  FOR r IN
    SELECT pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_challenge_progress'
      AND p.pronargs = 2
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.update_challenge_progress(%s);', r.args);
    RAISE NOTICE 'Dropped orphan overload: update_challenge_progress(%)', r.args;
  END LOOP;

  SELECT count(*) INTO remaining_3arg
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'update_challenge_progress'
    AND p.pronargs = 3;

  IF remaining_3arg = 0 THEN
    RAISE EXCEPTION 'update_challenge_progress: no quedó ninguna versión de 3 argumentos tras la limpieza. Abortando para no romper /retos.';
  END IF;
END $$;

-- ============================================================================
-- FIX 2: queries HEAD con count exact devuelven 503 en /retos (src/hooks/useBadges.ts:56-60)
-- ============================================================================
-- No existe ningún índice sobre las columnas por las que se filtran estos counts
-- exactos (auth.uid() = user_id / author_id, ya usado también por las políticas
-- RLS de SELECT sobre estas tablas). Es la causa más probable del 503 bajo carga:
-- un count(*) exacto con RLS fuerza un scan completo sin índice de apoyo. Añadir
-- estos índices es una mitigación segura y de bajo riesgo; si el 503 persiste tras
-- desplegar esto, el problema es de infraestructura (PostgREST/Supavisor) y no de
-- planificación de consultas, y habrá que mirar logs de Supabase directamente.
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_completed
  ON public.course_enrollments (user_id)
  WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_percentage
  ON public.quiz_attempts (user_id)
  WHERE percentage = 100;

CREATE INDEX IF NOT EXISTS idx_forum_threads_author
  ON public.forum_threads (author_id);

CREATE INDEX IF NOT EXISTS idx_forum_replies_author
  ON public.forum_replies (author_id);

CREATE INDEX IF NOT EXISTS idx_resource_downloads_user
  ON public.resource_downloads (user_id);

-- Las políticas "Admins can view all ..." de estas 5 tablas llaman a
-- public.is_current_user_admin(), que hace SELECT EXISTS sobre user_roles
-- filtrando por user_id. Tampoco tiene índice de apoyo en ninguna migración.
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role
  ON public.user_roles (user_id, role);

-- ============================================================================
-- FIX 3: imágenes rotas farmapro.es/imagen/1-4.png en /formacion (503)
-- ============================================================================
-- No es un bug de código: src/components/course/CourseCard.tsx (L70-84) ya
-- gestiona featured_image_url/thumbnail_url nulos con un fallback de gradiente +
-- icono por categoría, y además tiene onError en el <img> que activa ese mismo
-- fallback si la URL responde con error. Las URLs rotas son datos guardados en la
-- tabla courses. Las limpiamos para no seguir generando peticiones fallidas.
UPDATE public.courses
SET featured_image_url = NULL
WHERE featured_image_url ILIKE 'https://farmapro.es/imagen/%';

UPDATE public.courses
SET thumbnail_url = NULL
WHERE thumbnail_url ILIKE 'https://farmapro.es/imagen/%';

-- ============================================================================
-- FIX 4: recrea el evento "24º Congreso Nacional Farmacéutico (24CNF)" borrado
-- por error (junto a su duplicado) desde /admin/eventos durante la limpieza
-- manual tras este smoke test.
-- ============================================================================
-- Datos tomados de la tarjeta vista en /admin/eventos antes del borrado.
-- registration_url ("Más información") NO se capturó durante el smoke test:
-- queda NULL. Si el evento original tenía enlace externo, añádelo a mano desde
-- /admin/eventos tras ejecutar esta migración. hora de fin (09:00) es un valor
-- de relleno razonable, no estaba documentada; ajústala si lo sabes.
INSERT INTO public.events (
  title, description, event_type, start_date, end_date, location,
  is_online, is_featured, is_published
)
SELECT
  '24º Congreso Nacional Farmacéutico (24CNF)',
  'Gran cita bienal de la profesión farmacéutica española, bajo el lema «Innovación ConCiencia Farmacéutica», con sesiones plenarias, simposios y sesiones técnicas.',
  'Congreso',
  '2026-09-30 09:00:00+02'::timestamptz,
  '2026-10-02 09:00:00+02'::timestamptz,
  'Palacio de Exposiciones y Congresos, Oviedo',
  false,
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.events WHERE title = '24º Congreso Nacional Farmacéutico (24CNF)'
);
