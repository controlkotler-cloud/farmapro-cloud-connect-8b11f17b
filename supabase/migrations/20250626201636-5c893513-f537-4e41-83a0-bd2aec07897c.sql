
-- Tabla para almacenar quizzes de cursos
CREATE TABLE public.course_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70,
  time_limit_minutes INTEGER DEFAULT 30,
  max_attempts INTEGER DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para preguntas del quiz
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.course_quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- multiple_choice, true_false, short_answer
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para opciones de respuesta
CREATE TABLE public.quiz_question_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para intentos de quiz de usuarios
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES public.course_quizzes(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  answers JSONB DEFAULT '[]'::jsonb
);

-- Tabla para respuestas individuales
CREATE TABLE public.quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE NOT NULL,
  selected_option_id UUID REFERENCES public.quiz_question_options(id),
  answer_text TEXT, -- Para preguntas de respuesta corta
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_course_quizzes_course_id ON public.course_quizzes(course_id);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_question_options_question_id ON public.quiz_question_options(question_id);
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_answers_attempt_id ON public.quiz_answers(attempt_id);

-- Políticas RLS para course_quizzes
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active quizzes" ON public.course_quizzes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage quizzes" ON public.course_quizzes
  FOR ALL USING (public.is_current_user_admin());

-- Políticas RLS para quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions from active quizzes" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_quizzes 
      WHERE id = quiz_questions.quiz_id 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage questions" ON public.quiz_questions
  FOR ALL USING (public.is_current_user_admin());

-- Políticas RLS para quiz_question_options
ALTER TABLE public.quiz_question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view options from active quizzes" ON public.quiz_question_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions qq
      JOIN public.course_quizzes cq ON qq.quiz_id = cq.id
      WHERE qq.id = quiz_question_options.question_id 
      AND cq.is_active = true
    )
  );

CREATE POLICY "Admins can manage options" ON public.quiz_question_options
  FOR ALL USING (public.is_current_user_admin());

-- Políticas RLS para quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts" ON public.quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts" ON public.quiz_attempts
  FOR SELECT USING (public.is_current_user_admin());

-- Políticas RLS para quiz_answers
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage answers for their attempts" ON public.quiz_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts 
      WHERE id = quiz_answers.attempt_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all answers" ON public.quiz_answers
  FOR SELECT USING (public.is_current_user_admin());

-- Función para calcular estadísticas de quiz
CREATE OR REPLACE FUNCTION public.calculate_quiz_stats(quiz_id_param UUID)
RETURNS TABLE (
  total_attempts BIGINT,
  total_users BIGINT,
  average_score DECIMAL,
  pass_rate DECIMAL
) 
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    COUNT(*) as total_attempts,
    COUNT(DISTINCT user_id) as total_users,
    ROUND(AVG(percentage), 2) as average_score,
    ROUND(
      (COUNT(*) FILTER (WHERE passed = true) * 100.0 / COUNT(*)), 
      2
    ) as pass_rate
  FROM public.quiz_attempts 
  WHERE quiz_id = quiz_id_param 
  AND completed_at IS NOT NULL;
$$;
