-- Email del día 20 personalizado (27-09-2026). Sustituye al genérico de 20260922170000.
-- Pasa a la plantilla prueba-dia20: qué ha usado la cuenta, plan recomendado con motivo,
-- fecha exacta de bloqueo y, si no ha usado nada, los recursos más descargados.
-- Además el dia20 no sale en lunes (digest semanal): se retrasa al martes.
-- Idempotente (create or replace). Queda fijo para todas las altas nuevas.
-- EJECUTADA en producción vía query_database el 27-09-2026.

create or replace function public.trial_dia20_payload(p_uid uuid)
 returns jsonb
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  with b as (
    select u.id, u.email, u.created_at, p.employees_count, p.cif,
           lower(split_part(u.email,'@',2)) as dominio
      from auth.users u join public.profiles p on p.id = u.id
     where u.id = p_uid
  ),
  descargas as (
    select r.title, max(d.downloaded_at) as t
      from public.resource_downloads d join public.resources r on r.id = d.resource_id
     where d.user_id = p_uid group by r.title
  ),
  cursos as (
    select c.title, e.enrolled_at as t, (e.completed_at is not null) as completado
      from public.course_enrollments e join public.courses c on c.id = e.course_id
     where e.user_id = p_uid
  ),
  equipo_desc as (
    select title from descargas
     where title ~* '(turno|contrat|apertura y cierre|equipo|onboarding|evaluaci)'
     order by t desc limit 1
  ),
  otras as (
    -- Otras altas de la MISMA farmacia: mismo CIF o mismo dominio propio.
    -- Se excluyen correos genéricos y de colegios (cofb.net, coft.org, micof.es...), que comparten muchas farmacias.
    select count(*) as n
      from auth.users u2 join public.profiles p2 on p2.id = u2.id, b
     where u2.id <> b.id
       and ((b.cif is not null and b.cif <> '' and p2.cif = b.cif)
            or (lower(split_part(u2.email,'@',2)) = b.dominio
                and b.dominio !~ '^(gmail|googlemail|hotmail|yahoo|outlook|icloud|live|msn|telefonica|me|protonmail)\.'
                and b.dominio !~ '^(cof|micof|coft|redfarma|farmaceuticos)'
                and b.dominio <> 'farmapro.es'))
  ),
  populares as (
    select r.title
      from public.resource_downloads d join public.resources r on r.id = d.resource_id
     where d.downloaded_at > now() - interval '60 days' and coalesce(r.is_published, true)
     group by r.title order by count(distinct d.user_id) desc limit 3
  )
  select jsonb_build_object(
    'fechaBloqueo', to_char(date(b.created_at at time zone 'UTC') + 30, 'YYYY-MM-DD'),
    'diasRestantes', greatest(1, (date(b.created_at at time zone 'UTC') + 30) - current_date),
    'usoDescargas', coalesce((select jsonb_agg(title order by t desc) from (select * from descargas order by t desc limit 3) x), '[]'::jsonb),
    'usoDescargasTotal', (select count(*) from descargas),
    'usoCursos', coalesce((select jsonb_agg(title order by t desc) from (select * from cursos order by t desc limit 2) x), '[]'::jsonb),
    'usoCursosCompletados', (select count(*) from cursos where completado),
    'usoIa', (select count(*) from public.activity_log a
               where a.user_id = p_uid and a.action in ('texto_ia','imagen_ia','creatividad_ia')),
    'planRecomendado', case
        when b.employees_count in ('4_6','7_10','mas_10') then 'equipo'
        when (select n from otras) > 0 then 'equipo'
        when exists (select 1 from equipo_desc) then 'equipo'
        else 'plus' end,
    'motivoPlan', case
        when b.employees_count in ('4_6','7_10','mas_10') then 'plantilla'
        when (select n from otras) > 0 then 'varias_altas'
        when exists (select 1 from equipo_desc) then 'recursos_equipo'
        else 'titular' end,
    'plantilla', b.employees_count,
    'recursoEquipo', (select title from equipo_desc),
    'populares', coalesce((select jsonb_agg(title) from populares), '[]'::jsonb)
  )
  from b;
$function$;

revoke all on function public.trial_dia20_payload(uuid) from public, anon, authenticated;

create or replace function public.notify_trial_ending()
 returns table(user_id uuid, kind text, email text)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  r record;
  v_srk text;
  v_already boolean;
  v_lanzamiento boolean;
  v_template text;
  v_data jsonb;
begin
  select decrypted_secret into v_srk
    from vault.decrypted_secrets where name = 'email_queue_service_role_key';

  -- Lanzamiento abierto mientras queden plazas de fundador (misma vista que usa /precios).
  select coalesce((select spots_taken from public.founder_count limit 1), 0) < 100 into v_lanzamiento;

  -- Secuencia del plan gratis (22-09-2026, dia20 personalizado 27-09-2026):
  --   dia20  comercial (prueba-dia20 + trial_dia20_payload) solo con consentimiento comercial; nunca en lunes
  --   dia23  servicio  (fin-prueba, primero, 7 días)
  --   dia28  servicio  (fin-prueba, ultimo, 2 días)
  --   dia31  servicio  (prueba-bloqueada) con ventana de 3 días por si el cron falla un día
  for r in
    select u.id as uid, u.email, p.full_name, k.k
    from auth.users u
    join public.profiles p on p.id = u.id
    cross join lateral (
      select case
        -- dia20 nunca sale en lunes (día del digest semanal): los del lunes salen el martes, con 21 días.
        when extract(isodow from current_date) <> 1
         and (date(u.created_at at time zone 'UTC') = (current_date - 20)
              or (extract(isodow from current_date) = 2 and date(u.created_at at time zone 'UTC') = (current_date - 21)))
          then 'dia20'
        when date(u.created_at at time zone 'UTC') = (current_date - 23) then 'dia23'
        when date(u.created_at at time zone 'UTC') = (current_date - 28) then 'dia28'
        when date(u.created_at at time zone 'UTC') between (current_date - 33) and (current_date - 31) then 'dia31'
      end as k
    ) k
    where k.k is not null
      and u.email is not null
      and coalesce(p.subscription_role::text,'freemium') not in ('plus','equipo','premium','profesional','admin','estudiante')
      and not exists (select 1 from public.subscriptions s
                       where s.user_id = u.id and s.status::text in ('active','trialing'))
      and not exists (select 1 from public.suppressed_emails se where lower(se.email) = lower(u.email))
      -- El comercial del día 20 exige consentimiento comercial (casilla del alta).
      and (k.k <> 'dia20' or exists (
            select 1 from public.consent_ledger c
             where c.tipo = 'comercial'
               and (c.user_id = u.id or lower(c.email) = lower(u.email))))
  loop
    begin
      insert into public.portal_trial_notice_log (user_id, kind, sent_at, attempts)
      values (r.uid, r.k, null, 1);
      v_already := false;
    exception when unique_violation then
      select (t.sent_at is not null) into v_already
        from public.portal_trial_notice_log t
       where t.user_id = r.uid and t.kind = r.k;
      if v_already then
        continue;
      end if;
      update public.portal_trial_notice_log t
         set claimed_at = now(), attempts = t.attempts + 1
       where t.user_id = r.uid and t.kind = r.k;
    end;

    if r.k = 'dia20' then
      v_template := 'prueba-dia20';
      v_data := jsonb_build_object(
        'nombre', coalesce(r.full_name, split_part(r.email,'@',1)),
        'lanzamientoActivo', v_lanzamiento)
        || public.trial_dia20_payload(r.uid);
    elsif r.k = 'dia31' then
      v_template := 'prueba-bloqueada';
      v_data := jsonb_build_object('nombre', coalesce(r.full_name, split_part(r.email,'@',1)));
    else
      v_template := 'fin-prueba';
      v_data := jsonb_build_object(
        'nombre', coalesce(r.full_name, split_part(r.email,'@',1)),
        'aviso', case when r.k='dia28' then 'ultimo' else 'primero' end,
        'diasRestantes', case when r.k='dia28' then 2 else 7 end);
    end if;

    if v_srk is not null then
      perform net.http_post(
        url := 'https://jeysistgdajopfruqpbc.supabase.co/functions/v1/send-portal-email',
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || v_srk),
        body := jsonb_build_object(
          'template', v_template,
          'to', r.email,
          'data', v_data,
          'meta', jsonb_build_object('trigger','notify_trial_ending','kind',r.k,'user_id',r.uid)
        )
      );
      perform pg_sleep(0.3);
    end if;

    user_id := r.uid; kind := r.k; email := r.email; return next;
  end loop;
  return;
end;
$function$;
