
-- Create weekly_challenge_templates table
CREATE TABLE public.weekly_challenge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type public.challenge_type NOT NULL DEFAULT 'daily',
  target_count integer NOT NULL DEFAULT 1,
  points_reward integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_challenge_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage weekly templates" ON public.weekly_challenge_templates
  FOR ALL TO authenticated USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());

CREATE POLICY "Anyone can view active templates" ON public.weekly_challenge_templates
  FOR SELECT TO authenticated USING (is_active = true OR is_current_user_admin());

-- Seed weekly challenge templates
INSERT INTO public.weekly_challenge_templates (name, description, type, target_count, points_reward) VALUES
  ('Aprendiz de la semana', 'Completar 2 módulos de cualquier curso', 'course_completed', 2, 150),
  ('Explorador curioso', 'Descargar 2 recursos', 'resource_downloaded', 2, 100),
  ('Voz de la farmacia', 'Escribir 1 hilo en el foro', 'forum_post', 1, 120),
  ('Compañero solidario', 'Responder a 3 hilos de otros', 'forum_reply', 3, 130),
  ('Maratonista', 'Completar 1 curso entero', 'course_completed', 1, 200),
  ('Evaluación estrella', 'Aprobar 1 quiz con más del 80%', 'quiz_completed', 1, 150),
  ('Racha imparable', 'Mantener racha de 5 días esta semana', 'daily', 5, 180),
  ('Tres en uno', 'Hacer 3 actividades diferentes (curso + foro + recurso)', 'community_engagement', 3, 160),
  ('Farmacéutico digital', 'Generar 2 contenidos con IAFarma', 'community_engagement', 2, 120),
  ('Debate abierto', 'Crear 1 hilo y responder a 2 diferentes', 'forum_post', 3, 140);
