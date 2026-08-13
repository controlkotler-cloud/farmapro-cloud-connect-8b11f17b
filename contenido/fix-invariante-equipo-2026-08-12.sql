-- =====================================================================
-- farmapro portal — "quien paga el plan Equipo ES el titular del equipo"
-- convertido en invariante de base de datos · 12-08-2026
--
-- ESTADO: APLICADO en producción y verificado (casos A y B con ROLLBACK).
--
-- ORIGEN: observación de Francesc — "que te identifique como titular no
-- puede ser aleatorio ni responder a cosas previas; quien paga el plan
-- Equipo es el administrador de ese equipo".
--
-- Tenía razón. La condición de titular se guardaba en DOS sitios que el
-- webhook de Stripe escribe por separado:
--   · profiles.subscription_role = 'equipo'   (lo que ve el perfil)
--   · una fila en team_subscriptions          (lo que da acceso a gestionar)
-- y el fallo de la segunda solo se registraba en un log
-- (`stripe-webhook/index.ts:214`), sin abortar ni avisar. Resultado posible:
-- alguien paga, su perfil dice "Equipo activo" y no tiene equipo. Para
-- siempre y en silencio.
--
-- Evidencia de que la deriva ya había ocurrido: el equipo del 15-07 existe
-- pero con stripe_subscription_id a NULL (vínculo con Stripe perdido).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) Disparador: el rol 'equipo' garantiza siempre su equipo
--
-- CUIDADO con el caso que casi se cuela: al aceptar una invitación,
-- `manage-team` también pone subscription_role='equipo' al MIEMBRO (paga el
-- titular). Sin filtro, cada empleado invitado se crearía su propio equipo y
-- se convertiría en titular.
--
-- Se distingue por orden de escritura, verificado en manage-team/index.ts:
-- primero activa la fila en team_members (status='active') y DESPUÉS cambia
-- el rol del perfil. Así que cuando este disparador se ejecuta, el invitado
-- ya tiene su fila activa y queda excluido.
--
-- Solo cubre la dirección "garantizar". La baja ya la gestiona el webhook
-- con deactivate_team_for_owner (stripe-webhook/index.ts:400).
-- ---------------------------------------------------------------------

create or replace function public.ensure_team_on_equipo_role()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  if new.subscription_role = 'equipo'
     and (tg_op = 'INSERT' or old.subscription_role is distinct from new.subscription_role)
     and not exists (
       select 1 from public.team_members
        where user_id = new.id and status = 'active'
     )
  then
    perform public.ensure_team_subscription(new.id);
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_ensure_team_on_equipo_role on public.profiles;
create trigger trg_ensure_team_on_equipo_role
after insert or update of subscription_role on public.profiles
for each row execute function public.ensure_team_on_equipo_role();


-- Backfill de saneamiento (idempotente). Ejecutado: 0 filas, no había
-- ningún titular huérfano que reparar.
-- select p.id, public.ensure_team_subscription(p.id)
--   from profiles p
--  where p.subscription_role = 'equipo'
--    and not exists (select 1 from team_members tm
--                     where tm.user_id = p.id and tm.status='active')
--    and not exists (select 1 from team_subscriptions ts
--                     where ts.owner_id = p.id and ts.status='active');


-- ---------------------------------------------------------------------
-- 2) Marcar el equipo de julio como lo que es: una prueba
--
-- Owner "Prueba Farmapro", 5 filas de miembros (1 activa, 4 invitaciones
-- caducadas el 29-07), sin stripe_subscription_id. Se renombra para que no
-- se confunda nunca con un cliente real. Se deja activo para no romper los
-- datos de prueba existentes.
-- ---------------------------------------------------------------------

update team_subscriptions
   set team_name  = 'PRUEBA — equipo de test (15-07-2026, sin suscripción de Stripe)',
       name       = 'PRUEBA — equipo de test',
       updated_at = now()
 where id = '26bebc9e-b219-4199-ac7a-362f6dbfc488';


-- =====================================================================
-- VERIFICACIÓN EJECUTADA (BEGIN … ROLLBACK, simulando al webhook con
-- request.jwt.claims role=service_role)
--
--   CASO A · pagador sin pertenencia a equipo → subscription_role='equipo'
--            resultado: 1 equipo creado                            CORRECTO
--   CASO B · miembro invitado (Alaitz, fila activa en team_members)
--            → subscription_role='equipo'
--            resultado: 0 equipos creados                          CORRECTO
-- =====================================================================


-- ---------------------------------------------------------------------
-- REVERSIÓN
-- ---------------------------------------------------------------------
-- drop trigger if exists trg_ensure_team_on_equipo_role on public.profiles;
-- drop function if exists public.ensure_team_on_equipo_role();
-- update team_subscriptions set team_name='Mi farmacia', name='Mi farmacia'
--  where id='26bebc9e-b219-4199-ac7a-362f6dbfc488';


-- ---------------------------------------------------------------------
-- SIGUE PENDIENTE (P3 del informe)
-- El webhook continúa tragándose errores: el upsert de `subscriptions` y la
-- llamada a ensure_team_subscription solo escriben en el log. El disparador
-- cubre el caso del equipo, pero la causa raíz —no comprobar el error y no
-- devolver 500 para que Stripe reintente— sigue ahí.
-- ---------------------------------------------------------------------
