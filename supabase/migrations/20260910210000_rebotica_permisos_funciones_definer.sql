-- =====================================================================
-- Rebotica: cerrar el EXECUTE de dos funciones SECURITY DEFINER
--
-- EL AGUJERO. `rebotica_pick_and_consume_prize(uuid, text, uuid)` es
-- SECURITY DEFINER, recibe el uuid del usuario por parámetro y DESCUENTA
-- `stock_restante`. Tenía EXECUTE para PUBLIC (`=X/postgres`), `anon` y
-- `authenticated`: por `POST /rest/v1/rpc/...` con la anon key, sin sesión
-- siquiera, se podía vaciar el stock de una campaña entera.
--
-- POR QUÉ ESTABA ASÍ. El proyecto tiene `ALTER DEFAULT PRIVILEGES`
-- concediendo EXECUTE a `anon` y `authenticated` en toda función nueva de
-- `public`. Son concesiones NOMINALES: `REVOKE ALL ... FROM PUBLIC` no las
-- quita. Hay que revocar POR NOMBRE y comprobarlo después en `proacl`.
--
-- POR QUÉ ES SEGURO REVOCAR. Verificado el 10-09-2026 antes de ejecutarlo:
--   - Único llamante en el repo: la edge `open-reward` (service_role) — que
--     desde hoy ni siquiera la llama: delega en `rebotica_open_cajon`.
--   - Único llamante en la BD: `rebotica_open_cajon(uuid,uuid,text)`, que es
--     SECURITY DEFINER de `postgres`, y `postgres` conserva su EXECUTE.
--   - Ninguna policy de RLS ni ningún job de `cron.job` la nombran.
-- `rebotica_unlock_resource(uuid)` sí la llama gente con sesión desde
-- `src/pages/Recursos.tsx`: ahí `authenticated` SE QUEDA y solo sobra `anon`.
--
-- IDEMPOTENTE: REVOKE/GRANT se pueden repetir sin efecto. Falla a propósito
-- si alguna de las dos funciones no existe (querríamos enterarnos).
--
-- EJECUTADA EN PRODUCCIÓN el 10-09-2026 (query_database, jeysistgdajopfruqpbc),
-- con OK expreso de Francesc. Permisos después:
--   pick_and_consume_prize -> postgres, service_role
--   unlock_resource        -> postgres, authenticated, service_role
-- =====================================================================

REVOKE ALL ON FUNCTION public.rebotica_pick_and_consume_prize(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rebotica_pick_and_consume_prize(uuid, text, uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.rebotica_unlock_resource(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rebotica_unlock_resource(uuid)
  TO authenticated, service_role;

-- Comprobación (no da error si falla, hay que MIRARLA):
--   SELECT oid::regprocedure, proacl FROM pg_proc
--    WHERE proname IN ('rebotica_pick_and_consume_prize','rebotica_unlock_resource');
