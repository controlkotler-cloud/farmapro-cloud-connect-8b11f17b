-- 10-09-2026 (D-day): la landing /rebotica comprobaba la campaña activa con un
-- SELECT directo a rebotica_campaigns, cuya RLS solo deja leer a authenticated.
-- Al visitante anónimo le devolvía 0 filas y el botón decía "tu cajón se abre
-- el jueves 10 de septiembre" con la campaña ya abierta. Esta RPC (SECURITY
-- DEFINER, solo lectura, sin datos sensibles) responde igual a anon y a
-- authenticated: si hoy hay campaña activa y hasta cuándo.
CREATE OR REPLACE FUNCTION public.rebotica_campaign_abierta()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'abierta', true,
        'inicio', c.quincena_inicio,
        'fin', c.quincena_fin
      )
      FROM public.rebotica_campaigns c
      WHERE c.estado = 'activa'
        AND c.quincena_inicio <= (now() AT TIME ZONE 'Europe/Madrid')::date
        AND c.quincena_fin >= (now() AT TIME ZONE 'Europe/Madrid')::date
      ORDER BY c.quincena_inicio DESC
      LIMIT 1
    ),
    jsonb_build_object('abierta', false)
  );
$$;

REVOKE ALL ON FUNCTION public.rebotica_campaign_abierta() FROM public;
GRANT EXECUTE ON FUNCTION public.rebotica_campaign_abierta() TO anon, authenticated;

COMMENT ON FUNCTION public.rebotica_campaign_abierta() IS
  'Landing /rebotica: ¿hay campaña activa hoy (hora peninsular)? {abierta, inicio, fin}. Legible por anon.';
