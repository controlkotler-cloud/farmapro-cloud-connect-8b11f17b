-- Actualizar los cron jobs para que terminen el 28 de julio de 2025
-- Primero cancelamos los jobs existentes
SELECT cron.unschedule('generate-daily-resource-morning');
SELECT cron.unschedule('generate-daily-resource-evening');
SELECT cron.unschedule('generate-basic-course');
SELECT cron.unschedule('generate-intermediate-course');
SELECT cron.unschedule('generate-advanced-course');

-- Programar recursos - solo hasta el 28 de julio 2025
SELECT cron.schedule(
  'generate-daily-resource-morning',
  '0 11 * * *', -- Cada día a las 11:00 UTC
  $$
  SELECT CASE 
    WHEN CURRENT_DATE <= '2025-07-28' THEN
      net.http_post(
        url:='https://fcqctkhvplmqukgosmya.supabase.co/functions/v1/generate-daily-resource',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
      )
    ELSE
      NULL
  END as request_id;
  $$
);

SELECT cron.schedule(
  'generate-daily-resource-evening',
  '0 23 * * *', -- Cada día a las 23:00 UTC
  $$
  SELECT CASE 
    WHEN CURRENT_DATE <= '2025-07-28' THEN
      net.http_post(
        url:='https://fcqctkhvplmqukgosmya.supabase.co/functions/v1/generate-daily-resource',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
      )
    ELSE
      NULL
  END as request_id;
  $$
);

-- Programar cursos - solo hasta el 28 de julio 2025
SELECT cron.schedule(
  'generate-basic-course',
  '0 9 * * *', -- Cada día a las 09:00 UTC
  $$
  SELECT CASE 
    WHEN CURRENT_DATE <= '2025-07-28' THEN
      net.http_post(
        url:='https://fcqctkhvplmqukgosmya.supabase.co/functions/v1/generate-daily-course',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0"}'::jsonb,
        body:=concat('{"level": "basico", "time": "', now(), '"}')::jsonb
      )
    ELSE
      NULL
  END as request_id;
  $$
);

SELECT cron.schedule(
  'generate-intermediate-course',
  '0 15 * * *', -- Cada día a las 15:00 UTC
  $$
  SELECT CASE 
    WHEN CURRENT_DATE <= '2025-07-28' THEN
      net.http_post(
        url:='https://fcqctkhvplmqukgosmya.supabase.co/functions/v1/generate-daily-course',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0"}'::jsonb,
        body:=concat('{"level": "intermedio", "time": "', now(), '"}')::jsonb
      )
    ELSE
      NULL
  END as request_id;
  $$
);

SELECT cron.schedule(
  'generate-advanced-course',
  '0 21 * * *', -- Cada día a las 21:00 UTC
  $$
  SELECT CASE 
    WHEN CURRENT_DATE <= '2025-07-28' THEN
      net.http_post(
        url:='https://fcqctkhvplmqukgosmya.supabase.co/functions/v1/generate-daily-course',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0"}'::jsonb,
        body:=concat('{"level": "avanzado", "time": "', now(), '"}')::jsonb
      )
    ELSE
      NULL
  END as request_id;
  $$
);

-- Job de limpieza para eliminar los cron jobs después del 28 de julio
SELECT cron.schedule(
  'cleanup-automation-jobs',
  '0 0 29 7 *', -- 29 de julio a las 00:00 UTC
  $$
  SELECT cron.unschedule('generate-daily-resource-morning');
  SELECT cron.unschedule('generate-daily-resource-evening');
  SELECT cron.unschedule('generate-basic-course');
  SELECT cron.unschedule('generate-intermediate-course');
  SELECT cron.unschedule('generate-advanced-course');
  SELECT cron.unschedule('cleanup-automation-jobs');
  $$
);