-- Programar la función para que se ejecute cada 12 horas (a las 09:00 y 21:00)
SELECT cron.schedule(
  'generate-daily-resource-morning',
  '0 9 * * *', -- Cada día a las 09:00 UTC
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
  '0 21 * * *', -- Cada día a las 21:00 UTC
  $$
  SELECT
    net.http_post(
        url:='https://fcqctkhvplmqukgosmya.supabase.co/functions/v1/generate-daily-resource',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);