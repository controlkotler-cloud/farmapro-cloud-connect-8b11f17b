-- ============================================================================
-- Rebotica: entrega AUTOMÁTICA de premios (10-09-2026, D-day)
-- ----------------------------------------------------------------------------
-- Antes: open-reward creaba la apertura y el premio quedaba huérfano (nadie
-- llamaba a redeem-reward, no salía email, los créditos no se abonaban y todo
-- caducaba). Ahora un trigger AFTER INSERT en rebotica_openings entrega el
-- premio según su tipo, sin intervención humana:
--   - contenido (plantilla, masterclass)  -> canjeado al instante (el enlace va
--                                            en la descripción y en /rebotica)
--   - credito_ia                          -> canjeado al instante; el trigger
--                                            trg_rebotica_on_redeem abona créditos
--   - producto_propio "1 mes de Plus"     -> subscription_role='plus' 30 días
--                                            (columnas plan_comp_*; cron revierte)
--   - producto_propio "1 mes de Equipo"   -> subscription_role='equipo' 30 días
--   - servicio (consulta, radiografía,    -> canjeado al instante; el equipo lo
--     duda en newsletter)                    recibe en el digest diario (canjes)
--   - contenido "Recurso premium"         -> el canje es ELEGIR el recurso en
--                                            /recursos (RPC rebotica_unlock_resource)
--   - baúl y Gordo (peso 0)               -> no pasan por aquí: los adjudica
--                                            rebotica_cron_daily con aviso interno
-- En todos los casos el ganador recibe el email rebotica-premio-ganado.
-- Idempotente: se puede ejecutar varias veces.
-- ============================================================================

-- 1) Columnas nuevas ---------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_comp_until timestamptz,
  ADD COLUMN IF NOT EXISTS plan_comp_prev_role public.user_role;

COMMENT ON COLUMN public.profiles.plan_comp_until IS
  'Rebotica: fin del mes de Plus/Equipo regalado. rebotica_comp_expire() revierte el rol al pasar la fecha.';

ALTER TABLE public.rebotica_openings
  ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES public.resources(id),
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz,
  ADD COLUMN IF NOT EXISTS fulfil_note text;

-- 2) Las columnas de comp son sensibles: el usuario no puede tocarlas ---------
CREATE OR REPLACE FUNCTION public.block_unsafe_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.jwt() ->> 'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF is_current_user_admin() THEN
    PERFORM log_security_event(
      'admin_action',
      jsonb_build_object(
        'action', 'profile_update',
        'admin_user_id', auth.uid(),
        'target_user_id', NEW.id,
        'changes', jsonb_build_object(
          'old_subscription_role', OLD.subscription_role,
          'new_subscription_role', NEW.subscription_role,
          'old_subscription_status', OLD.subscription_status,
          'new_subscription_status', NEW.subscription_status,
          'old_role', OLD.role,
          'new_role', NEW.role
        )
      ),
      auth.uid()
    );
    RETURN NEW;
  END IF;

  IF auth.uid() != NEW.id THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify other users profiles';
  END IF;

  IF OLD.subscription_role IS DISTINCT FROM NEW.subscription_role
     OR OLD.subscription_status IS DISTINCT FROM NEW.subscription_status
     OR OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id
     OR OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at
     OR OLD.role IS DISTINCT FROM NEW.role
     OR OLD.plan_comp_until IS DISTINCT FROM NEW.plan_comp_until
     OR OLD.plan_comp_prev_role IS DISTINCT FROM NEW.plan_comp_prev_role THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify sensitive profile attributes';
  END IF;

  RETURN NEW;
END;
$function$;

-- 3) Textos de los premios: reflejan que la entrega es automática ------------
UPDATE public.rebotica_prizes SET descripcion =
  'Tres imágenes extra con IAFarma: carteles, posts y promos para tu farmacia. Ya están sumadas a tu saldo: entra en IAFarma y úsalas cuando quieras.'
  WHERE tipo = 'credito_ia' AND titulo ILIKE '3 créditos%';

UPDATE public.rebotica_prizes SET descripcion =
  'Elige un recurso premium del catálogo y es tuyo, sin ser Plus. Entra en Recursos, pulsa el recurso premium que quieras y confirma: queda desbloqueado para ti para siempre. Tienes 14 días para elegirlo.'
  WHERE tipo = 'contenido' AND titulo ILIKE 'Recurso premium%';

UPDATE public.rebotica_prizes SET descripcion =
  'Un mes entero del plan Plus, de regalo y sin compromiso: pruébalo todo. Ya está activado en tu cuenta durante 30 días, no tienes que hacer nada.'
  WHERE tipo = 'producto_propio' AND titulo ILIKE '1 mes de Plus%';

UPDATE public.rebotica_prizes SET descripcion =
  'Un mes del plan Equipo para ti y tu gente (hasta 10 personas), sin compromiso. Ya está activado en tu cuenta durante 30 días: invita a tu equipo desde Mi farmacia.'
  WHERE tipo = 'producto_propio' AND titulo ILIKE '1 mes de Equipo%';

UPDATE public.rebotica_prizes SET descripcion =
  'Videollamada de 15 minutos con nuestro director de estrategia para UNA consulta concreta de marketing o gestión. Alejandro te escribirá en los próximos días laborables para fijar día y hora; no tienes que hacer nada.'
  WHERE tipo = 'servicio' AND titulo ILIKE 'Consulta exprés%';

UPDATE public.rebotica_prizes SET descripcion =
  'Informe personalizado en PDF con capturas reales de tu presencia digital (Google, web, redes) y 3 acciones priorizadas. Hecho a mano por el equipo: lo recibirás por email en un plazo de 10 días laborables, sin que tengas que hacer nada.'
  WHERE tipo = 'servicio' AND titulo ILIKE 'Radiografía digital%';

UPDATE public.rebotica_prizes SET descripcion =
  'Nos mandas tu duda de gestión o marketing y la respondemos con nombre (o sin él, tú eliges) en la próxima edición de Impulso. Escríbela a alejandro@mkpro.es con el asunto «Mi duda de la Rebotica».'
  WHERE tipo = 'servicio' AND titulo ILIKE 'Tu duda%';

-- 4) Trigger de entrega automática -------------------------------------------
CREATE OR REPLACE FUNCTION public.rebotica_fulfil_opening()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_prize    record;
  v_prof     record;
  v_email    text;
  v_srk      text;
  v_url      text := 'https://jeysistgdajopfruqpbc.supabase.co/functions/v1/send-portal-email';
  v_auto     boolean := false;   -- true = queda canjeado al instante
  v_note     text := NULL;       -- se añade a la descripción en el email
  v_until    timestamptz;
  v_expires  timestamptz := NULL;
BEGIN
  -- Nunca romper la apertura: cualquier fallo se registra y se sigue.
  BEGIN
    -- El trigger de perfiles exige service_role para tocar el rol.
    PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);

    SELECT id, titulo, descripcion, tipo, tier INTO v_prize
      FROM public.rebotica_prizes WHERE id = NEW.prize_id;
    IF NOT FOUND THEN
      RETURN NEW;
    END IF;

    -- Premios de calendario: los adjudica el cron, no la apertura.
    IF v_prize.tipo = 'gordo' OR (v_prize.tipo = 'producto_propio' AND v_prize.titulo ILIKE '%baúl%') THEN
      RETURN NEW;
    END IF;

    SELECT email, full_name, subscription_role INTO v_prof
      FROM public.profiles WHERE id = NEW.user_id;
    SELECT u.email INTO v_email FROM auth.users u WHERE u.id = NEW.user_id;
    v_email := COALESCE(v_email, v_prof.email);

    IF v_prize.tipo = 'credito_ia' THEN
      v_auto := true;  -- trg_rebotica_on_redeem abona los créditos al canjear

    ELSIF v_prize.tipo = 'contenido' AND v_prize.titulo ILIKE 'Recurso premium%' THEN
      v_auto := false; -- el canje es elegir el recurso en /recursos
      v_expires := NEW.expires_at;

    ELSIF v_prize.tipo = 'contenido' THEN
      v_auto := true;  -- plantilla / masterclass: el enlace va en la descripción

    ELSIF v_prize.tipo = 'producto_propio' AND v_prize.titulo ILIKE '1 mes de Plus%' THEN
      v_auto := true;
      IF COALESCE(v_prof.subscription_role::text, 'freemium') = 'freemium' THEN
        v_until := now() + interval '30 days';
        UPDATE public.profiles
           SET plan_comp_prev_role = subscription_role,
               plan_comp_until = v_until,
               subscription_role = 'plus',
               updated_at = now()
         WHERE id = NEW.user_id;
        v_note := 'Plus activo hasta el ' || to_char(v_until AT TIME ZONE 'Europe/Madrid', 'DD-MM-YYYY') || '.';
      ELSE
        v_note := 'Tu cuenta ya tiene un plan de pago: escríbenos a alejandro@mkpro.es y te lo compensamos.';
      END IF;

    ELSIF v_prize.tipo = 'producto_propio' AND v_prize.titulo ILIKE '1 mes de Equipo%' THEN
      v_auto := true;
      IF COALESCE(v_prof.subscription_role::text, 'freemium') <> 'equipo' THEN
        v_until := now() + interval '30 days';
        UPDATE public.profiles
           SET plan_comp_prev_role = subscription_role,
               plan_comp_until = v_until,
               subscription_role = 'equipo',   -- trg_ensure_team_on_equipo_role crea el equipo
               updated_at = now()
         WHERE id = NEW.user_id;
        v_note := 'Equipo activo hasta el ' || to_char(v_until AT TIME ZONE 'Europe/Madrid', 'DD-MM-YYYY') || '.';
      ELSE
        v_note := 'Tu cuenta ya tiene el plan Equipo: escríbenos a alejandro@mkpro.es y te lo compensamos.';
      END IF;

    ELSIF v_prize.tipo = 'servicio' THEN
      v_auto := true;  -- lo cumple el equipo; aparece en el digest interno como canje

    ELSE
      v_auto := false;
      v_expires := NEW.expires_at;
    END IF;

    IF v_auto THEN
      UPDATE public.rebotica_openings
         SET redeemed_at = now(), fulfilled_at = now(), fulfil_note = v_note
       WHERE id = NEW.id AND redeemed_at IS NULL;
    ELSIF v_note IS NOT NULL THEN
      UPDATE public.rebotica_openings SET fulfil_note = v_note WHERE id = NEW.id;
    END IF;

    -- Email al ganador (cola transaccional del portal).
    SELECT decrypted_secret INTO v_srk FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key';
    IF v_srk IS NOT NULL AND v_email IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_srk),
        body := jsonb_build_object(
          'idempotency_key', 'rebotica-premio-ganado:' || NEW.id::text,
          'template', 'rebotica-premio-ganado',
          'to', v_email,
          'data', jsonb_build_object(
            'nombre', v_prof.full_name,
            'premioTitulo', v_prize.titulo,
            'premioDescripcion', trim(COALESCE(v_prize.descripcion, '') || ' ' || COALESCE(v_note, '')),
            'esPartner', false,
            'expiresAt', v_expires,
            'canjeUrl', 'https://portal.farmapro.es/rebotica'
          ),
          'meta', jsonb_build_object('trigger', 'rebotica_fulfil_opening', 'opening_id', NEW.id, 'prize_id', v_prize.id, 'tipo', v_prize.tipo)
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'rebotica_fulfil_opening: % (opening %)', SQLERRM, NEW.id;
  END;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.rebotica_fulfil_opening() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_rebotica_fulfil_opening ON public.rebotica_openings;
CREATE TRIGGER trg_rebotica_fulfil_opening
  AFTER INSERT ON public.rebotica_openings
  FOR EACH ROW EXECUTE FUNCTION public.rebotica_fulfil_opening();

-- 5) Fin del mes regalado: revertir el rol (cron diario 05:05 UTC) ----------
CREATE OR REPLACE FUNCTION public.rebotica_comp_expire()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  v_n integer := 0;
  v_paid_plan text;
BEGIN
  PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
  FOR r IN
    SELECT id, subscription_role, plan_comp_prev_role
      FROM public.profiles
     WHERE plan_comp_until IS NOT NULL AND plan_comp_until < now()
  LOOP
    -- ¿Ha contratado un plan de pago durante el regalo? Entonces manda Stripe.
    SELECT COALESCE(plan_id, plan_name) INTO v_paid_plan
      FROM public.subscriptions
     WHERE user_id = r.id AND status::text IN ('active', 'trialing')
     ORDER BY updated_at DESC LIMIT 1;

    IF v_paid_plan IS NOT NULL AND v_paid_plan = r.subscription_role::text THEN
      UPDATE public.profiles SET plan_comp_until = NULL, plan_comp_prev_role = NULL, updated_at = now() WHERE id = r.id;
    ELSE
      IF r.subscription_role = 'equipo' AND COALESCE(r.plan_comp_prev_role::text, 'freemium') <> 'equipo' THEN
        PERFORM public.deactivate_team_for_owner(r.id);
      END IF;
      UPDATE public.profiles
         SET subscription_role = COALESCE(v_paid_plan::public.user_role, r.plan_comp_prev_role, 'freemium'),
             plan_comp_until = NULL, plan_comp_prev_role = NULL, updated_at = now()
       WHERE id = r.id;
    END IF;
    v_n := v_n + 1;
  END LOOP;
  RETURN v_n;
END;
$function$;

REVOKE ALL ON FUNCTION public.rebotica_comp_expire() FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rebotica-comp-expire') THEN
    PERFORM cron.schedule('rebotica-comp-expire', '5 5 * * *', $cron$SELECT public.rebotica_comp_expire();$cron$);
  END IF;
END $$;

-- 6) RPC: mis premios (bypass de la RLS de rebotica_prizes tras cerrar campaña)
CREATE OR REPLACE FUNCTION public.rebotica_my_rewards()
RETURNS TABLE (
  opening_id uuid, campaign_id uuid, campaign_nombre text,
  opened_at timestamptz, redeemed_at timestamptz, expires_at timestamptz,
  fulfilled_at timestamptz, fulfil_note text,
  resource_id uuid, resource_title text,
  prize_id uuid, titulo text, descripcion text, tipo text, tier text,
  plan_comp_until timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT o.id, o.campaign_id, c.nombre,
         o.opened_at, o.redeemed_at, o.expires_at,
         o.fulfilled_at, o.fulfil_note,
         o.resource_id, r.title,
         p.id, p.titulo, p.descripcion, p.tipo, p.tier,
         pr.plan_comp_until
    FROM public.rebotica_openings o
    JOIN public.rebotica_prizes p ON p.id = o.prize_id
    JOIN public.rebotica_campaigns c ON c.id = o.campaign_id
    LEFT JOIN public.resources r ON r.id = o.resource_id
    LEFT JOIN public.profiles pr ON pr.id = o.user_id
   WHERE o.user_id = auth.uid()
   ORDER BY o.opened_at DESC;
$$;

REVOKE ALL ON FUNCTION public.rebotica_my_rewards() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rebotica_my_rewards() TO authenticated, service_role;

-- 7) RPC: canjear "Recurso premium desbloqueado" eligiendo el recurso ---------
CREATE OR REPLACE FUNCTION public.rebotica_unlock_resource(p_resource_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_opening uuid;
  v_res record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Necesitas iniciar sesión.';
  END IF;
  SELECT id, is_premium, is_published INTO v_res FROM public.resources WHERE id = p_resource_id;
  IF NOT FOUND OR NOT v_res.is_premium OR NOT v_res.is_published THEN
    RAISE EXCEPTION 'Ese recurso no es un recurso premium del catálogo.';
  END IF;

  -- Ya lo tenía desbloqueado: idempotente.
  SELECT o.id INTO v_opening FROM public.rebotica_openings o
   WHERE o.user_id = v_uid AND o.resource_id = p_resource_id LIMIT 1;
  IF FOUND THEN
    RETURN v_opening;
  END IF;

  SELECT o.id INTO v_opening
    FROM public.rebotica_openings o
    JOIN public.rebotica_prizes p ON p.id = o.prize_id
   WHERE o.user_id = v_uid
     AND p.tipo = 'contenido' AND p.titulo ILIKE 'Recurso premium%'
     AND o.resource_id IS NULL AND o.redeemed_at IS NULL
     AND (o.expires_at IS NULL OR o.expires_at > now())
   ORDER BY o.opened_at LIMIT 1
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tienes ningún premio de recurso premium pendiente de elegir.';
  END IF;

  UPDATE public.rebotica_openings
     SET resource_id = p_resource_id, redeemed_at = now(), fulfilled_at = now()
   WHERE id = v_opening;
  RETURN v_opening;
END;
$function$;

REVOKE ALL ON FUNCTION public.rebotica_unlock_resource(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rebotica_unlock_resource(uuid) TO authenticated, service_role;

-- 8) Storage: el recurso elegido se puede firmar/descargar sin ser Plus -------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'recursos_premium_rebotica_select') THEN
    CREATE POLICY recursos_premium_rebotica_select ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'recursos-premium'
        AND EXISTS (
          SELECT 1 FROM public.rebotica_openings o
          JOIN public.resources r ON r.id = o.resource_id
          WHERE o.user_id = auth.uid()
            AND r.file_url LIKE '%/recursos-premium/' || storage.objects.name
        )
      );
  END IF;
END $$;
