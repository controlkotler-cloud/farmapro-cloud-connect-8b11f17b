-- ============================================================================
-- Rebotica · 01-09-2026 · EL BAÚL pasa a "desayuno dulce sorpresa" + digest interno
-- ----------------------------------------------------------------------------
-- Decisión Francesc 01-09-2026: El Baúl = un desayuno dulce para el equipo de
-- la farmacia ganadora, sin personalizaciones, solo una tarjeta, y NO se
-- comunica al ganador (llega por sorpresa a la farmacia).
--
-- Cambios (idempotentes):
--  1. Fila del premio "El baúl de la Rebotica": descripción y valor.
--  2. rebotica_cron_daily():
--     - el premio del baúl se busca por peso = 0 y tipo <> 'gordo' (antes
--       exigía tipo = 'partner_especie' y la fila real es 'producto_propio',
--       así que el sorteo quedaba sin prize_id y sin descontar stock);
--     - se ELIMINA el email al ganador del baúl (sorpresa);
--     - los avisos internos llevan la ciudad de la farmacia.
--  3. rebotica_digest_interno(): resumen diario a alejandro@ + control@ con
--     las aperturas y canjes de las últimas 24 h (el canje es manual: nadie
--     recibía aviso). Plantilla 'rebotica-digest-interno' en _shared.
--  4. Cron: rebotica-cron-daily pasa a 05:00 UTC (07:00 Madrid) para que la
--     campaña del D-day esté activa antes del email de las 08:00;
--     rebotica-digest-interno a 05:15 UTC.
-- ============================================================================

-- 1. Premio -------------------------------------------------------------------
UPDATE public.rebotica_prizes
   SET descripcion = 'Un desayuno dulce para todo el equipo de la farmacia, que llega una mañana sin avisar. Sin más adorno que una tarjeta de la Rebotica.',
       valor_percibido_eur = 45,
       updated_at = now()
 WHERE titulo = 'El baúl de la Rebotica';

-- 2. Cron diario ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rebotica_cron_daily()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_srk text;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_temporada text := '2026-otonio';
  r record;
  v_prize_id uuid;
  v_prize_titulo text;
  v_prize_desc text;
  v_ganador record;
  v_periodo text;
  v_url text := 'https://jeysistgdajopfruqpbc.supabase.co/functions/v1/send-portal-email';
  v_dest text;
BEGIN
  SELECT decrypted_secret INTO v_srk
    FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key';

  -- (a) activar campañas cuya fecha llega, cerrar las vencidas
  UPDATE public.rebotica_campaigns
     SET estado = 'activa', updated_at = now()
   WHERE estado = 'draft'
     AND quincena_inicio <= v_today
     AND quincena_fin >= v_today;

  UPDATE public.rebotica_campaigns
     SET estado = 'cerrada', updated_at = now()
   WHERE estado = 'activa'
     AND quincena_fin < v_today;

  -- (b) aviso 48h de premios pendientes de canje
  IF v_srk IS NOT NULL THEN
    FOR r IN
      SELECT o.id AS opening_id, o.expires_at, u.email, p.full_name,
             pr.titulo AS premio_titulo
        FROM public.rebotica_openings o
        JOIN auth.users u ON u.id = o.user_id
        JOIN public.profiles p ON p.id = o.user_id
        JOIN public.rebotica_prizes pr ON pr.id = o.prize_id
       WHERE o.redeemed_at IS NULL
         AND o.expires_at > now()
         AND o.expires_at <= now() + interval '48 hours'
         AND u.email IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM public.portal_email_log l
            WHERE l.template = 'rebotica-premio-caduca'
              AND l.recipient = u.email
              AND (l.meta->>'opening_id') = o.id::text
              AND l.status = 'ok'
         )
    LOOP
      PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_srk),
        body := jsonb_build_object(
          'template','rebotica-premio-caduca',
          'to', r.email,
          'data', jsonb_build_object(
            'nombre', COALESCE(r.full_name, split_part(r.email,'@',1)),
            'premioTitulo', r.premio_titulo,
            'expiresAt', to_char(r.expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
            'horasRestantes', GREATEST(1, EXTRACT(EPOCH FROM (r.expires_at - now()))::int / 3600)
          ),
          'meta', jsonb_build_object('trigger','rebotica_cron_daily','opening_id', r.opening_id)
        )
      );
    END LOOP;
  END IF;

  -- (c) SORTEOS DE CALENDARIO ------------------------------------------------
  -- Último día de mes (30-09 / 31-10 / 30-11): baúl del mes.
  -- 30-11: además Gordo de la temporada.
  IF v_today = (date_trunc('month', v_today) + interval '1 month - 1 day')::date
     AND v_today BETWEEN DATE '2026-09-30' AND DATE '2026-11-30' THEN

    v_periodo := to_char(v_today, 'YYYY-MM');

    -- Ganador de BAÚL: al azar entre aperturas del mes natural,
    -- excluyendo a quien ya haya ganado baúl en la temporada.
    SELECT o.id AS opening_id, o.user_id, u.email, p.full_name, p.pharmacy_name, p.pharmacy_city
      INTO v_ganador
      FROM public.rebotica_openings o
      JOIN auth.users u ON u.id = o.user_id
      JOIN public.profiles p ON p.id = o.user_id
     WHERE o.opened_at >= date_trunc('month', v_today)
       AND o.opened_at <  date_trunc('month', v_today) + interval '1 month'
       AND u.email IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.rebotica_calendar_draws d
          WHERE d.tipo = 'baul' AND d.temporada = v_temporada AND d.user_id = o.user_id
       )
     ORDER BY random()
     LIMIT 1;

    IF v_ganador.user_id IS NOT NULL THEN
      -- Premio del baúl: el premio de calendario (peso 0) que no sea el Gordo, con stock.
      SELECT id, titulo, descripcion INTO v_prize_id, v_prize_titulo, v_prize_desc
        FROM public.rebotica_prizes
       WHERE peso = 0
         AND tipo <> 'gordo'
         AND stock_restante > 0
       ORDER BY created_at DESC
       LIMIT 1;

      BEGIN
        INSERT INTO public.rebotica_calendar_draws
               (tipo, temporada, periodo, user_id, opening_id, prize_id, estado, meta)
        VALUES ('baul', v_temporada, v_periodo, v_ganador.user_id, v_ganador.opening_id,
                v_prize_id, 'pendiente',
                jsonb_build_object('email', v_ganador.email, 'nombre', v_ganador.full_name,
                                   'farmacia', v_ganador.pharmacy_name, 'ciudad', v_ganador.pharmacy_city));

        IF v_prize_id IS NOT NULL THEN
          UPDATE public.rebotica_prizes
             SET stock_restante = GREATEST(0, stock_restante - 1), updated_at = now()
           WHERE id = v_prize_id;
        END IF;

        -- SORPRESA (01-09-2026): NO se avisa al ganador. Solo avisos internos.
        IF v_srk IS NOT NULL THEN
          FOREACH v_dest IN ARRAY ARRAY['alejandro@mkpro.es','control@mkpro.es'] LOOP
            PERFORM net.http_post(
              url := v_url,
              headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_srk),
              body := jsonb_build_object(
                'template','rebotica-aviso-calendario-interno',
                'to', v_dest,
                'data', jsonb_build_object(
                  'tipoSorteo','baul',
                  'ganadorEmail', v_ganador.email,
                  'ganadorNombre', v_ganador.full_name,
                  'ganadorFarmacia', v_ganador.pharmacy_name,
                  'ganadorCiudad', v_ganador.pharmacy_city,
                  'temporada', v_temporada,
                  'periodo', v_periodo,
                  'premioTitulo', v_prize_titulo
                ),
                'meta', jsonb_build_object('trigger','rebotica_cron_daily','tipo','baul','periodo',v_periodo,'cc', v_dest = 'control@mkpro.es')
              )
            );
          END LOOP;
        END IF;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END IF;

    -- 30-11: Gordo de la temporada
    IF v_today = DATE '2026-11-30' THEN
      SELECT o.id AS opening_id, o.user_id, u.email, p.full_name, p.pharmacy_name, p.pharmacy_city
        INTO v_ganador
        FROM public.rebotica_openings o
        JOIN auth.users u ON u.id = o.user_id
        JOIN public.profiles p ON p.id = o.user_id
       WHERE u.email IS NOT NULL
         AND o.opened_at >= DATE '2026-09-01'
         AND o.opened_at <  DATE '2026-12-01'
         AND NOT EXISTS (
           SELECT 1 FROM public.rebotica_calendar_draws d
            WHERE d.temporada = v_temporada AND d.user_id = o.user_id
         )
       ORDER BY random()
       LIMIT 1;

      IF v_ganador.user_id IS NOT NULL THEN
        SELECT id, titulo, descripcion INTO v_prize_id, v_prize_titulo, v_prize_desc
          FROM public.rebotica_prizes
         WHERE tipo = 'gordo'
           AND stock_restante > 0
         ORDER BY created_at DESC
         LIMIT 1;

        BEGIN
          INSERT INTO public.rebotica_calendar_draws
                 (tipo, temporada, periodo, user_id, opening_id, prize_id, estado, meta)
          VALUES ('gordo', v_temporada, v_temporada, v_ganador.user_id, v_ganador.opening_id,
                  v_prize_id, 'pendiente',
                  jsonb_build_object('email', v_ganador.email, 'nombre', v_ganador.full_name,
                                     'farmacia', v_ganador.pharmacy_name, 'ciudad', v_ganador.pharmacy_city));

          IF v_prize_id IS NOT NULL THEN
            UPDATE public.rebotica_prizes
               SET stock_restante = GREATEST(0, stock_restante - 1), updated_at = now()
             WHERE id = v_prize_id;
          END IF;

          IF v_srk IS NOT NULL THEN
            -- Email al ganador (SIN detalles del premio: Alejandro le llama)
            PERFORM net.http_post(
              url := v_url,
              headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_srk),
              body := jsonb_build_object(
                'template','rebotica-gordo-ganador',
                'to', v_ganador.email,
                'data', jsonb_build_object(
                  'nombre', COALESCE(v_ganador.full_name, split_part(v_ganador.email,'@',1))
                ),
                'meta', jsonb_build_object('trigger','rebotica_cron_daily','tipo','gordo')
              )
            );
            FOREACH v_dest IN ARRAY ARRAY['alejandro@mkpro.es','control@mkpro.es'] LOOP
              PERFORM net.http_post(
                url := v_url,
                headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_srk),
                body := jsonb_build_object(
                  'template','rebotica-aviso-calendario-interno',
                  'to', v_dest,
                  'data', jsonb_build_object(
                    'tipoSorteo','gordo',
                    'ganadorEmail', v_ganador.email,
                    'ganadorNombre', v_ganador.full_name,
                    'ganadorFarmacia', v_ganador.pharmacy_name,
                    'ganadorCiudad', v_ganador.pharmacy_city,
                    'temporada', v_temporada,
                    'premioTitulo', v_prize_titulo
                  ),
                  'meta', jsonb_build_object('trigger','rebotica_cron_daily','tipo','gordo','cc', v_dest = 'control@mkpro.es')
                )
              );
            END LOOP;
          END IF;
        EXCEPTION WHEN unique_violation THEN
          NULL;
        END;
      END IF;
    END IF;
  END IF;
END;
$function$;

-- 3. Digest interno diario -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rebotica_digest_interno()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_srk text;
  v_url text := 'https://jeysistgdajopfruqpbc.supabase.co/functions/v1/send-portal-email';
  v_desde timestamptz := now() - interval '24 hours';
  v_aperturas int := 0;
  v_canjes jsonb := '[]'::jsonb;
  v_pendientes jsonb := '[]'::jsonb;
  v_dest text;
BEGIN
  SELECT decrypted_secret INTO v_srk
    FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key';
  IF v_srk IS NULL THEN
    RETURN;
  END IF;

  -- Aperturas de las últimas 24 h
  SELECT count(*) INTO v_aperturas
    FROM public.rebotica_openings
   WHERE opened_at >= v_desde;

  -- Canjes de las últimas 24 h (esto es lo que hay que cumplir a mano)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'email', u.email,
           'nombre', p.full_name,
           'farmacia', p.pharmacy_name,
           'ciudad', p.pharmacy_city,
           'premio', pr.titulo,
           'tipo', pr.tipo,
           'cuando', to_char(o.redeemed_at AT TIME ZONE 'Europe/Madrid', 'DD-MM HH24:MI')
         ) ORDER BY o.redeemed_at DESC), '[]'::jsonb)
    INTO v_canjes
    FROM public.rebotica_openings o
    JOIN auth.users u ON u.id = o.user_id
    JOIN public.profiles p ON p.id = o.user_id
    JOIN public.rebotica_prizes pr ON pr.id = o.prize_id
   WHERE o.redeemed_at >= v_desde;

  -- Premios abiertos y aún sin canjear (para saber qué está en el aire)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'email', u.email,
           'premio', pr.titulo,
           'caduca', to_char(o.expires_at AT TIME ZONE 'Europe/Madrid', 'DD-MM')
         ) ORDER BY o.expires_at), '[]'::jsonb)
    INTO v_pendientes
    FROM public.rebotica_openings o
    JOIN auth.users u ON u.id = o.user_id
    JOIN public.rebotica_prizes pr ON pr.id = o.prize_id
   WHERE o.redeemed_at IS NULL
     AND o.expires_at > now();

  -- Sin actividad: no se manda nada
  IF v_aperturas = 0 AND jsonb_array_length(v_canjes) = 0 THEN
    RETURN;
  END IF;

  FOREACH v_dest IN ARRAY ARRAY['alejandro@mkpro.es','control@mkpro.es'] LOOP
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_srk),
      body := jsonb_build_object(
        'template', 'rebotica-digest-interno',
        'to', v_dest,
        'data', jsonb_build_object(
          'fecha', to_char(now() AT TIME ZONE 'Europe/Madrid', 'DD-MM-YYYY'),
          'aperturas', v_aperturas,
          'canjes', v_canjes,
          'pendientes', v_pendientes
        ),
        'meta', jsonb_build_object('trigger', 'rebotica_digest_interno', 'cc', v_dest = 'control@mkpro.es')
      )
    );
  END LOOP;
END;
$function$;

-- 4. Crons ---------------------------------------------------------------------
-- rebotica-cron-daily: 06:30 UTC → 05:00 UTC (07:00 Madrid), antes del email del D-day.
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'rebotica-cron-daily'),
  schedule := '0 5 * * *'
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rebotica-digest-interno') THEN
    PERFORM cron.schedule('rebotica-digest-interno', '15 5 * * *', 'SELECT public.rebotica_digest_interno();');
  END IF;
END $$;

-- Comprobación
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'rebotica%';
-- SELECT titulo, tipo, peso, stock_restante, valor_percibido_eur, descripcion FROM rebotica_prizes WHERE peso = 0;
