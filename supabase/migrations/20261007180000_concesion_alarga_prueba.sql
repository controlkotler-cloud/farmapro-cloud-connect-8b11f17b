-- Una concesión (portal_grants) alarga la prueba gratis hasta su fin.
--
-- Por qué (07-10-2026): los regalados que aún no han activado su plan en /activar siguen en
-- freemium y la prueba les cuenta desde el alta (30 días). Tres clientes de redes con Equipo
-- regalado hasta el 31-12 se dieron de alta el 17-09: el 18-10 se les cerraba el portal
-- (cursos, Rebotica, IAFarma) y el 11-10 se activa además el paso a /precios
-- (validation_mode='active'). Hoy, 07-10, ya les llegó el correo comercial del día 20.
--
-- Cómo: `profiles.trial_ends_at` (columna que nadie escribía, vacía en los 76 perfiles a 07-10)
-- pasa a ser el fin de prueba alargado. Fin real de la prueba = el mayor entre alta + 30 días
-- y trial_ends_at. Lo rellena la concesión (23:59:59 de Madrid del último día, igual que el
-- trial_end que pone create-checkout en Stripe) y solo alarga, nunca acorta: si un día se
-- alarga una prueba a mano (por ejemplo, Alejandro con la cohorte), se escribe ahí mismo.
-- El plan sigue siendo la prueba (2 cursos, sin premium): para tener Equipo hay que activar.
--
-- Mismo criterio en frontend (src/lib/plans.ts getAccessState) y en las 3 edge functions de
-- IA (ai-creative-assistant, ai-generate-image, ai-portal-chat).
--
-- Idempotente: cada parche se salta si ya está aplicado y falla si no encuentra el texto.

create or replace function public.portal_sync_trial_end(p_user uuid)
returns timestamptz
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_end timestamptz;
  v_claims text := current_setting('request.jwt.claims', true);
begin
  if p_user is null then return null; end if;
  select max(((g.concedido_hasta + 1)::timestamp at time zone 'Europe/Madrid') - interval '1 second')
    into v_end
    from public.portal_grants g
   where g.user_id = p_user;
  if v_end is null then return null; end if;
  -- block_unsafe_profile_updates solo deja tocar trial_ends_at a service_role.
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.profiles
     set trial_ends_at = v_end, updated_at = now()
   where id = p_user and (trial_ends_at is null or trial_ends_at < v_end);
  perform set_config('request.jwt.claims', coalesce(v_claims, ''), true);
  return v_end;
end $$;

revoke execute on function public.portal_sync_trial_end(uuid) from public, anon, authenticated;

create or replace function public.portal_grant_sync_trial_end_trg()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- Corre dentro del alta (profiles AFTER INSERT → portal_grant_link_user → aquí):
  -- un fallo nunca puede tumbar un registro.
  begin
    perform public.portal_sync_trial_end(new.user_id);
  exception when others then
    raise warning 'portal_sync_trial_end(%): %', new.user_id, sqlerrm;
  end;
  return new;
end $$;

revoke execute on function public.portal_grant_sync_trial_end_trg() from public, anon, authenticated;

drop trigger if exists trg_portal_grant_sync_trial_end on public.portal_grants;
create trigger trg_portal_grant_sync_trial_end
  after insert or update of user_id, concedido_hasta on public.portal_grants
  for each row execute function public.portal_grant_sync_trial_end_trg();

-- Parches sobre funciones existentes: sustitución exacta con comprobación.
do $mig$
declare
  p record;
  v_def text;
  v_n int;
begin
  for p in
    select * from (values
      -- get_course_modules: la prueba dura hasta el mayor de alta+30 y trial_ends_at
      ('public.get_course_modules(uuid)'::regprocedure,
       E'  v_created timestamptz;\n',
       E'  v_created timestamptz;\n  v_trial_end timestamptz;\n', 1),
      ('public.get_course_modules(uuid)'::regprocedure,
       E'SELECT subscription_role::text, created_at\n    INTO v_role, v_created\n',
       E'SELECT subscription_role::text, created_at, trial_ends_at\n    INTO v_role, v_created, v_trial_end\n', 1),
      ('public.get_course_modules(uuid)'::regprocedure,
       E'AND v_created > (now() - interval ''30 days'');',
       E'AND greatest(v_created + interval ''30 days'', coalesce(v_trial_end, v_created)) > now();', 1),
      -- rebotica_open_cajon: no está terminada si trial_ends_at sigue en el futuro
      ('public.rebotica_open_cajon(uuid,uuid,text)'::regprocedure,
       E'AND v_created_at < now() - interval ''30 days'' THEN',
       E'AND v_created_at < now() - interval ''30 days''\n     AND NOT EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = _user_id AND p2.trial_ends_at > now()) THEN', 1),
      -- notify_trial_ending: la secuencia 20/23/28/31 cuenta desde el fin real menos 30 días
      ('public.notify_trial_ending()'::regprocedure,
       E'date(u.created_at at time zone ''UTC'')',
       E'date((case when p.trial_ends_at > u.created_at + interval ''30 days'' then p.trial_ends_at - interval ''30 days'' else u.created_at end) at time zone ''UTC'')', 5),
      -- trial_dia20_payload: fecha de bloqueo y días restantes del fin real
      ('public.trial_dia20_payload(uuid)'::regprocedure,
       E'select u.id, u.email, u.created_at, p.employees_count, p.cif,\n',
       E'select u.id, u.email, u.created_at, p.employees_count, p.cif,\n           greatest(date(u.created_at at time zone ''UTC'') + 30, coalesce(date(p.trial_ends_at at time zone ''Europe/Madrid''), date(u.created_at at time zone ''UTC'') + 30)) as fin,\n', 1),
      ('public.trial_dia20_payload(uuid)'::regprocedure,
       E'date(b.created_at at time zone ''UTC'') + 30',
       E'b.fin', 2)
    ) as t(fn, old_txt, new_txt, expected)
  loop
    v_def := pg_get_functiondef(p.fn);
    if position(p.new_txt in v_def) > 0 then
      raise notice '% ya parcheada, se salta', p.fn;
      continue;
    end if;
    v_n := (length(v_def) - length(replace(v_def, p.old_txt, ''))) / length(p.old_txt);
    if v_n <> p.expected then
      raise exception '% : esperaba % apariciones y hay %', p.fn, p.expected, v_n;
    end if;
    execute replace(v_def, p.old_txt, p.new_txt);
  end loop;
end $mig$;

-- Concesiones ya vinculadas a una cuenta: rellenar el fin de prueba.
select public.portal_sync_trial_end(user_id) from public.portal_grants where user_id is not null;
