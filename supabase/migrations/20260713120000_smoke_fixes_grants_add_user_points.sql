-- ---------------------------------------------------------------------
-- FIXES DEL SMOKE TEST COMPLETO (13-07-2026). Tres fallos de backend
-- detectados probando el portal en vivo (informe: informe-smoke-test-
-- portal-2026-07-13.md en la raíz de la carpeta farmapro):
--
-- 1) COMPLETAR RETOS ROTO DESDE SIEMPRE: add_user_points tiene el
--    parámetro llamado "user_id", que choca con la columna en el
--    ON CONFLICT (user_id) -> error 42702 "column reference user_id is
--    ambiguous" cada vez que un reto se completa (reproducido en vivo).
--    Por eso "Retos Completados: 0" pese a la actividad. Los puntos
--    normales van por recompute_user_points (parámetro _user_id, sano).
--    Fix: recrear la función con parámetros _user_id/_points. Hace
--    falta DROP porque CREATE OR REPLACE no permite renombrar
--    parámetros. Solo la llama update_challenge_progress (posicional),
--    así que no rompe nada.
--
-- 2) calculate_quiz_stats sin EXECUTE para authenticated (los REVOKE
--    masivos del hardening) -> "Error loading quiz stats" en consola en
--    cada quiz. No bloquea, pero ensucia y deja stats sin cargar.
--
-- 3) log_security_event sin EXECUTE para authenticated pero el frontend
--    lo llama -> los eventos de seguridad del cliente se pierden en
--    silencio. Es SECURITY DEFINER con user_id_param DEFAULT auth.uid(),
--    seguro de re-abrir.
-- ---------------------------------------------------------------------

-- 1) add_user_points: recrear sin ambigüedad
DROP FUNCTION IF EXISTS public.add_user_points(uuid, integer);

CREATE FUNCTION public.add_user_points(_user_id uuid, _points integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_points (user_id, total_points, level)
  VALUES (_user_id, _points, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = public.user_points.total_points + _points,
    level = GREATEST(1, (public.user_points.total_points + _points) / 100),
    updated_at = NOW();
END;
$function$;

-- Mantener la política del hardening: solo llamable desde funciones definer
REVOKE EXECUTE ON FUNCTION public.add_user_points(uuid, integer) FROM anon, authenticated, public;

-- 2) Stats de quiz visibles para usuarios logueados
GRANT EXECUTE ON FUNCTION public.calculate_quiz_stats(uuid) TO authenticated;

-- 3) El frontend registra eventos de seguridad
GRANT EXECUTE ON FUNCTION public.log_security_event(text, jsonb, uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- VERIFICACIÓN (ejecutar después):
--
-- SELECT has_function_privilege('authenticated',
--   'public.calculate_quiz_stats(uuid)', 'EXECUTE') AS stats_ok,
--   has_function_privilege('authenticated',
--   'public.log_security_event(text, jsonb, uuid)', 'EXECUTE') AS log_ok;
--
-- Y en el portal: entrar en Retos y completar cualquier reto pendiente;
-- debe subir "Retos Completados" sin errores en consola (F12).
-- ---------------------------------------------------------------------
