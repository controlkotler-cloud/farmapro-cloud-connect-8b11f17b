-- =====================================================================
-- RELANZAMIENTO 07-14/01/2027: medición + Rebotica diciembre y enero
-- Idempotente: relanzable sin duplicar. NO se ejecuta sola (push != migración):
-- aplicar a mano con query_database.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1b. Contadores de recursos
-- Columna canónica de descargas: resources.download_count (la que ya
-- leen/escriben las edge functions). resources.downloads_count queda OBSOLETA
-- (no se borra): se sincroniza una vez y no se vuelve a usar.
-- ---------------------------------------------------------------------
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

UPDATE public.resources
   SET download_count = GREATEST(COALESCE(download_count, 0), downloads_count)
 WHERE COALESCE(download_count, 0) < downloads_count;

COMMENT ON COLUMN public.resources.downloads_count IS
  'OBSOLETA (07-11-2026). Usar download_count. Se conserva por compatibilidad, no se escribe.';
COMMENT ON COLUMN public.resources.download_count IS
  'Contador canónico de descargas. Se incrementa con track_resource_download().';
COMMENT ON COLUMN public.resources.view_count IS
  'Veces que se abrió la ficha del recurso (1 por recurso y sesión). Se incrementa con track_resource_view().';

CREATE OR REPLACE FUNCTION public.track_resource_download(p_resource_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.resources
     SET download_count = COALESCE(download_count, 0) + 1
   WHERE id = p_resource_id;
$$;

CREATE OR REPLACE FUNCTION public.track_resource_view(p_resource_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.resources
     SET view_count = view_count + 1
   WHERE id = p_resource_id;
$$;

REVOKE ALL ON FUNCTION public.track_resource_download(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_resource_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_resource_download(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.track_resource_view(uuid) TO authenticated, anon;

-- ---------------------------------------------------------------------
-- 2. Rebotica: campañas de diciembre 2026 y enero 2027 (draft)
-- Estructura copiada de noviembre (1f0a0c70-...-202611010000).
-- El cron las pasa a 'activa' solo el día de inicio y a 'cerrada' al acabar.
-- ---------------------------------------------------------------------
INSERT INTO public.rebotica_campaigns
  (id, nombre, quincena_inicio, quincena_fin, estado, tema, skin)
SELECT v.id, v.nombre, v.ini, v.fin, 'draft', v.tema, n.skin
  FROM public.rebotica_campaigns n,
       (VALUES
         ('1f0a0c70-b3e1-4c1a-9a01-202612010000'::uuid,
          'Cajón de diciembre · Temporada 1',
          DATE '2026-12-01', DATE '2026-12-31',
          'Cajón mensual: cada usuario abre un cajón nuevo en diciembre'),
         ('1f0a0c70-b3e1-4c1a-9a01-202701010000'::uuid,
          'Cajón de enero · Temporada 2',
          DATE '2027-01-01', DATE '2027-01-31',
          'Cajón mensual: cada usuario abre un cajón nuevo en enero')
       ) AS v(id, nombre, ini, fin, tema)
 WHERE n.id = '1f0a0c70-b3e1-4c1a-9a01-202611010000'
ON CONFLICT (id) DO NOTHING;

-- Los 9 premios de noviembre, mismos tipo, tier, peso, stock y caducidad,
-- con id determinista (md5 de campaña + título). Stock restante = stock total.
INSERT INTO public.rebotica_prizes
  (id, campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur,
   stock_total, stock_restante, peso, caducidad_dias, partner_id, incomprable)
SELECT md5('rebotica-prize-' || c.id::text || '-' || p.titulo)::uuid,
       c.id, p.titulo, p.descripcion, p.tipo, p.tier, p.valor_percibido_eur,
       p.stock_total, p.stock_total, p.peso, p.caducidad_dias, p.partner_id, p.incomprable
  FROM public.rebotica_prizes p
  CROSS JOIN public.rebotica_campaigns c
 WHERE p.campaign_id = '1f0a0c70-b3e1-4c1a-9a01-202611010000'
   AND c.id IN ('1f0a0c70-b3e1-4c1a-9a01-202612010000',
                '1f0a0c70-b3e1-4c1a-9a01-202701010000')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- rebotica_cron_daily: temporada y sorteos con los meses nuevos.
-- Cambios respecto a la versión en producción (07-11-2026):
--   * v_temporada: '2026-otonio' hasta el 01-12-2026 (incluido, ahí se sortea el
--     Baúl de noviembre y el Gordo, cierre de temporada); desde el 01-01-2027,
--     '2027-invierno' (Baúl de diciembre el 01-01 y Baúl de enero el 01-02).
--   * La ventana de sorteos llega hasta 2027-02-01 (antes 2026-12-01).
--   * El Gordo sigue SOLO el 2026-12-01, sobre las aperturas sep-nov.
-- El resto es idéntico.
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
  v_temporada text := CASE WHEN (now() AT TIME ZONE 'UTC')::date <= DATE '2026-12-01'
                           THEN '2026-otonio' ELSE '2027-invierno' END;
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

  -- Sorteos de calendario: el DÍA 1 del mes siguiente sobre las aperturas del mes anterior.
  -- Baúl: 01-10 (sept), 01-11 (oct), 01-12 (nov), 01-01-2027 (dic), 01-02-2027 (ene).
  -- Gordo: 01-12-2026 (toda la temporada otoño).
  IF v_today = date_trunc('month', v_today)::date
     AND v_today BETWEEN DATE '2026-10-01' AND DATE '2027-02-01' THEN

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

-- ---------------------------------------------------------------------
-- 1c. Errores de email (statement timeout): NO se arregla aquí.
-- Un SET statement_timeout dentro de la función no rearma el temporizador ya
-- activo (probado). El fallo ocurre en enqueue_email desde la edge function
-- (rol authenticator, 8 s); se arregla con reintento en send-portal-email.
-- ---------------------------------------------------------------------
