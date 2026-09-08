-- 08-09-2026. El email de bienvenida salía en el INSERT de auth.users, es decir,
-- ANTES de que el usuario confirmara su correo (lo vio Francesc al crear una
-- cuenta free: le llegaron a la vez el de confirmar y el de bienvenida).
--
-- Ahora la bienvenida se envía cuando email_confirmed_at pasa de NULL a fecha.
-- Las altas que ya llegan confirmadas (OAuth Google, invitaciones aceptadas
-- con auto-confirm) la reciben en el INSERT como hasta ahora.
--
-- Idempotente: se puede ejecutar varias veces. Ejecutar a mano con
-- query_database (el fichero en el repo NO se aplica solo).

-- 1) Envío compartido, nunca hace fallar la operación de auth que lo dispara.
CREATE OR REPLACE FUNCTION public.send_welcome_email(p_user_id uuid, p_email text, p_nombre text, p_trigger text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_srk text;
BEGIN
  SELECT decrypted_secret INTO v_srk
    FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key';
  IF v_srk IS NOT NULL AND p_email IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://jeysistgdajopfruqpbc.supabase.co/functions/v1/send-portal-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_srk
      ),
      body := jsonb_build_object(
        'template', 'bienvenida',
        'to', p_email,
        'data', jsonb_build_object('nombre', p_nombre),
        'meta', jsonb_build_object('trigger', p_trigger, 'user_id', p_user_id)
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'send_welcome_email (%) failed: %', p_trigger, SQLERRM;
END;
$function$;

-- 2) handle_new_user: igual que antes salvo que la bienvenida solo sale si el
--    alta ya llega confirmada.
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
  v_tiene_rgpd boolean := (NEW.raw_user_meta_data->>'consent_rgpd') = 'true' AND v_texto_version IS NOT NULL;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, cif,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_page)
  VALUES (
    NEW.id,
    NEW.email,
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

  IF v_tiene_rgpd THEN
    INSERT INTO public.consent_ledger (user_id, email, tipo, texto_version, accepted_at, source)
    VALUES (NEW.id, NEW.email, 'rgpd', v_texto_version, v_accepted_at, 'registro');
  ELSE
    -- C15: si un alta no pasa por el formulario (invitación, alta programática,
    -- OAuth) antes no quedaba NINGUN rastro y el hueco era invisible. Ahora se
    -- documenta el hueco en el propio ledger. No es un consentimiento: es la
    -- prueba de que falta y hay que recabarlo.
    INSERT INTO public.consent_ledger (user_id, email, tipo, texto_version, accepted_at, source)
    VALUES (NEW.id, NEW.email, 'rgpd_pendiente', COALESCE(v_texto_version, 'sin_formulario'), v_accepted_at, 'alta_sin_formulario');
  END IF;

  IF (NEW.raw_user_meta_data->>'consent_comercial') = 'true' AND v_texto_version IS NOT NULL THEN
    INSERT INTO public.consent_ledger (user_id, email, tipo, texto_version, accepted_at, source)
    VALUES (NEW.id, NEW.email, 'comercial', v_texto_version, v_accepted_at, 'registro');
  END IF;

  -- Bienvenida solo si el alta ya llega confirmada (OAuth). El resto la recibe
  -- al confirmar el correo (trigger on_auth_user_confirmed).
  IF NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM public.send_welcome_email(NEW.id, NEW.email, v_nombre, 'handle_new_user');
  END IF;

  RETURN NEW;
END;
$function$;

-- 3) Bienvenida al confirmar el correo.
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_nombre text;
BEGIN
  SELECT COALESCE(NULLIF(trim(p.full_name), ''), split_part(NEW.email, '@', 1))
    INTO v_nombre
    FROM public.profiles p WHERE p.id = NEW.id;
  PERFORM public.send_welcome_email(
    NEW.id, NEW.email,
    COALESCE(v_nombre, split_part(NEW.email, '@', 1)),
    'handle_user_email_confirmed'
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_user_email_confirmed();
