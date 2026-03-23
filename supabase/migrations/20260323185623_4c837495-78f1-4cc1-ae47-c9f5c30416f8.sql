
-- Create badge_category and badge_requirement_type as simple text check constraints
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🏆',
  category text NOT NULL DEFAULT 'especial' CHECK (category IN ('formacion', 'comunidad', 'constancia', 'especial')),
  requirement_type text NOT NULL DEFAULT 'points_total' CHECK (requirement_type IN ('courses_completed', 'quizzes_passed', 'forum_posts', 'forum_replies', 'resources_downloaded', 'streak_days', 'points_total', 'level_reached', 'manual')),
  requirement_value integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Add opt_out_leaderboard to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS opt_out_leaderboard boolean NOT NULL DEFAULT false;

-- RLS for badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active badges" ON public.badges
  FOR SELECT TO authenticated USING (is_active = true OR is_current_user_admin());

CREATE POLICY "Admins can manage badges" ON public.badges
  FOR ALL TO authenticated USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

-- RLS for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user_badges" ON public.user_badges
  FOR ALL TO authenticated USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

-- Seed initial badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value) VALUES
-- Formación
('Primer Paso', 'Completar 1 curso', '📚', 'formacion', 'courses_completed', 1),
('Estudiante Modelo', 'Completar 3 cursos', '🎓', 'formacion', 'courses_completed', 3),
('Farmacéutico Experto', 'Completar 10 cursos', '🏆', 'formacion', 'courses_completed', 10),
('Evaluación Perfecta', 'Sacar 100% en un quiz', '✅', 'formacion', 'quizzes_passed', 1),
-- Comunidad
('Primera Palabra', 'Escribir tu primer hilo en el foro', '💬', 'comunidad', 'forum_posts', 1),
('Voz Activa', 'Escribir 10 hilos en el foro', '🗣️', 'comunidad', 'forum_posts', 10),
('Buen Compañero', 'Responder 5 hilos de otros', '🤝', 'comunidad', 'forum_replies', 5),
('Mentor', 'Responder 25 hilos', '🌟', 'comunidad', 'forum_replies', 25),
-- Constancia
('Racha de 3', 'Mantener una racha de 3 días', '🔥', 'constancia', 'streak_days', 3),
('Racha de 7', 'Mantener una racha de 7 días', '⚡', 'constancia', 'streak_days', 7),
('Racha de 30', 'Mantener una racha de 30 días', '💎', 'constancia', 'streak_days', 30),
-- Especial
('Early Adopter', 'Registrarse en el primer mes', '🚀', 'especial', 'manual', 1),
('Coleccionista', 'Descargar 5 recursos', '📥', 'especial', 'resources_downloaded', 5),
('Nivel 5', 'Alcanzar nivel 5', '⭐', 'especial', 'level_reached', 5);
