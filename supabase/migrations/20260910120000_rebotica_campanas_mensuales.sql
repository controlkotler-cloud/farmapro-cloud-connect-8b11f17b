-- =====================================================================
-- Rebotica: campañas MENSUALES (decisión Francesc 10-09-2026).
-- Ya EJECUTADA en producción el 10-09-2026 vía query_database (las migraciones
-- no se auto-aplican). Idempotente: se puede re-ejecutar sin efecto.
--
-- - Bienvenida = solo septiembre (10-09 → 30-09). Antes llegaba al 30-11.
-- - "Cajón de octubre" 01-10 → 31-10, activa, con los 9 premios sorteables
--   (peso > 0) clonados de Bienvenida y stock a tope. Baúl y Gordo (peso 0) NO
--   se clonan: son premios de temporada y el cron los busca por peso/tipo.
-- - Noviembre NO se crea aquí ("solo abre el de octubre"): SQL listo en
--   contenido/2026-11-cajon-noviembre.sql, ejecutar antes del 01-11.
-- - rebotica_cron_daily(): los sorteos pasan del último día del mes (07:00,
--   dejaba fuera a quien abría ese día) al DÍA 1 del mes siguiente sobre el mes
--   anterior completo: Baúl 01-10 / 01-11 / 01-12, Gordo 01-12.
-- =====================================================================

UPDATE public.rebotica_campaigns
   SET quincena_fin = DATE '2026-09-30', updated_at = now()
 WHERE id = '8bac0c59-3877-46ae-b7c3-d878a01477ec'
   AND quincena_fin <> DATE '2026-09-30';

INSERT INTO public.rebotica_campaigns (id, nombre, quincena_inicio, quincena_fin, estado, skin, tema)
VALUES ('1f0a0c70-b3e1-4c1a-9a01-202610010000', 'Cajón de octubre · Temporada 1',
        DATE '2026-10-01', DATE '2026-10-31', 'activa', 'cajonera',
        'Cajón mensual: cada usuario abre un cajón nuevo en octubre')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.rebotica_prizes
       (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur,
        stock_total, stock_restante, peso, caducidad_dias, partner_id, incomprable)
SELECT '1f0a0c70-b3e1-4c1a-9a01-202610010000', p.titulo, p.descripcion, p.tipo, p.tier,
       p.valor_percibido_eur, p.stock_total, p.stock_total, p.peso, p.caducidad_dias,
       p.partner_id, p.incomprable
  FROM public.rebotica_prizes p
 WHERE p.campaign_id = '8bac0c59-3877-46ae-b7c3-d878a01477ec'
   AND p.peso > 0
   AND NOT EXISTS (
     SELECT 1 FROM public.rebotica_prizes q
      WHERE q.campaign_id = '1f0a0c70-b3e1-4c1a-9a01-202610010000' AND q.titulo = p.titulo
   );

-- ---------------------------------------------------------------------
-- Cron diario (versión en producción desde el 10-09-2026, obtenida con
-- pg_get_functiondef tras el cambio).
-- ---------------------------------------------------------------------
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
  v_mes_ini timestamptz;
  v_mes_fin timestamptz;
  v_url text := 'https://jeysistgdajopfruqpbc.supabase.co/functions/v1/send-portal-email';
  v_dest text;
BEGIN
  SELECT decrypted_secret INTO v_srk
    FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key';

  UPDATE public.rebotica_campaigns
     SET estado = 'activa', updated_at = now()
   WHERE estado = 'draft'
     AND quincena_inicio <= v_today
     AND quincena_fin >= v_today;

  UPDATE public.rebotica_campaigns
     SET estado = 'cerrada', updated_at = now()
   WHERE estado = 'activa'
     AND quincena_fin < v_today;

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

  -- Sorteos de calendario (cambio 10-09-2026): se sortean el DÍA 1 del mes
  -- siguiente sobre las aperturas del mes anterior completo, para que quien
  -- abre el último día también entre (antes se sorteaba el día 30/31 a las 07:00).
  -- Baúl: 01-10 (sept), 01-11 (oct), 01-12 (nov). Gordo: 01-12 (toda la temporada).
  IF v_today = date_trunc('month', v_today)::date
     AND v_today BETWEEN DATE '2026-10-01' AND DATE '2026-12-01' THEN

    v_mes_fin := date_trunc('month', v_today);
    v_mes_ini := v_mes_fin - interval '1 month';
    v_periodo := to_char(v_mes_ini, 'YYYY-MM');

    SELECT o.id AS opening_id, o.user_id, u.email, p.full_name, p.pharmacy_name, p.pharmacy_city
      INTO v_ganador
      FROM public.rebotica_openings o
      JOIN auth.users u ON u.id = o.user_id
      JOIN public.profiles p ON p.id = o.user_id
     WHERE o.opened_at >= v_mes_ini
       AND o.opened_at <  v_mes_fin
       AND u.email IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.rebotica_calendar_draws d
          WHERE d.tipo = 'baul' AND d.temporada = v_temporada AND d.user_id = o.user_id
       )
       AND NOT EXISTS (
         SELECT 1 FROM public.rebotica_calendar_draws d
          WHERE d.tipo = 'baul' AND d.temporada = v_temporada AND d.periodo = v_periodo
       )
     ORDER BY random()
     LIMIT 1;

    IF v_ganador.user_id IS NOT NULL THEN
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

    IF v_today = DATE '2026-12-01' THEN
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
         AND NOT EXISTS (
           SELECT 1 FROM public.rebotica_calendar_draws d
            WHERE d.tipo = 'gordo' AND d.temporada = v_temporada
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