
-- 1. Remove overly permissive policies on courses & resources
DROP POLICY IF EXISTS "Public can view courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view resources" ON public.resources;

-- Ensure anon can still see published, non-premium items on public catalog pages
CREATE POLICY "Public can view published free courses"
ON public.courses FOR SELECT TO anon
USING (is_published = true AND is_premium = false);

CREATE POLICY "Public can view published free resources"
ON public.resources FOR SELECT TO anon
USING (is_published = true AND COALESCE(is_premium, false) = false);

-- 2. profiles_public view -> security invoker
ALTER VIEW public.profiles_public SET (security_invoker = true);

-- 3. level_for_points search_path
ALTER FUNCTION public.level_for_points(integer) SET search_path = public;

-- 4. Quiz answer key protection
DROP POLICY IF EXISTS "Anyone can view questions from active quizzes" ON public.quiz_questions;
DROP POLICY IF EXISTS "Anyone can view questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Anyone can view options from active quizzes" ON public.quiz_question_options;
DROP POLICY IF EXISTS "Anyone can view quiz_question_options" ON public.quiz_question_options;

-- (Admin manage policies remain in place.)

-- Safe RPC returning quiz questions without correct answers
CREATE OR REPLACE FUNCTION public.get_active_quiz_questions(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.course_quizzes WHERE id = p_quiz_id AND is_active = true
  ) THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(q ORDER BY (q->>'order_index')::int), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', qq.id,
      'quiz_id', qq.quiz_id,
      'question', qq.question,
      'question_text', qq.question_text,
      'question_type', qq.question_type,
      'points', qq.points,
      'order_index', qq.order_index,
      'created_at', qq.created_at,
      'options', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', o.id,
            'question_id', o.question_id,
            'option_text', o.option_text,
            'order_index', o.order_index,
            'created_at', o.created_at
          ) ORDER BY o.order_index
        )
        FROM public.quiz_question_options o
        WHERE o.question_id = qq.id
      ), '[]'::jsonb)
    ) AS q
    FROM public.quiz_questions qq
    WHERE qq.quiz_id = p_quiz_id
  ) sub;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_quiz_questions(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_active_quiz_questions(uuid) FROM anon, public;

-- Server-side answer scoring
CREATE OR REPLACE FUNCTION public.submit_quiz_answer(
  p_attempt_id uuid,
  p_question_id uuid,
  p_selected_option_id uuid DEFAULT NULL,
  p_answer_text text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_question record;
  v_correct_option uuid;
  v_is_correct boolean := false;
  v_points integer := 0;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  -- Verify attempt ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE id = p_attempt_id AND user_id = v_user AND completed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Attempt not found or already completed';
  END IF;

  SELECT id, question_type, points INTO v_question
  FROM public.quiz_questions WHERE id = p_question_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  SELECT id INTO v_correct_option
  FROM public.quiz_question_options
  WHERE question_id = p_question_id AND is_correct = true
  LIMIT 1;

  IF v_question.question_type = 'multiple_choice' AND p_selected_option_id IS NOT NULL THEN
    v_is_correct := (p_selected_option_id = v_correct_option);
    v_points := CASE WHEN v_is_correct THEN v_question.points ELSE 0 END;
  END IF;

  INSERT INTO public.quiz_answers (attempt_id, question_id, selected_option_id, answer_text, is_correct, points_earned)
  VALUES (p_attempt_id, p_question_id, p_selected_option_id, p_answer_text, v_is_correct, v_points)
  ON CONFLICT (attempt_id, question_id) DO UPDATE SET
    selected_option_id = EXCLUDED.selected_option_id,
    answer_text = EXCLUDED.answer_text,
    is_correct = EXCLUDED.is_correct,
    points_earned = EXCLUDED.points_earned;

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_option_id', v_correct_option,
    'points_earned', v_points
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_answer(uuid, uuid, uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_quiz_answer(uuid, uuid, uuid, text) FROM anon, public;

-- Ensure ON CONFLICT works for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quiz_answers_attempt_question_uniq'
  ) THEN
    ALTER TABLE public.quiz_answers
      ADD CONSTRAINT quiz_answers_attempt_question_uniq UNIQUE (attempt_id, question_id);
  END IF;
END $$;

-- 5. job-resumes storage policies
CREATE POLICY "Applicants can upload their own resume"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'job-resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Applicants can read own resume"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'job-resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Employers and admins can read resumes for their jobs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'job-resumes'
  AND (
    public.is_current_user_admin()
    OR EXISTS (
      SELECT 1
      FROM public.job_applications ja
      JOIN public.job_listings jl ON jl.id = ja.job_id
      WHERE ja.resume_url = storage.objects.name
        AND jl.employer_id = auth.uid()
    )
  )
);

CREATE POLICY "Applicants can delete own resume"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'job-resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Revoke EXECUTE on internal/trigger SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_admin_users_to_user_roles() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_admin_role_to_user_roles() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_job_listings_public() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_pharmacy_listings_public() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_admin_action() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_contact_access() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.normalize_job_expires_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_course_slug() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.block_unsafe_profile_updates() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.trg_points_by_author_id() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.trg_points_by_user_id() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.anonymize_old_applications() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.recompute_user_points(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.add_user_points(uuid, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_notification_for_user(uuid, text, text, text, text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, jsonb, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_pharmacy_contact_email(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_job_contact_email(uuid) FROM anon, authenticated, public;
