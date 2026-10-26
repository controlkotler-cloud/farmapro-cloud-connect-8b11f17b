-- F11 (26-10-2026): un mes más de Plus a 0 € dejando tarjeta, a quien termina la prueba sin pagar.
-- Aplicado a mano por query_database (el push no ejecuta migraciones).
--
-- notify_oferta_mes_plus(p_enviar):
--   1. Alta: a los 5 días del fin de la prueba (ventana de 3 por si el cron falla un día) crea su fila
--      en portal_ofertas con 10 días de plazo. Solo con consentimiento comercial, sin ninguna
--      suscripción previa (tampoco cancelada) y una vez por CIF.
--   2. Envío: manda la plantilla oferta-mes-plus a cada oferta vigente que aún no la haya recibido.
--      Así entran también las 49 cargadas a mano el 26-10.
--   Si ya no quedan plazas de fundador no hace nada: el correo promete 19,90 €.
--   p_enviar = false (por defecto) solo devuelve la lista, sin escribir ni enviar.
-- Apagar: select cron.unschedule('portal-oferta-mes-plus');

alter table public.portal_trial_notice_log drop constraint if exists portal_trial_notice_log_kind_check;
alter table public.portal_trial_notice_log add constraint portal_trial_notice_log_kind_check
  check (kind = any (array['dia20','dia23','dia28','dia31','oferta_mes_plus']));

create or replace function public.notify_oferta_mes_plus(p_enviar boolean default false)
returns table(o_user_id uuid, o_email text, o_valida_hasta date, o_accion text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r record;
  v_srk text;
  v_hoy date := (now() at time zone 'Europe/Madrid')::date;
  v_plazas boolean;
begin
  select coalesce((select spots_taken from public.founder_count limit 1), 0) < 100 into v_plazas;
  if not v_plazas then return; end if;

  select decrypted_secret into v_srk
    from vault.decrypted_secrets where name = 'email_queue_service_role_key';

  -- 1. Alta de las nuevas (mismo cálculo del fin de prueba que notify_trial_ending).
  for r in
    select u.id as uid, u.email
    from auth.users u
    join public.profiles p on p.id = u.id
    where u.email is not null
      and date((case when p.trial_ends_at > u.created_at + interval '30 days' then p.trial_ends_at
                     else u.created_at + interval '30 days' end) at time zone 'UTC')
          between v_hoy - 7 and v_hoy - 5
      and coalesce(p.subscription_role::text,'freemium') not in ('plus','equipo','premium','profesional','admin','estudiante')
      and split_part(lower(u.email),'@',2) not in ('mkpro.es','farmapro.es')
      and split_part(lower(u.email),'@',1) not in ('nuriafrancis','fantafrenchie','mkproalaitz')
      and not exists (select 1 from public.subscriptions s where s.user_id = u.id)
      and not exists (select 1 from public.suppressed_emails se where lower(se.email) = lower(u.email))
      and exists (select 1 from public.consent_ledger c
                   where c.tipo = 'comercial' and (c.user_id = u.id or lower(c.email) = lower(u.email)))
      and not exists (select 1 from public.portal_ofertas o
                       where lower(o.email) = lower(u.email) and o.oferta = 'mes-plus-tarjeta')
      -- Una vez por CIF: fuera si otra cuenta de la misma farmacia ya pagó o ya tiene la oferta.
      and not exists (
        select 1 from public.profiles p2 join auth.users u2 on u2.id = p2.id
         where nullif(trim(p.cif),'') is not null and upper(trim(p2.cif)) = upper(trim(p.cif)) and p2.id <> u.id
           and (exists (select 1 from public.subscriptions s2 where s2.user_id = p2.id)
                or exists (select 1 from public.portal_ofertas o2
                            where lower(o2.email) = lower(u2.email) and o2.oferta = 'mes-plus-tarjeta')))
  loop
    if p_enviar then
      insert into public.portal_ofertas (email, oferta, valida_hasta)
      values (lower(r.email), 'mes-plus-tarjeta', v_hoy + 10)
      on conflict (email, oferta) do nothing;
    end if;
    o_user_id := r.uid; o_email := r.email; o_valida_hasta := v_hoy + 10; o_accion := 'alta'; return next;
  end loop;

  -- 2. Envío de las ofertas vigentes sin correo (tope 50 por pasada: la API admite 100/hora).
  for r in
    select u.id as uid, u.email, p.full_name, o.valida_hasta as hasta
    from public.portal_ofertas o
    join auth.users u on lower(u.email) = lower(o.email)
    join public.profiles p on p.id = u.id
    where o.oferta = 'mes-plus-tarjeta'
      and o.valida_hasta >= v_hoy
      and not exists (select 1 from public.subscriptions s where s.user_id = u.id)
      and not exists (select 1 from public.suppressed_emails se where lower(se.email) = lower(u.email))
      and exists (select 1 from public.consent_ledger c
                   where c.tipo = 'comercial' and (c.user_id = u.id or lower(c.email) = lower(u.email)))
      and not exists (select 1 from public.portal_trial_notice_log t
                       where t.user_id = u.id and t.kind = 'oferta_mes_plus' and t.sent_at is not null)
    order by o.created_at
    limit 50
  loop
    if p_enviar then
      begin
        insert into public.portal_trial_notice_log (user_id, kind, sent_at, attempts)
        values (r.uid, 'oferta_mes_plus', null, 1);
      exception when unique_violation then
        update public.portal_trial_notice_log t
           set claimed_at = now(), attempts = t.attempts + 1
         where t.user_id = r.uid and t.kind = 'oferta_mes_plus';
      end;

      if v_srk is not null then
        -- trigger 'notify_trial_ending': send-portal-email marca sent_at en portal_trial_notice_log.
        perform net.http_post(
          url := 'https://jeysistgdajopfruqpbc.supabase.co/functions/v1/send-portal-email',
          headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || v_srk),
          body := jsonb_build_object(
            'template', 'oferta-mes-plus',
            'to', r.email,
            'data', jsonb_build_object('nombre', coalesce(r.full_name, ''), 'validaHasta', to_char(r.hasta, 'YYYY-MM-DD')),
            'meta', jsonb_build_object('trigger','notify_trial_ending','kind','oferta_mes_plus','user_id',r.uid)
          )
        );
        perform pg_sleep(0.3);
      end if;
    end if;
    o_user_id := r.uid; o_email := r.email; o_valida_hasta := r.hasta; o_accion := 'envio'; return next;
  end loop;
  return;
end;
$function$;

revoke all on function public.notify_oferta_mes_plus(boolean) from public, anon, authenticated;

-- Adoración (a_villarroya@hotmail.com) ya lo recibió a mano el 26-10 a las 15:41 UTC desde Gmail.
insert into public.portal_trial_notice_log (user_id, kind, sent_at, attempts)
select u.id, 'oferta_mes_plus', timestamptz '2026-10-26 15:41:00+00', 1
  from auth.users u where lower(u.email) = 'a_villarroya@hotmail.com'
on conflict (user_id, kind) do nothing;

-- Cron (solo con el sí de Francesc): todos los días a las 09:40 UTC.
-- select cron.schedule('portal-oferta-mes-plus', '40 9 * * *', $$select public.notify_oferta_mes_plus(true);$$);
