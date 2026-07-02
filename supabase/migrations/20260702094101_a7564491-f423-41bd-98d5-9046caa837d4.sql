
-- ============ 1) Storage policies for recursos-premium ============
DROP POLICY IF EXISTS "recursos_premium_paid_select" ON storage.objects;
CREATE POLICY "recursos_premium_paid_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'recursos-premium'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.subscription_role IN ('plus','equipo','premium','profesional','admin')
  )
);

DROP POLICY IF EXISTS "recursos_premium_admin_all" ON storage.objects;
CREATE POLICY "recursos_premium_admin_all"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'recursos-premium' AND public.is_current_user_admin())
WITH CHECK (bucket_id = 'recursos-premium' AND public.is_current_user_admin());

-- ============ 2) Course modules RPC + column protection ============
CREATE OR REPLACE FUNCTION public.get_course_modules(p_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_course record;
  v_role text;
  v_created timestamptz;
  v_in_trial boolean := false;
BEGIN
  SELECT id, is_premium, is_published, course_modules
    INTO v_course
    FROM public.courses
    WHERE id = p_course_id;
  IF NOT FOUND OR NOT v_course.is_published THEN
    IF NOT public.is_current_user_admin() THEN
      RETURN '[]'::jsonb;
    END IF;
  END IF;

  IF public.is_current_user_admin() THEN
    RETURN COALESCE(v_course.course_modules, '[]'::jsonb);
  END IF;

  IF NOT v_course.is_premium THEN
    RETURN COALESCE(v_course.course_modules, '[]'::jsonb);
  END IF;

  IF v_uid IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT subscription_role::text, created_at
    INTO v_role, v_created
    FROM public.profiles WHERE id = v_uid;

  IF v_role IN ('plus','equipo','premium','profesional','admin') THEN
    RETURN COALESCE(v_course.course_modules, '[]'::jsonb);
  END IF;

  IF v_created IS NOT NULL AND v_created > (now() - interval '30 days') THEN
    RETURN COALESCE(v_course.course_modules, '[]'::jsonb);
  END IF;

  RETURN '[]'::jsonb;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_course_modules(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_course_modules(uuid) TO authenticated;

-- Column-level revoke: prevent direct SELECT on course_modules for regular clients.
REVOKE SELECT (course_modules) ON public.courses FROM anon, authenticated;

-- ============ 3) IAFarma text usage ============
CREATE TABLE IF NOT EXISTS public.ai_text_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period text NOT NULL,
  used integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period)
);

GRANT SELECT ON public.ai_text_usage TO authenticated;
GRANT ALL ON public.ai_text_usage TO service_role;
ALTER TABLE public.ai_text_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_text_usage_own_select" ON public.ai_text_usage;
CREATE POLICY "ai_text_usage_own_select" ON public.ai_text_usage
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.consume_text_credit(p_limit integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_period text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_used integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.ai_text_usage (user_id, period, used)
  VALUES (v_user, v_period, 0)
  ON CONFLICT (user_id, period) DO NOTHING;

  UPDATE public.ai_text_usage
     SET used = used + 1, updated_at = now()
   WHERE user_id = v_user
     AND period = v_period
     AND used < p_limit
  RETURNING used INTO v_used;

  IF v_used IS NULL THEN
    RAISE EXCEPTION 'Monthly text quota exceeded' USING ERRCODE = 'P0001';
  END IF;

  RETURN GREATEST(p_limit - v_used, 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_text_credit(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_text_credit(integer) TO authenticated;

-- ============ 4) profiles policies snapshot (idempotent) ============
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.profiles;
CREATE POLICY "Users can view own profile and admins can view all" ON public.profiles
FOR SELECT TO authenticated USING ((auth.uid() = id) OR public.is_current_user_admin());

-- ============ 5) Drop redundant permissive policy on resources ============
DROP POLICY IF EXISTS "Premium users can access premium resources" ON public.resources;
