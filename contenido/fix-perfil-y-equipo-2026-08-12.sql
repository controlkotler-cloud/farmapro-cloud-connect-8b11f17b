-- =====================================================================
-- farmapro portal — dos fallos destapados por la compra de prueba
-- del plan Equipo (Stripe test) · 12-08-2026
--
-- ESTADO: APLICADO en producción y verificado simulando al usuario real
--         (transacciones con ROLLBACK, sin tocar datos).
--
-- Síntoma de Francesc: "tengo el plan Equipo activo pero no me deja
-- guardar cambios en el perfil ni invitar o gestionar mi equipo".
--
-- Lo primero verificado: el cobro fue BIEN. Fila en `subscriptions`,
-- equipo creado con `stripe_subscription_id` real (sub_1U3hqJ2ft…),
-- factura en `portal_holded_invoices`, perfil con subscription_role='equipo'
-- y `is_team_owner_strict` devolviendo true. El fallo era todo de acceso.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) "No me deja guardar cambios en el perfil"
--
-- CAUSA: `profiles` NO tiene UPDATE a nivel de tabla para `authenticated`;
-- tiene permisos COLUMNA A COLUMNA. Es un endurecimiento deliberado y bueno
-- (así `subscription_role`, `stripe_customer_id` o `points` no se pueden
-- tocar desde el navegador ni aunque la RLS lo permitiera).
--
-- La migración de HOY `20260812140000_perfil_farmacia_empleados_especialidad.sql`
-- añadió las columnas `employees_count` y `specialty_areas` pero NO les dio
-- el GRANT de UPDATE. Y `PersonalInfoTab.tsx:44-51` las manda SIEMPRE en el
-- update. Postgres rechaza la sentencia entera con:
--     42501: permission denied for table profiles
-- que el cliente enseña como el toast genérico "Error al actualizar el perfil".
--
-- ALCANCE: afectaba a TODOS los usuarios, no solo al nuevo, desde hoy.
-- También rompía el onboarding cuando el usuario rellenaba tamaño de equipo
-- o especialidades (`OnboardingWizard.tsx`), aunque ahí va condicionado.
-- ---------------------------------------------------------------------

grant update (employees_count, specialty_areas) on public.profiles to authenticated;

-- Comprobado que no falta ninguna otra: el resto de columnas sin UPDATE
-- (subscription_role, subscription_status, stripe_customer_id, role, points,
-- level, streak_days, cif, email, utm_*, name_display_preference…) no las
-- escribe el cliente en ningún sitio. El endurecimiento se mantiene intacto.


-- ---------------------------------------------------------------------
-- 2) "No me deja invitar o gestionar mi equipo"
--
-- CAUSA: recursión infinita en la RLS de `team_members`.
--     42P17: infinite recursion detected in policy for relation "team_members"
--
-- La política "Team members can view other members" consultaba `team_members`
-- DENTRO de la propia política de `team_members`:
--     team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() …)
--
-- NO lo causó el cambio de RLS de P1 de esta misma tarde: se reprodujo el
-- estado anterior dentro de una transacción (recreando "Team owners can manage
-- members" tal cual estaba) y da el MISMO error. Es un fallo de origen, y
-- significa que listar los miembros de un equipo desde el navegador no ha
-- funcionado nunca — ni para el titular ni para los miembros.
--
-- ARREGLO: apoyar ambas políticas en funciones SECURITY DEFINER, que se saltan
-- la RLS y por tanto no pueden llamarse a sí mismas. Las dos ya existían y son
-- las mismas que usa la edge `manage-team`, así que el criterio no cambia.
-- ---------------------------------------------------------------------

drop policy if exists "Team members can view other members" on public.team_members;
drop policy if exists "Team owners can view members"        on public.team_members;

create policy "Team members can view other members"
  on public.team_members for select to authenticated
  using ( public.is_active_team_member_of_subscription(team_id, auth.uid()) );

create policy "Team owners can view members"
  on public.team_members for select to authenticated
  using ( public.is_team_owner_strict(team_id, auth.uid()) );

-- Se conserva "Members can view own membership" (auth.uid() = user_id).
-- Barrido posterior: ninguna otra política del esquema se autorreferencia.


-- =====================================================================
-- VERIFICACIÓN EJECUTADA (simulando cada usuario con set_config +
-- set local role authenticated, todo dentro de BEGIN … ROLLBACK)
--
-- Usuario nuevo (9546e219…, titular del equipo recién comprado):
--     rpc is_team_owner ............... true
--     ve su equipo .................... 1
--     ve los miembros de su equipo .... 0   (correcto: aún no ha invitado)
--     ve su perfil .................... 1
--     UPDATE de perfil ................ OK, employees_count='2-5' guardado
--
-- Titular antiguo (b877f5d1…, equipo de julio):
--     ve sus 5 filas de miembros ...... 5
--     ve su equipo .................... 1
-- =====================================================================


-- ---------------------------------------------------------------------
-- REVERSIÓN (solo si hiciera falta)
-- ---------------------------------------------------------------------
-- revoke update (employees_count, specialty_areas) on public.profiles from authenticated;
--
-- drop policy if exists "Team members can view other members" on public.team_members;
-- create policy "Team members can view other members" on public.team_members
--   for select to authenticated
--   using (team_id in (select team_members_1.team_id from team_members team_members_1
--                       where team_members_1.user_id = auth.uid()
--                         and team_members_1.status = 'active'));   -- ← recursiva, no recomendable
