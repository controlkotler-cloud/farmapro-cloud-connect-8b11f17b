
-- Eliminar políticas existentes para quiz_attempts
DROP POLICY IF EXISTS "Users can view their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can create their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON public.quiz_attempts;

-- Eliminar políticas existentes para quiz_answers
DROP POLICY IF EXISTS "Users can manage answers for their attempts" ON public.quiz_answers;
DROP POLICY IF EXISTS "Admins can view all answers" ON public.quiz_answers;

-- Recrear políticas RLS para quiz_attempts
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts" ON public.quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (public.is_current_user_admin());

-- Recrear políticas RLS para quiz_answers
CREATE POLICY "Users can manage own quiz answers" ON public.quiz_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts 
      WHERE id = quiz_answers.attempt_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all quiz answers" ON public.quiz_answers
  FOR SELECT USING (public.is_current_user_admin());
