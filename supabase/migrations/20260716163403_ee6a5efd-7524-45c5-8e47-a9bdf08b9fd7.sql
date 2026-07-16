
-- =====================================================================
-- rebotica_pick_and_consume_prize:
--   Selecciona un premio de la campaña, ponderado por `peso`, entre los
--   aptos para el tier del usuario ('todos' o igual al tier) con
--   stock_restante > 0, y decrementa stock atómicamente. Devuelve el
--   prize_id o NULL si no hay stock. Excluye tipo='gordo' (reservado al
--   sorteo de calendario).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rebotica_pick_and_consume_prize(
  p_campaign_id uuid,
  p_tier text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prize_id uuid;
  v_updated integer;
BEGIN
  IF p_tier NOT IN ('gratis','plus','equipo') THEN
    RAISE EXCEPTION 'invalid tier %', p_tier;
  END IF;

  -- Loop: elige candidato ponderado y decrementa; si perdió la carrera, reintenta.
  FOR i IN 1..8 LOOP
    SELECT id INTO v_prize_id
      FROM (
        SELECT id
          FROM public.rebotica_prizes
         WHERE campaign_id = p_campaign_id
           AND stock_restante > 0
           AND peso > 0
           AND tipo <> 'gordo'
           AND tier IN ('todos', p_tier)
         ORDER BY -ln(random()) / peso
         LIMIT 1
      ) s;

    IF v_prize_id IS NULL THEN
      RETURN NULL;
    END IF;

    UPDATE public.rebotica_prizes
       SET stock_restante = stock_restante - 1,
           updated_at = now()
     WHERE id = v_prize_id
       AND stock_restante > 0;
    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 1 THEN
      RETURN v_prize_id;
    END IF;
    -- si no, otro decrementó primero: reintenta
  END LOOP;

  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rebotica_pick_and_consume_prize(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rebotica_pick_and_consume_prize(uuid, text) TO service_role;

-- =====================================================================
-- rebotica_cron_daily: mantenimiento diario de campañas + avisos + sorteos.
-- Todos los emails se envían vía send-portal-email (pg_net + vault secret).
--   Temporada = '2026-otonio' (única activa hasta 30-11-2026). Ajustar
--   manualmente cuando arranquen nuevas.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.rebotica_cron_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
         -- no repetir aviso: usa portal_email_log como memoria
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

    -- Ganador de BAÚL: elegido al azar entre aperturas del mes natural,
    -- excluyendo a quien ya haya ganado baúl en la temporada.
    SELECT o.id AS opening_id, o.user_id, u.email, p.full_name, p.pharmacy_name
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
      -- Premio del baúl: primer premio 'partner_especie' con stock de la temporada; opcional.
      SELECT id, titulo, descripcion INTO v_prize_id, v_prize_titulo, v_prize_desc
        FROM public.rebotica_prizes
       WHERE tipo = 'partner_especie'
         AND stock_restante > 0
         AND peso = 0
       ORDER BY created_at DESC
       LIMIT 1;

      BEGIN
        INSERT INTO public.rebotica_calendar_draws
               (tipo, temporada, periodo, user_id, opening_id, prize_id, estado, meta)
        VALUES ('baul', v_temporada, v_periodo, v_ganador.user_id, v_ganador.opening_id,
                v_prize_id, 'pendiente',
                jsonb_build_object('email', v_ganador.email, 'nombre', v_ganador.full_name));

        IF v_prize_id IS NOT NULL THEN
          UPDATE public.rebotica_prizes
             SET stock_restante = GREATEST(0, stock_restante - 1), updated_at = now()
           WHERE id = v_prize_id;
        END IF;

        IF v_srk IS NOT NULL THEN
          -- Email al ganador
          PERFORM net.http_post(
            url := v_url,
            headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_srk),
            body := jsonb_build_object(
              'template','rebotica-baul-ganador',
              'to', v_ganador.email,
              'data', jsonb_build_object(
                'nombre', COALESCE(v_ganador.full_name, split_part(v_ganador.email,'@',1)),
                'mes', v_periodo,
                'temporada', v_temporada
              ),
              'meta', jsonb_build_object('trigger','rebotica_cron_daily','tipo','baul','periodo',v_periodo)
            )
          );
          -- Aviso interno alejandro + cc control
          PERFORM net.http_post(
            url := v_url,
            headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_srk),
            body := jsonb_build_object(
              'template','rebotica-aviso-calendario-interno',
              'to','alejandro@mkpro.es',
              'data', jsonb_build_object(
                'tipoSorteo','baul',
                'ganadorEmail', v_ganador.email,
                'ganadorNombre', v_ganador.full_name,
                'ganadorFarmacia', v_ganador.pharmacy_name,
                'temporada', v_temporada,
                'periodo', v_periodo,
                'premioTitulo', v_prize_titulo
              ),
              'meta', jsonb_build_object('trigger','rebotica_cron_daily','tipo','baul')
            )
          );
          PERFORM net.http_post(
            url := v_url,
            headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_srk),
            body := jsonb_build_object(
              'template','rebotica-aviso-calendario-interno',
              'to','control@mkpro.es',
              'data', jsonb_build_object(
                'tipoSorteo','baul',
                'ganadorEmail', v_ganador.email,
                'ganadorNombre', v_ganador.full_name,
                'ganadorFarmacia', v_ganador.pharmacy_name,
                'temporada', v_temporada,
                'periodo', v_periodo,
                'premioTitulo', v_prize_titulo
              ),
              'meta', jsonb_build_object('trigger','rebotica_cron_daily','tipo','baul','cc',true)
            )
          );
        END IF;
      EXCEPTION WHEN unique_violation THEN
        -- otro proceso ya lo insertó; nada que hacer
        NULL;
      END;
    END IF;

    -- 30-11: Gordo de la temporada
    IF v_today = DATE '2026-11-30' THEN
      SELECT o.id AS opening_id, o.user_id, u.email, p.full_name, p.pharmacy_name
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
                  jsonb_build_object('email', v_ganador.email, 'nombre', v_ganador.full_name));

          IF v_prize_id IS NOT NULL THEN
            UPDATE public.rebotica_prizes
               SET stock_restante = GREATEST(0, stock_restante - 1), updated_at = now()
             WHERE id = v_prize_id;
          END IF;

          IF v_srk IS NOT NULL THEN
            -- Email al ganador (SIN detalles del premio)
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
            -- Avisos internos (alejandro + control)
            PERFORM net.http_post(
              url := v_url,
              headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_srk),
              body := jsonb_build_object(
                'template','rebotica-aviso-calendario-interno',
                'to','alejandro@mkpro.es',
                'data', jsonb_build_object(
                  'tipoSorteo','gordo',
                  'ganadorEmail', v_ganador.email,
                  'ganadorNombre', v_ganador.full_name,
                  'ganadorFarmacia', v_ganador.pharmacy_name,
                  'temporada', v_temporada,
                  'premioTitulo', v_prize_titulo
                ),
                'meta', jsonb_build_object('trigger','rebotica_cron_daily','tipo','gordo')
              )
            );
            PERFORM net.http_post(
              url := v_url,
              headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_srk),
              body := jsonb_build_object(
                'template','rebotica-aviso-calendario-interno',
                'to','control@mkpro.es',
                'data', jsonb_build_object(
                  'tipoSorteo','gordo',
                  'ganadorEmail', v_ganador.email,
                  'ganadorNombre', v_ganador.full_name,
                  'ganadorFarmacia', v_ganador.pharmacy_name,
                  'temporada', v_temporada,
                  'premioTitulo', v_prize_titulo
                ),
                'meta', jsonb_build_object('trigger','rebotica_cron_daily','tipo','gordo','cc',true)
              )
            );
          END IF;
        EXCEPTION WHEN unique_violation THEN
          NULL;
        END;
      END IF;
    END IF;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rebotica_cron_daily() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rebotica_cron_daily() TO service_role;
