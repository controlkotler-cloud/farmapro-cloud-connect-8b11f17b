-- Eliminar los cron jobs existentes
SELECT cron.unschedule('generate-daily-resource-morning');
SELECT cron.unschedule('generate-daily-resource-evening');

-- Crear nuevos cron jobs con los horarios actualizados (11:00 y 23:00 UTC)
SELECT cron.schedule(
  'generate-daily-resource-morning',
  '0 11 * * *', -- Cada día a las 11:00 UTC
  $$
  SELECT
    net.http_post(
        url:='https://fcqctkhvplmqukgosmya.supabase.co/functions/v1/generate-daily-resource',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'generate-daily-resource-evening',
  '0 23 * * *', -- Cada día a las 23:00 UTC
  $$
  SELECT
    net.http_post(
        url:='https://fcqctkhvplmqukgosmya.supabase.co/functions/v1/generate-daily-resource',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);