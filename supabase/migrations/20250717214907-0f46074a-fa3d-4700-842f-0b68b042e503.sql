-- Modificar la tabla de logs para incluir el nivel del curso
ALTER TABLE public.generated_courses_log
ADD COLUMN level TEXT DEFAULT 'basico';

-- Crear tabla para llevar el control de temas utilizados
CREATE TABLE IF NOT EXISTS public.course_generation_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_topic_index INTEGER DEFAULT 0,
  cycle_complete BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aplicar RLS a la tabla de control
ALTER TABLE public.course_generation_control ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins puedan gestionar la tabla de control
CREATE POLICY "Only admins can manage course generation control" 
ON public.course_generation_control
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Insertar el registro de control inicial
INSERT INTO public.course_generation_control (current_topic_index, cycle_complete)
VALUES (0, false);

-- Eliminar el cron job existente si lo hay
SELECT cron.unschedule('generate-daily-course');

-- Programar las tareas para ejecutarse en los horarios especificados
-- Tarea para curso básico a las 9:00 AM
SELECT cron.schedule(
  'generate-basic-course',
  '0 9 * * *', -- Diariamente a las 9:00 AM
  $$
  SELECT
    net.http_post(
      url:='https://fcqctkhvplmqukgosmya.supabase.co/functions/v1/generate-daily-course',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0"}'::jsonb,
      body:='{"automated": true, "level": "basico"}'::jsonb
    ) as request_id;
  $$
);

-- Tarea para curso intermedio a las 15:00 PM
SELECT cron.schedule(
  'generate-intermediate-course',
  '0 15 * * *', -- Diariamente a las 15:00 PM
  $$
  SELECT
    net.http_post(
      url:='https://fcqctkhvplmqukgosmya.supabase.co/functions/v1/generate-daily-course',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0"}'::jsonb,
      body:='{"automated": true, "level": "intermedio"}'::jsonb
    ) as request_id;
  $$
);

-- Tarea para curso avanzado a las 21:00 PM
SELECT cron.schedule(
  'generate-advanced-course',
  '0 21 * * *', -- Diariamente a las 21:00 PM
  $$
  SELECT
    net.http_post(
      url:='https://fcqctkhvplmqukgosmya.supabase.co/functions/v1/generate-daily-course',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0"}'::jsonb,
      body:='{"automated": true, "level": "avanzado"}'::jsonb
    ) as request_id;
  $$
);