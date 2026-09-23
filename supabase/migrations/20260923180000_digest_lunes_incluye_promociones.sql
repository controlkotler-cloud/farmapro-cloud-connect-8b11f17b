-- Digest de los lunes (send_weekly_digest): las promociones de partners dadas de
-- alta en los últimos 7 días entran en el bloque de novedades, igual que cursos y
-- recursos (regla Francesc 23-09-2026, tras el alta de SULEMA).
--
-- EJECUTADA A MANO en producción el 23-09-2026 vía query_database (el fichero no
-- se aplica solo). Idempotente: si la función ya contiene la rama, no hace nada.
-- Parchea el cuerpo vigente en vez de reescribirlo entero para no pisar los
-- arreglos aplicados por SQL desde el 11-09 (reto de la semana, enlace ?r=, etc.).
DO $outer$
DECLARE d text; anchor text; nuevo text;
BEGIN
  d := pg_get_functiondef('public.send_weekly_digest(boolean, text)'::regprocedure);
  IF position('from public.promotions pr' in d) > 0 THEN
    RAISE NOTICE 'send_weekly_digest: promociones ya incluidas, nada que hacer';
    RETURN;
  END IF;
  anchor := $a$
  ) s;

  -- Si no hay ni caj$a$;
  IF position(anchor in d) = 0 THEN
    RAISE EXCEPTION 'send_weekly_digest: ancla no encontrada, revisar la funcion a mano';
  END IF;
  nuevo := $b$
    union all
    -- Promociones de partners dadas de alta esta semana (regla Francesc
    -- 23-09-2026): entran en novedades igual que cursos y recursos. Solo las
    -- activas y vigentes. El enlace va al listado porque /promociones no tiene
    -- parametro de ficha (a diferencia de /recursos?r=).
    select jsonb_build_object(
             'texto', 'Nueva promoción de ' || pr.company_name || ': ' || pr.title
                      || coalesce(' (' || nullif(pr.discount_details, '') || ')', '') || '.',
             'url', v_app || '/promociones'),
           pr.created_at
    from public.promotions pr
    where pr.is_active
      and pr.created_at >= now() - interval '7 days'
      and (pr.valid_until is null or pr.valid_until > now())$b$ || anchor;
  EXECUTE replace(d, anchor, nuevo);
END $outer$;
