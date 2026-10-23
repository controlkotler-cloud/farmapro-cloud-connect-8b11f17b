-- Reintento del resumen semanal (novedades-semanal), 23-10-2026.
--
-- Problema: el lunes las ~77 llamadas a send-portal-email salen casi a la vez
-- (pg_net no envía nada hasta que la función termina, así que el pg_sleep(0.3)
-- del bucle no escalona). Algunas llegan tarde a `enqueue_email` y pasan del
-- statement_timeout de 8 s del rol authenticator: 6 fallos el 21-09 y 10 el
-- 19-10. Como `portal_weekly_digest_log` se escribe ANTES de enviar, esos
-- usuarios quedaban como hechos y nadie los reintentaba.
--
-- Arreglo: `p_reintentar => true` recorre solo a quien tiene fila en el log de
-- la semana pero ningún `novedades-semanal` en estado ok en portal_email_log
-- desde el lunes. Un cron nuevo lo lanza a las 08:40 y 08:55 de Madrid, cuando
-- la tanda principal (08:10) ya ha terminado; con pocos destinatarios no hay
-- ráfaga. Idempotente: se puede ejecutar entero otra vez.

drop function if exists public.send_weekly_digest(boolean, text);

create or replace function public.send_weekly_digest(
  p_dry_run boolean default false,
  p_solo_email text default null::text,
  p_reintentar boolean default false)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_app       text := 'https://portal.farmapro.es';
  v_srk       text;
  v_week      date := date_trunc('week', current_date)::date;
  v_novedades jsonb;
  v_titular   text;
  v_camp_id   uuid;
  v_camp_fin  date;
  r           record;
  v_sem       jsonb;
  v_logros    text[];
  v_token     text;
  v_enviados  int := 0;
  v_saltados  int := 0;
  v_muestra   jsonb := '[]'::jsonb;
begin
  select decrypted_secret into v_srk
  from vault.decrypted_secrets where name = 'email_queue_service_role_key';

  -- Novedades de la semana: iguales para todos, ordenadas de más nueva a más
  -- vieja. Por `created_at`, no por `updated_at`: cualquier edición menor
  -- dispararía `updated_at` y metería ruido. Si una semana no hay nada, el
  -- bloque no se pinta y el correo sale igual con la parte personal
  -- (decisión Francesc 11-09-2026).
  select coalesce(jsonb_agg(x order by orden desc), '[]'::jsonb) into v_novedades
  from (
    select jsonb_build_object('texto', c.title, 'url', v_app || '/curso/' || c.slug) as x,
           c.created_at as orden
    from public.courses c
    where c.is_published and c.created_at >= now() - interval '7 days'
    union all
    select jsonb_build_object('texto', r2.title, 'url',
             -- Enlace al recurso concreto, no al listado: el lector venia a por
             -- ESE descargable y le tocaba buscarlo entre 69. La pagina lo filtra
             -- por ?r= y, si el slug ya no existe, ensena el catalogo entero.
             case when r2.slug is null or r2.slug = '' then v_app || '/recursos'
                  else v_app || '/recursos?r=' || r2.slug end),
           r2.created_at
    from public.resources r2
    where r2.is_published and r2.created_at >= now() - interval '7 days'
    union all
    -- El reto de la semana arranca ese mismo lunes, diez minutos antes que este
    -- correo (cron portal-reto-semanal 06:00 UTC, este 06:10). Se pide por fecha
    -- de arranque, no "el ultimo activo": si aquel cron falla no hay reto que
    -- empiece hoy y el correo calla, en vez de anunciar el de la semana pasada.
    select jsonb_build_object(
             'texto', 'Reto de la semana: ' || ch.title || '. ' || ch.description,
             'url', v_app || '/retos'),
           now()
    from public.challenges ch
    -- Mismo calculo del lunes que activate_weekly_challenge (semana de Madrid):
    -- el cron corre en UTC y `current_date` habria dependido de la zona de sesion.
    where ch.is_active
      and ch.start_date = (date_trunc('week', (now() at time zone 'Europe/Madrid')))::date
    union all
    -- Promociones de partners dadas de alta esta semana (regla Francesc
    -- 23-09-2026): entran en novedades igual que cursos y recursos. Solo las
    -- activas y vigentes. El enlace va al listado porque /promociones no tiene
    -- parametro de ficha (a diferencia de /recursos?r=).
    select jsonb_build_object(
             'texto', 'Nueva promoción de ' || pr.company_name || ': ' || pr.title
                      || coalesce(' (' || nullif(pr.discount_details, '') || ')', '') || '.',
             'url', v_app || '/promociones'),
           pr.created_at
    from public.promotions pr
    where pr.is_active
      and pr.created_at >= now() - interval '7 days'
      and (pr.valid_until is null or pr.valid_until > now())
  ) s;

  -- Si no hay ni cajón ni curso pendiente, el asunto se apoya en la novedad
  -- más reciente en vez de caer en el genérico "Esta semana en el portal".
  v_titular := v_novedades->0->>'texto';

  select id, quincena_fin into v_camp_id, v_camp_fin
  from public.rebotica_campaigns
  where estado = 'activa' and current_date between quincena_inicio and quincena_fin
  order by quincena_inicio desc limit 1;

  for r in
    select u.id as uid, lower(u.email) as email, p.full_name
    from auth.users u
    join public.profiles p on p.id = u.id
    left join public.user_notification_settings ns on ns.user_id = u.id
    where u.email is not null
      and u.email_confirmed_at is not null
      /* is_seed ya NO filtra: las cuentas internas tambien reciben el resumen */
      and coalesce(ns.email_weekly_digest, true)
      and not exists (select 1 from public.suppressed_emails se where lower(se.email) = lower(u.email))
      and (
        -- Tanda normal: quien aún no tiene fila esta semana.
        (not p_reintentar
         and not exists (select 1 from public.portal_weekly_digest_log l where l.user_id = u.id and l.week_start = v_week))
        or
        -- Reintento: tiene fila (se intentó) pero no consta ningún envío ok.
        (p_reintentar
         and exists (select 1 from public.portal_weekly_digest_log l where l.user_id = u.id and l.week_start = v_week)
         and not exists (select 1 from public.portal_email_log el
                         where el.template = 'novedades-semanal' and el.status = 'ok'
                           and lower(el.recipient) = lower(u.email) and el.created_at >= v_week))
      )
      and (p_solo_email is null or lower(u.email) = lower(p_solo_email))
    order by u.created_at
  loop
    v_sem := jsonb_build_object('novedades', v_novedades);
    if v_titular is not null then
      v_sem := v_sem || jsonb_build_object('titular', v_titular);
    end if;
    v_logros := array[]::text[];

    declare
      v_cursos int; v_quiz int;
    begin
      select count(*) into v_cursos from public.course_enrollments
      where user_id = r.uid and is_completed;
      select count(*) into v_quiz from public.quiz_attempts
      where user_id = r.uid and passed;

      if v_cursos > 0 then
        v_logros := v_logros || (case when v_cursos = 1
          then 'Llevas un curso terminado.'
          else 'Llevas ' || v_cursos || ' cursos terminados.' end);
      end if;
      if v_quiz > 0 then
        v_logros := v_logros || (case when v_quiz = 1
          then 'Y un quiz aprobado.'
          else 'Y ' || v_quiz || ' quiz aprobados.' end);
      end if;
      if array_length(v_logros, 1) > 0 then
        v_sem := v_sem || jsonb_build_object('logros', to_jsonb(v_logros));
      end if;
    end;

    if v_camp_id is not null
       and not exists (select 1 from public.rebotica_openings o
                       where o.user_id = r.uid and o.campaign_id = v_camp_id) then
      v_sem := v_sem || jsonb_build_object('cajon', jsonb_build_object(
        'diasRestantes', (v_camp_fin - current_date),
        'url', v_app || '/rebotica'));
    end if;

    -- Duración: `nullif(...,0)` porque hay cursos con duration_minutes = 0 y la
    -- hora real en duration_hours (p. ej. fp-ld-del-companero-al-referente).
    -- Sin el nullif, un curso de una hora se anunciaba como "2 minutos".
    declare
      v_t text; v_slug text; v_prog numeric; v_min int;
    begin
      select c.title, c.slug, coalesce(ce.progress, 0),
             coalesce(nullif(c.duration_minutes, 0), nullif(c.duration_hours, 0) * 60)
        into v_t, v_slug, v_prog, v_min
      from public.course_enrollments ce
      join public.courses c on c.id = ce.course_id
      where ce.user_id = r.uid and not coalesce(ce.is_completed, false) and c.is_published
      order by coalesce(ce.started_at, ce.enrolled_at) desc nulls last
      limit 1;

      if v_t is not null then
        v_sem := v_sem || jsonb_build_object('pendiente', jsonb_strip_nulls(jsonb_build_object(
          'titulo', v_t,
          'url', v_app || '/curso/' || v_slug,
          'progreso', round(v_prog),
          'minutos', case when v_min is null then null
                          else greatest(2, round(v_min * (1 - least(v_prog, 100) / 100.0))::int) end)));
      else
        select c.title, c.slug, coalesce(nullif(c.duration_minutes, 0), nullif(c.duration_hours, 0) * 60)
          into v_t, v_slug, v_min
        from public.courses c
        where c.is_published and not coalesce(c.is_premium, false)
          and not exists (select 1 from public.course_enrollments ce
                          where ce.user_id = r.uid and ce.course_id = c.id)
        order by c.created_at desc
        limit 1;

        if v_t is not null then
          v_sem := v_sem || jsonb_build_object('sugerencia', jsonb_strip_nulls(jsonb_build_object(
            'titulo', v_t,
            'url', v_app || '/curso/' || v_slug,
            'minutos', v_min)));
        end if;
      end if;
    end;

    select token into v_token from public.email_unsubscribe_tokens
    where lower(email) = r.email and used_at is null;

    if v_token is null then
      v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
      insert into public.email_unsubscribe_tokens (token, email)
      values (v_token, r.email)
      on conflict (email) do nothing;
      select token into v_token from public.email_unsubscribe_tokens where lower(email) = r.email;
    end if;

    if p_dry_run then
      v_muestra := v_muestra || jsonb_build_object('email', r.email, 'semanal', v_sem);
      v_saltados := v_saltados + 1;
    else
      insert into public.portal_weekly_digest_log (user_id, week_start, email)
      values (r.uid, v_week, r.email)
      on conflict do nothing;

      if v_srk is not null then
        perform net.http_post(
          url := 'https://jeysistgdajopfruqpbc.supabase.co/functions/v1/send-portal-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_srk),
          body := jsonb_build_object(
            'template', 'novedades-semanal',
            'to', r.email,
            'idempotency_key', 'digest-' || v_week::text || '-' || r.uid::text,
            'data', jsonb_build_object(
              'firstName', split_part(coalesce(r.full_name, ''), ' ', 1),
              'semanal', v_sem,
              'unsubUrl', v_app || '/baja?t=' || v_token),
            'meta', jsonb_build_object('trigger', 'send_weekly_digest', 'week', v_week,
                                       'user_id', r.uid, 'reintento', p_reintentar)));
        perform pg_sleep(0.3);
        v_enviados := v_enviados + 1;
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'semana', v_week, 'enviados', v_enviados, 'dry_run', p_dry_run,
    'reintento', p_reintentar,
    'candidatos', v_saltados + v_enviados,
    'novedades', jsonb_array_length(v_novedades),
    'muestra', case when p_dry_run then v_muestra else null end);
end;
$function$;

revoke all on function public.send_weekly_digest(boolean, text, boolean) from public, anon, authenticated;
grant execute on function public.send_weekly_digest(boolean, text, boolean) to service_role;
-- El rol del MCP de Lovable (query_database) tenía EXECUTE en la versión anterior.
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'sandbox_exec_jeysistgdajopfruqpbc') then
    grant execute on function public.send_weekly_digest(boolean, text, boolean) to sandbox_exec_jeysistgdajopfruqpbc;
  end if;
end $$;

-- 08:40 y 08:55 de Madrid los lunes (mismo truco de hora que portal-digest-lunes
-- para servir en verano y en invierno).
select cron.unschedule(jobid) from cron.job where jobname = 'portal-digest-lunes-reintento';
select cron.schedule('portal-digest-lunes-reintento', '40,55 6,7 * * 1',
  $$select case when extract(hour from now() at time zone 'Europe/Madrid') = 8
                then public.send_weekly_digest(p_reintentar => true) end;$$);
