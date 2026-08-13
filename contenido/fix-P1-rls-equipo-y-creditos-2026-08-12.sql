-- =====================================================================
-- farmapro portal — P1: cierre de escalada de privilegios · 12-08-2026
-- ESTADO: APLICADO en producción el 12-08-2026 (Cowork, vía MCP de Lovable),
--         con el visto bueno de Francesc. Verificación ejecutada al final:
--           · team_subscriptions → solo queda 1 SELECT + la ALL de admin
--           · team_members       → solo quedan 3 SELECT
--           · add_image_credits  → authenticated=false, anon=false, service_role=true
--           · datos intactos: 1 equipo activo, 5 filas de miembros
--         PENDIENTE: comprobación manual de Francesc en Mi Farmacia.
--
-- Cierra dos vías por las que un usuario registrado puede darse a sí mismo
-- cosas de pago desde la consola del navegador:
--   (1) crearse un plan Equipo activo
--   (2) regalarse créditos de imagen ilimitados
--
-- Verificado antes de escribir esto (12-08, BD de producción):
--   · El navegador SOLO hace SELECT sobre team_subscriptions y team_members
--     (useTeamManagement.ts:69, 84, 115). No hay ni un insert/update/delete
--     desde el cliente, así que quitar los permisos de escritura NO rompe la UI.
--   · Todas las escrituras reales pasan por la edge `manage-team`, que usa
--     SUPABASE_SERVICE_ROLE_KEY y por tanto se salta RLS.
--   · `ensure_team_subscription` ya es solo service_role (comprobado en proacl):
--     no hay agujero por RPC para crear equipos.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) team_subscriptions — quitar la escritura desde el cliente
--
-- El problema: las dos políticas son FOR ALL con USING/WITH CHECK
-- (owner_id = auth.uid()). En una política ALL, ese predicado también
-- autoriza el INSERT. Y como `status` tiene DEFAULT 'active' y
-- `max_members` DEFAULT 9, basta con:
--
--     supabase.from('team_subscriptions').insert({ owner_id: <mi uid> })
--
-- ...para tener un equipo activo. A partir de ahí `is_team_owner_strict`
-- (que solo mira owner_id + status='active', sin comprobar pago alguno) deja
-- usar manage-team/invite_member, y quien acepte la invitación recibe
-- subscription_role='equipo'. Una farmacia entera dentro, gratis.
-- Además el mismo predicado permite UPDATE de `max_members` a lo que sea.
-- ---------------------------------------------------------------------

drop policy if exists "Owners can manage team_subscriptions" on public.team_subscriptions;
drop policy if exists "Team owners can manage subscriptions"  on public.team_subscriptions;

-- Se conservan intactas (no hace falta tocarlas):
--   · "Team members can view subscription"  SELECT  → USING (owner_id = auth.uid()
--       OR is_active_team_member_of_subscription(id, auth.uid()))
--       ← el titular sigue viendo su equipo: es lo único que pide la UI.
--   · "Admins can manage all team_subscriptions"  ALL  → is_current_user_admin()


-- ---------------------------------------------------------------------
-- 2) team_members — misma historia, y además saltaba el tope de plazas
--
-- "Team owners can manage members" es FOR ALL sobre cualquier equipo cuyo
-- owner_id sea el usuario, SIN comprobar `max_members`. Un titular legítimo
-- podía insertar filas de miembros sin límite desde la consola, saltándose
-- el control de plazas que sí aplica manage-team.
--
-- OJO: hay que sustituirla por una de SELECT, porque el titular NO tiene por
-- qué figurar como fila en team_members y las otras dos políticas de lectura
-- solo cubren "mi propia fila" y "otros miembros de un equipo donde soy
-- miembro activo". Sin esto, MiFarmacia se quedaría sin listar el equipo.
-- ---------------------------------------------------------------------

drop policy if exists "Team owners can manage members" on public.team_members;

create policy "Team owners can view members"
  on public.team_members
  for select
  to authenticated
  using (
    team_id in (
      select id from public.team_subscriptions where owner_id = auth.uid()
    )
  );

-- Se conservan: "Members can view own membership" y
-- "Team members can view other members".


-- ---------------------------------------------------------------------
-- 3) add_image_credits — HALLAZGO NUEVO (12-08). Créditos de imagen gratis.
--
-- La función es SECURITY DEFINER, acepta `p_user` y `p_credits` arbitrarios,
-- y NO comprueba ni quién llama ni que haya pago. Y tiene EXECUTE concedido
-- a `authenticated` Y a `anon` (verificado en proacl). Es decir:
--
--     supabase.rpc('add_image_credits', { p_user: '<uid>', p_credits: 999999 })
--
-- ...desde el navegador, incluso sin iniciar sesión, deja a cualquiera con
-- generación de imágenes ilimitada. Cada imagen cuesta dinero real
-- (0,07-0,11 €) y vacía los packs de 4,99/9,99/16,99 € como producto.
--
-- El único invocador legítimo es `stripe-webhook` (index.ts:117), que usa
-- service_role. Ni `authenticated` ni `anon` necesitan este permiso para nada.
-- ---------------------------------------------------------------------

revoke execute on function public.add_image_credits(uuid, integer) from anon;
revoke execute on function public.add_image_credits(uuid, integer) from authenticated;
revoke execute on function public.add_image_credits(uuid, integer) from public;

grant  execute on function public.add_image_credits(uuid, integer) to service_role;

-- `consume_image_credit(integer)` NO se toca: usa auth.uid() internamente,
-- no acepta el usuario por parámetro y es solo para `authenticated`. Correcto.


-- =====================================================================
-- LO QUE NO SE HACE AQUÍ, Y POR QUÉ
--
-- El informe proponía endurecer `is_team_owner_strict` para exigir una
-- suscripción de pago real. NO se hace todavía, a propósito:
--
--   · La tabla `subscriptions` está VACÍA (0 filas) por el fallo P3: el
--     upsert del webhook falló el 15-07 y el error se tragó en un log().
--   · El único equipo real (owner b877f5d1…, "Mi farmacia", 5 miembros)
--     tiene `stripe_subscription_id` y `subscription_id` a NULL.
--
-- Con cualquiera de las dos comprobaciones, el titular real perdería HOY
-- mismo el acceso a la gestión de su equipo. El orden correcto es:
--     P1 (esto) → P3 (arreglar el webhook y repoblar `subscriptions`)
--     → después endurecer is_team_owner_strict.
--
-- Cerrar la RLS ya mata el ataque por sí solo: sin poder crear la fila de
-- team_subscriptions, `is_team_owner_strict` nunca llega a dar true a nadie
-- que no lo sea.
-- =====================================================================


-- ---------------------------------------------------------------------
-- VERIFICACIÓN (ejecutar después)
-- ---------------------------------------------------------------------

-- (a) En team_subscriptions y team_members no debe quedar ninguna política
--     de escritura para usuarios normales. Solo deben salir SELECT, más las
--     ALL de admin.
select tablename, policyname, cmd, roles::text
  from pg_policies
 where schemaname = 'public'
   and tablename in ('team_subscriptions','team_members')
 order by tablename, cmd, policyname;

-- (b) add_image_credits: authenticated y anon deben dar FALSE.
select has_function_privilege('authenticated','public.add_image_credits(uuid,integer)','EXECUTE') as auth_puede,
       has_function_privilege('anon',         'public.add_image_credits(uuid,integer)','EXECUTE') as anon_puede,
       has_function_privilege('service_role', 'public.add_image_credits(uuid,integer)','EXECUTE') as service_puede;

-- (c) El equipo real sigue en pie y visible.
select ts.id, ts.team_name, ts.status, ts.max_members,
       (select count(*) from team_members m where m.team_id = ts.id) as miembros
  from team_subscriptions ts;

-- (d) COMPROBACIÓN MANUAL, la que de verdad cuenta:
--     entrar en el portal como el titular del equipo, abrir Mi Farmacia y
--     verificar que sigue viendo la lista de miembros y puede invitar.


-- ---------------------------------------------------------------------
-- REVERSIÓN (solo si algo se rompiera)
-- ---------------------------------------------------------------------
-- create policy "Team owners can manage subscriptions" on public.team_subscriptions
--   for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- create policy "Owners can manage team_subscriptions" on public.team_subscriptions
--   for all to authenticated using (auth.uid() = owner_id);
-- drop policy if exists "Team owners can view members" on public.team_members;
-- create policy "Team owners can manage members" on public.team_members
--   for all to authenticated
--   using  (team_id in (select id from public.team_subscriptions where owner_id = auth.uid()))
--   with check (team_id in (select id from public.team_subscriptions where owner_id = auth.uid()));
-- grant execute on function public.add_image_credits(uuid, integer) to authenticated, anon;
