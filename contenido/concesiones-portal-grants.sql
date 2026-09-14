-- =====================================================================
-- CONCESIONES DEL PORTAL (regalos de suscripción por lotes)
-- Escrito 14-09-2026. Mecánica permanente, no un apaño para un lote.
--
-- Qué resuelve: regalar meses de Equipo a grupos de clientes (empezando
-- por los 35 de redes) sin que ocupen las 100 plazas públicas de fundador
-- y sin tocar código nunca más. Cada lote nuevo = INSERT en portal_grants.
--
-- Equivale a "sumar las regaladas a las 100", pero por el lado del
-- contador en vez del límite: el límite sigue siendo 100 y las concedidas
-- no cuentan. Mismo resultado, y no hay que editar una edge function
-- (créditos de Lovable) cada vez que se regale un lote.
--
-- NO EJECUTADO. Requiere OK de Francesc.
-- Proyecto: jeysistgdajopfruqpbc (portal).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Registro de concesiones. Se rellena ANTES de que el cliente se dé
--    de alta: la clave de cruce es el email.
-- ---------------------------------------------------------------------
create table if not exists public.portal_grants (
  id                uuid primary key default gen_random_uuid(),
  email             text        not null,
  user_id           uuid        references auth.users(id) on delete set null,
  lote              text        not null,                  -- 'redes-2026q4'
  plan              text        not null default 'equipo',
  concedido_desde   date        not null,
  concedido_hasta   date        not null,
  founder_reserved  boolean     not null default true,     -- conserva precio fundador sin ocupar plaza
  cliente           text,                                  -- nombre en Holded
  activado_at       timestamptz,                           -- cuándo se dio de alta
  notas             text,
  created_at        timestamptz not null default now(),
  constraint portal_grants_fechas_ok check (concedido_hasta > concedido_desde)
);

create unique index if not exists portal_grants_email_lote_uk
  on public.portal_grants (lower(email), lote);
create index if not exists portal_grants_user_id_idx
  on public.portal_grants (user_id);

-- Cerrada: solo service_role y el SQL de admin. Lleva emails de clientes.
alter table public.portal_grants enable row level security;
revoke all on public.portal_grants from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Marca en la propia suscripción. La vista founder_count corre con
--    security_invoker=true (la ejecuta el visitante anónimo de /precios),
--    así que la exclusión NO puede depender de una tabla con RLS cerrado:
--    daría siempre falso y seguiría contando. Por eso la marca vive aquí.
-- ---------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists founder_granted boolean not null default false;

comment on column public.subscriptions.founder_granted is
  'true = plaza de fundador concedida en un lote de regalo: conserva el precio pero NO ocupa una de las 100 plazas públicas. Lo pone el trigger trg_subs_founder_granted desde portal_grants.';

-- ---------------------------------------------------------------------
-- 3. El contador público. Único cambio con efecto visible, y con la tabla
--    vacía da exactamente el mismo número que hoy (1).
-- ---------------------------------------------------------------------
create or replace view public.founder_count
with (security_invoker = true) as
  select count(*)::integer as spots_taken
    from subscriptions
   where is_founder = true
     and status = 'active'::subscription_status
     and founder_granted = false;

-- ---------------------------------------------------------------------
-- 4. Cruce automático por email, en los dos sentidos.
-- ---------------------------------------------------------------------

-- 4a. Al registrarse alguien de un lote: se le ata el user_id.
create or replace function public.portal_grant_link_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.portal_grants
     set user_id     = new.id,
         activado_at = coalesce(activado_at, now())
   where user_id is null
     and lower(email) = lower(new.email);
  return new;
end;
$$;

drop trigger if exists trg_portal_grant_link_user on public.profiles;
create trigger trg_portal_grant_link_user
  after insert on public.profiles
  for each row execute function public.portal_grant_link_user();

-- 4b. Al crearse o cambiar su suscripción: se marca como concedida.
create or replace function public.mark_founder_granted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select p.email into v_email from public.profiles p where p.id = new.user_id;

  if exists (
    select 1
      from public.portal_grants g
     where g.founder_reserved
       and (g.user_id = new.user_id
            or (v_email is not null and lower(g.email) = lower(v_email)))
  ) then
    new.founder_granted := true;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_subs_founder_granted on public.subscriptions;
create trigger trg_subs_founder_granted
  before insert or update of user_id, is_founder on public.subscriptions
  for each row execute function public.mark_founder_granted();

commit;

-- =====================================================================
-- COMPROBACIÓN (ejecutar después; debe seguir dando 1)
--   select * from founder_count;
--
-- ALTA DE UN LOTE NUEVO (esto es todo lo que hay que hacer en el futuro):
--   insert into portal_grants (email, lote, plan, concedido_desde, concedido_hasta, cliente)
--   values ('correo@farmacia.es', 'redes-2026q4', 'equipo', '2026-10-01', '2026-12-31', 'Farmacia X');
--
-- REVERTIR ENTERO:
--   drop trigger trg_subs_founder_granted on subscriptions;
--   drop trigger trg_portal_grant_link_user on profiles;
--   drop function mark_founder_granted(); drop function portal_grant_link_user();
--   create or replace view founder_count with (security_invoker = true) as
--     select count(*)::integer as spots_taken from subscriptions
--      where is_founder = true and status = 'active'::subscription_status;
--   alter table subscriptions drop column founder_granted;
--   drop table portal_grants;
-- =====================================================================
