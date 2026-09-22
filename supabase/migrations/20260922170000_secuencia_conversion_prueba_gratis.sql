-- Secuencia de conversión del plan gratis (22-09-2026). EJECUTADA en producción
-- vía query_database el 22-09-2026; este fichero es el registro en el repo.
--   dia20  comercial (plantilla prueba-dia20)   solo con consentimiento comercial en consent_ledger
--   dia23  servicio  (fin-prueba, aviso primero, 7 días)   [ya existía]
--   dia28  servicio  (fin-prueba, aviso ultimo, 2 días)    [ya existía]
--   dia31  servicio  (prueba-bloqueada), ventana 31-33 días por si el cron falla un día
-- Cron: jobid 30 portal-notify-trial-ending, 15 9 * * * (sin cambios).

alter table public.portal_trial_notice_log drop constraint if exists portal_trial_notice_log_kind_check;
alter table public.portal_trial_notice_log add constraint portal_trial_notice_log_kind_check
  check (kind = any (array['dia20'::text,'dia23'::text,'dia28'::text,'dia31'::text]));

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

  for r in
    select u.id as uid, u.email, p.full_name, k.k
    from auth.users u
    join public.profiles p on p.id = u.id
    cross join lateral (
      select case
        when date(u.created_at at time zone 'UTC') = (current_date - 20) then 'dia20'
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
        'diasRestantes', 10,
        'lanzamientoActivo', v_lanzamiento);
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
