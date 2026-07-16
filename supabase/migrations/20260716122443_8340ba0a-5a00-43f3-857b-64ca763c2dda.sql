
-- 1) Log de avisos de fin de prueba (idempotencia)
CREATE TABLE IF NOT EXISTS public.portal_trial_notice_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('dia23','dia28')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);
GRANT SELECT ON public.portal_trial_notice_log TO authenticated;
GRANT ALL ON public.portal_trial_notice_log TO service_role;
ALTER TABLE public.portal_trial_notice_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trial_notice_log_admin_read" ON public.portal_trial_notice_log
  FOR SELECT TO authenticated USING (public.is_current_user_admin());

-- 2) Ampliar handle_new_user para disparar email de bienvenida vía pg_net.
--    Reusa el vault secret 'email_queue_service_role_key' ya configurado.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_texto_version text := NULLIF(trim(NEW.raw_user_meta_data->>'consent_texto_version'), '');
  v_accepted_at timestamptz := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'consent_accepted_at', '')::timestamptz,
    now()
  );
  v_nombre text := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_srk text;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, cif,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_page)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(trim(NEW.raw_user_meta_data->>'cif'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_source'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_medium'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_campaign'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_term'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_content'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'landing_page'), '')
  );

  IF (NEW.raw_user_meta_data->>'consent_rgpd') = 'true' AND v_texto_version IS NOT NULL THEN
    INSERT INTO public.consent_ledger (user_id, email, tipo, texto_version, accepted_at, source)
    VALUES (NEW.id, NEW.email, 'rgpd', v_texto_version, v_accepted_at, 'registro');
  END IF;

  IF (NEW.raw_user_meta_data->>'consent_comercial') = 'true' AND v_texto_version IS NOT NULL THEN
    INSERT INTO public.consent_ledger (user_id, email, tipo, texto_version, accepted_at, source)
    VALUES (NEW.id, NEW.email, 'comercial', v_texto_version, v_accepted_at, 'registro');
  END IF;

  -- Email de bienvenida (fire-and-forget). Nunca hace fallar el alta.
  BEGIN
    SELECT decrypted_secret INTO v_srk
      FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key';
    IF v_srk IS NOT NULL AND NEW.email IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://jeysistgdajopfruqpbc.supabase.co/functions/v1/send-portal-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_srk
        ),
        body := jsonb_build_object(
          'template', 'bienvenida',
          'to', NEW.email,
          'data', jsonb_build_object('nombre', v_nombre),
          'meta', jsonb_build_object('trigger', 'handle_new_user', 'user_id', NEW.id)
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user welcome email dispatch failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- 3) Función que envía los avisos de fin de prueba (día 23 y 28).
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
        WHERE s.user_id = u.id AND s.status IN ('active','trialing','past_due')
      )
  LOOP
    -- Idempotencia: inserta o salta si ya se envió.
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
