
CREATE OR REPLACE FUNCTION public.notify_trial_ending()
 RETURNS TABLE(user_id uuid, kind text, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  r record;
  v_srk text;
BEGIN
  SELECT decrypted_secret INTO v_srk
    FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key';

  FOR r IN
    SELECT
      u.id AS uid,
      u.email,
      p.full_name,
      CASE
        WHEN date(u.created_at AT TIME ZONE 'UTC') = (current_date - 23) THEN 'dia23'
        WHEN date(u.created_at AT TIME ZONE 'UTC') = (current_date - 28) THEN 'dia28'
      END AS k
    FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE date(u.created_at AT TIME ZONE 'UTC') IN (current_date - 23, current_date - 28)
      AND u.email IS NOT NULL
      AND COALESCE(p.subscription_role::text, 'freemium') NOT IN ('plus','equipo','premium','profesional','admin','estudiante')
      AND NOT EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.user_id = u.id AND s.status::text IN ('active','trialing')
      )
  LOOP
    BEGIN
      INSERT INTO public.portal_trial_notice_log (user_id, kind)
      VALUES (r.uid, r.k);
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;

    IF v_srk IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://jeysistgdajopfruqpbc.supabase.co/functions/v1/send-portal-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_srk
        ),
        body := jsonb_build_object(
          'template', 'fin-prueba',
          'to', r.email,
          'data', jsonb_build_object(
            'nombre', COALESCE(r.full_name, split_part(r.email, '@', 1)),
            'aviso', CASE WHEN r.k = 'dia28' THEN 'ultimo' ELSE 'primero' END,
            'diasRestantes', CASE WHEN r.k = 'dia28' THEN 2 ELSE 7 END
          ),
          'meta', jsonb_build_object('trigger', 'notify_trial_ending', 'kind', r.k, 'user_id', r.uid)
        )
      );
    END IF;

    user_id := r.uid; kind := r.k; email := r.email; RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_trial_ending() FROM public, anon, authenticated;
