-- Referidos del portal (spec docs/spec-referidos-portal-2026-10-07.md, decisiones de Francesc 07-10-2026).
-- La invitada: plan Gratis 60 días. Quien invita: 1 mes gratis cuando la invitada paga su primera
-- factura (lo aplica stripe-webhook). Tope 12 meses ganados al año. Se aplica con query_database:
-- un push NO ejecuta migraciones.

-- 1. Código propio por cuenta (7 caracteres sin 0/O/1/I/L).
create or replace function public.portal_gen_referral_code()
returns text language plpgsql volatile set search_path to 'public' as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..7 loop
      v_code := v_code || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = v_code);
  end loop;
  return v_code;
end $$;

alter table public.profiles add column if not exists referral_code text;

do $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.profiles set referral_code = public.portal_gen_referral_code() where referral_code is null;
end $$;

alter table public.profiles alter column referral_code set default public.portal_gen_referral_code();
create unique index if not exists profiles_referral_code_key on public.profiles (referral_code);

-- El usuario no puede cambiarse el código (block_unsafe_profile_updates, añadido referral_code).
create or replace function public.block_unsafe_profile_updates()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
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
     OR OLD.plan_comp_prev_role IS DISTINCT FROM NEW.plan_comp_prev_role
     OR OLD.referral_code IS DISTINCT FROM NEW.referral_code THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify sensitive profile attributes';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Tabla de invitaciones.
create table if not exists public.portal_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null unique references public.profiles(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  trial_extended_at timestamptz,
  paid_at timestamptz,
  reward_status text not null default 'pendiente' check (reward_status in ('pendiente','aplicado','descartado')),
  reward_kind text check (reward_kind in ('cupon','prueba')),
  reward_ref text,
  rewarded_at timestamptz,
  motivo_descarte text
);
create index if not exists portal_referrals_referrer_idx on public.portal_referrals (referrer_id);

alter table public.portal_referrals enable row level security;
drop policy if exists portal_referrals_select_own on public.portal_referrals;
create policy portal_referrals_select_own on public.portal_referrals
  for select to authenticated using (referrer_id = auth.uid());
-- Sin políticas de escritura: solo service role y los triggers security definer.

-- 3. Al crear el perfil: registrar la invitación, aplicar antiabuso y alargar la prueba a 60 días.
create or replace function public.portal_referral_on_signup()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  v_code text;
  v_referrer public.profiles%rowtype;
  v_email text;
  v_dom text;
  v_ref_dom text;
  v_motivo text;
  v_end timestamptz;
  v_claims text := current_setting('request.jwt.claims', true);
begin
  select upper(trim(u.raw_user_meta_data->>'referral_code')), lower(u.email)
    into v_code, v_email
    from auth.users u where u.id = new.id;
  if v_code is null or v_code = '' then return new; end if;

  select * into v_referrer from public.profiles where referral_code = v_code;
  if not found then return new; end if;

  v_dom := split_part(v_email, '@', 2);
  v_ref_dom := split_part(lower(v_referrer.email), '@', 2);

  if v_referrer.id = new.id then
    v_motivo := 'propia_cuenta';
  elsif v_email in ('fantafrenchie@gmail.com','nuriafrancis@gmail.com','mkproalaitz@gmail.com')
     or lower(v_referrer.email) in ('fantafrenchie@gmail.com','nuriafrancis@gmail.com','mkproalaitz@gmail.com') then
    v_motivo := 'cuenta_interna';
  elsif v_dom <> '' and v_dom = v_ref_dom
     and v_dom not in ('gmail.com','googlemail.com','hotmail.com','hotmail.es','outlook.com','outlook.es',
                       'live.com','yahoo.com','yahoo.es','icloud.com','me.com','msn.com','telefonica.net','movistar.es') then
    v_motivo := 'mismo_dominio';
  elsif exists (
    select 1 from public.team_members tm join public.team_subscriptions ts on ts.id = tm.team_id
     where ts.owner_id = v_referrer.id
       and (tm.user_id = new.id or lower(coalesce(tm.invited_email, tm.email, '')) = v_email)
  ) then
    v_motivo := 'equipo_propio';
  end if;

  if v_motivo is not null then
    insert into public.portal_referrals (referrer_id, referred_id, code, reward_status, motivo_descarte)
    values (v_referrer.id, new.id, v_code, 'descartado', v_motivo)
    on conflict (referred_id) do nothing;
    return new;
  end if;

  -- Prueba de 60 días hasta las 23:59:59 de Madrid; nunca acorta una concesión más larga.
  v_end := ((date(new.created_at at time zone 'Europe/Madrid') + 61)::timestamp at time zone 'Europe/Madrid') - interval '1 second';
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.profiles set trial_ends_at = v_end, updated_at = now()
   where id = new.id and (trial_ends_at is null or trial_ends_at < v_end);
  perform set_config('request.jwt.claims', coalesce(v_claims, ''), true);

  insert into public.portal_referrals (referrer_id, referred_id, code, trial_extended_at)
  values (v_referrer.id, new.id, v_code, now())
  on conflict (referred_id) do nothing;
  return new;
end $$;

drop trigger if exists trg_portal_referral_on_signup on public.profiles;
create trigger trg_portal_referral_on_signup after insert on public.profiles
  for each row execute function public.portal_referral_on_signup();

-- 4. El CIF se rellena en el onboarding, después del alta: si coincide con el de quien invita, se descarta.
create or replace function public.portal_referral_check_cif()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.cif is null or trim(new.cif) = '' then return new; end if;
  update public.portal_referrals r
     set reward_status = 'descartado', motivo_descarte = 'mismo_cif'
    from public.profiles p
   where r.referred_id = new.id and r.reward_status = 'pendiente'
     and p.id = r.referrer_id
     and upper(regexp_replace(coalesce(p.cif,''), '[^A-Za-z0-9]', '', 'g'))
       = upper(regexp_replace(new.cif, '[^A-Za-z0-9]', '', 'g'));
  return new;
end $$;

drop trigger if exists trg_portal_referral_check_cif on public.profiles;
create trigger trg_portal_referral_check_cif after update of cif on public.profiles
  for each row execute function public.portal_referral_check_cif();

-- 5. Precio de fundador: la invitada conserva la reserva hasta 7 días después de sus 60 días
--    (el tope de 100 plazas lo sigue poniendo founder_count en create-checkout: "si aún quedan").
create or replace function public.founder_reserva_hasta(p_uid uuid default auth.uid())
 returns date
 language plpgsql
 stable security definer
 set search_path to 'public'
as $function$
-- Reserva PERSONAL del precio de fundador (decisión 29-09-2026): fin de la prueba de 30 días + 7,
-- o fin de la concesión + 7 si tiene una más larga, o fin de la prueba de invitada (60 días) + 7
-- (referidos, 07-10-2026). Sin fecha global. El tope de 100 plazas lo sigue poniendo founder_count.
declare v_alta date; v_grant date; v_email text; v_ref date;
begin
  if p_uid is null then return null; end if;
  if coalesce(auth.role(),'') <> 'service_role' and p_uid is distinct from auth.uid() then return null; end if;
  select date(u.created_at at time zone 'Europe/Madrid'), u.email into v_alta, v_email from auth.users u where u.id = p_uid;
  if v_alta is null then return null; end if;
  select max(g.concedido_hasta)::date into v_grant from public.portal_grants g where lower(g.email) = lower(v_email);
  select v_alta + 67 into v_ref from public.portal_referrals r
   where r.referred_id = p_uid and r.reward_status <> 'descartado';
  -- Transición: ninguna cuenta anterior a la regla pierde la reserva antes del 06-10-2026.
  return greatest(v_alta + 37, coalesce(v_grant + 7, v_alta + 37), coalesce(v_ref, v_alta + 37), date '2026-10-06');
end $function$;

-- 6. Pantalla «Invita»: datos propios, invitadas solo con inicial.
create or replace function public.my_referrals()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_code text;
begin
  if v_uid is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  select referral_code into v_code from public.profiles where id = v_uid;
  return jsonb_build_object(
    'code', v_code,
    'altas', (select count(*) from public.portal_referrals where referrer_id = v_uid and reward_status <> 'descartado'),
    'pagan', (select count(*) from public.portal_referrals where referrer_id = v_uid and paid_at is not null and reward_status <> 'descartado'),
    'meses_ganados', (select count(*) from public.portal_referrals where referrer_id = v_uid and reward_status = 'aplicado'),
    'invitadas', coalesce((
      select jsonb_agg(jsonb_build_object(
               'inicial', upper(left(coalesce(nullif(trim(p.full_name), ''), '?'), 1)),
               'desde', r.created_at::date,
               'paga', r.paid_at is not null) order by r.created_at desc)
        from public.portal_referrals r join public.profiles p on p.id = r.referred_id
       where r.referrer_id = v_uid and r.reward_status <> 'descartado'), '[]'::jsonb)
  );
end $$;
revoke all on function public.my_referrals() from public, anon;
grant execute on function public.my_referrals() to authenticated;

-- 7. Para stripe-webhook (service role): ¿le queda cupo anual a quien invita? Tope 12 al año.
create or replace function public.portal_referral_quota_left(p_referrer uuid)
returns integer language sql stable security definer set search_path to 'public' as $$
  select greatest(0, 12 - count(*))::int from public.portal_referrals
   where referrer_id = p_referrer and reward_status = 'aplicado'
     and rewarded_at >= now() - interval '1 year';
$$;
revoke all on function public.portal_referral_quota_left(uuid) from public, anon, authenticated;
