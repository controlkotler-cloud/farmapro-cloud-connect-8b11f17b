-- Habilitar las extensiones necesarias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Programar la tarea para ejecutarse diariamente a las 9:00 AM
SELECT cron.schedule(
  'generate-daily-course',
  '0 9 * * *', -- Diariamente a las 9:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://fcqctkhvplmqukgosmya.supabase.co/functions/v1/generate-daily-course',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Crear tabla para tracking de cursos generados automáticamente
CREATE TABLE IF NOT EXISTS generated_courses_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  topic TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en la tabla de logs
ALTER TABLE generated_courses_log ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins puedan ver los logs
CREATE POLICY "Only admins can view generated courses log"
ON generated_courses_log
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());