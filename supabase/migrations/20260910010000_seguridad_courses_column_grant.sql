-- 10-09-2026 · Avisos del panel de seguridad de Lovable (D-day). Solo lo que
-- no rompe nada en producción; los REVOKE EXECUTE sobre SECURITY DEFINER se
-- dejan a propósito (ver memoria project_rebotica_canje_huerfano_10_09).
-- Idempotente. Ejecutado en prod vía query_database el 10-09-2026.

-- 1) CRITICAL: courses.course_modules legible por cualquier usuario. El REVOKE
--    de columna del 31-08 no servía porque seguía existiendo un GRANT SELECT a
--    nivel de tabla (Postgres: el privilegio de tabla cubre todas las columnas).
--    El frontend ya pide columnas explícitas en todos los selects (verificado
--    10-09; AdminDashboard y ai-portal-chat pasados a select('id') en 1e9cabd).
REVOKE SELECT ON public.courses FROM anon, authenticated;
GRANT SELECT (id, title, slug, description, category, difficulty, duration_hours,
  duration_minutes, instructor, thumbnail_url, is_published, is_premium, is_featured,
  order_index, students_count, rating, total_lessons, created_at, updated_at, content,
  featured_image_url, cover_concept, cover_icon)
  ON public.courses TO anon, authenticated;

-- 2) WARNING: course_modules (tabla residual, sin uso en src) abierta a todos.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='course_modules' AND policyname='Anyone can view modules') THEN
    EXECUTE 'ALTER POLICY "Anyone can view modules" ON public.course_modules USING (public.is_current_user_admin())';
  END IF;
END $$;

-- 3) WARNING: Function Search Path Mutable.
ALTER FUNCTION public.next_promotion_reference() SET search_path = public;
ALTER FUNCTION public.image_limits_for_role(text) SET search_path = public;
ALTER FUNCTION public.text_limits_for_role(text) SET search_path = public;
