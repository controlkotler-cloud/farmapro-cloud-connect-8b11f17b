-- rebotica-diagnostico-descuadre-stock.sql · 10-09-2026
--
-- ¿Ha dejado ya el bug de atomicidad de `open-reward` premios huérfanos, es decir stock
-- descontado sin apertura registrada? Solo LECTURA: ninguna de estas consultas escribe nada.
-- Se corren con `query_database` del MCP de Lovable, proyecto farmapro-portal
-- (c3f72248-9d45-48ac-947a-a3472f2c51ba / Supabase jeysistgdajopfruqpbc).
--
-- IMPORTANTE, el orden: la 0 primero. Sin ella, un resultado vacío en la 1 no prueba nada
-- (si nadie ha abierto un cajón todavía, no puede haber descuadre y el "todo limpio" es
-- falso). La 0 es el control positivo del método.
--
-- Y el descuadre NO es una prueba por sí solo: `stock_total` y `stock_restante` los puede
-- haber editado a mano un admin desde el panel (Admin → Rebotica → Premios), y eso mueve la
-- resta sin que haya pasado nada raro. Por eso están la 2 y la 3, que miran la misma cosa
-- desde otro lado. Nada de despublicar, reponer ni revertir a partir de una sola consulta.

-- ===========================================================================
-- 0) CONTROL POSITIVO: ¿hay tráfico que medir?
-- ===========================================================================
SELECT
  (SELECT count(*) FROM public.rebotica_prizes)                                AS premios,
  (SELECT COALESCE(sum(stock_total - stock_restante), 0)
     FROM public.rebotica_prizes)                                              AS unidades_consumidas,
  (SELECT count(*) FROM public.rebotica_openings)                              AS aperturas,
  (SELECT count(*) FROM public.rebotica_openings WHERE prize_id IS NOT NULL)   AS aperturas_con_premio,
  (SELECT count(*) FROM public.rebotica_calendar_draws)                        AS sorteos_calendario;
-- Si `unidades_consumidas` = 0 Y `aperturas` = 0: no hay nada que auditar todavía y la
-- consulta 1 no puede decir nada. Anotarlo así, no como "está limpio".

-- ===========================================================================
-- 1) EL DESCUADRE, premio a premio
-- ===========================================================================
-- descuadre > 0  ->  stock consumido SIN apertura: el bug (o un admin bajando stock a mano).
-- descuadre < 0  ->  aperturas SIN descuento: otro camino escribe aperturas sin consumir
--                    stock (mirar los sorteos de calendario), o subieron `stock_total`.
SELECT
  c.nombre                                        AS campana,
  c.quincena_inicio, c.quincena_fin, c.estado,
  p.id                                            AS prize_id,
  p.titulo, p.tipo, p.tier, p.peso,
  p.stock_total, p.stock_restante,
  (p.stock_total - p.stock_restante)              AS consumido,
  count(o.id)                                     AS aperturas,
  (p.stock_total - p.stock_restante) - count(o.id) AS descuadre,
  p.updated_at                                    AS premio_tocado_por_ultima_vez,
  max(o.opened_at)                                AS ultima_apertura
FROM public.rebotica_prizes p
JOIN public.rebotica_campaigns c ON c.id = p.campaign_id
LEFT JOIN public.rebotica_openings o ON o.prize_id = p.id
GROUP BY c.nombre, c.quincena_inicio, c.quincena_fin, c.estado,
         p.id, p.titulo, p.tipo, p.tier, p.peso, p.stock_total, p.stock_restante, p.updated_at
HAVING (p.stock_total - p.stock_restante) <> count(o.id)
ORDER BY descuadre DESC, c.quincena_inicio DESC;

-- ===========================================================================
-- 2) SEGUNDA VÍA: el rastro de tiempos
-- ===========================================================================
-- `rebotica_pick_and_consume_prize` pone `updated_at = now()` al descontar. Un premio con
-- descuadre positivo cuyo `updated_at` sea POSTERIOR a su última apertura es la firma del
-- bug: se descontó y la apertura nunca llegó. Si en cambio `updated_at` coincide con la
-- última apertura, o no hay ninguna apertura en toda la campaña, apunta a edición manual.
SELECT
  p.id AS prize_id, p.titulo, p.stock_total, p.stock_restante,
  (p.stock_total - p.stock_restante) - count(o.id) AS descuadre,
  p.updated_at,
  max(o.opened_at)                                  AS ultima_apertura,
  p.updated_at - max(o.opened_at)                   AS desfase
FROM public.rebotica_prizes p
LEFT JOIN public.rebotica_openings o ON o.prize_id = p.id
GROUP BY p.id, p.titulo, p.stock_total, p.stock_restante, p.updated_at
HAVING (p.stock_total - p.stock_restante) - count(o.id) > 0
ORDER BY desfase DESC NULLS LAST;

-- ===========================================================================
-- 3) TERCERA VÍA: usuarios con cajón "gastado" y sin premio
-- ===========================================================================
-- Al usuario el bug se le nota en que su cajón no se abre otra vez y no tiene premio. Esta
-- consulta busca la otra cara del descuadre: aperturas sin premio asignado, y aperturas
-- huérfanas de premio borrado.
SELECT o.id AS opening_id, o.user_id, o.source, o.reward_type,
       o.opened_at, o.expires_at, o.prize_id, o.resource_id,
       (o.prize_id IS NOT NULL AND pr.id IS NULL) AS premio_borrado
FROM public.rebotica_openings o
LEFT JOIN public.rebotica_prizes pr ON pr.id = o.prize_id
WHERE o.prize_id IS NULL
   OR pr.id IS NULL
ORDER BY o.opened_at DESC;

-- ===========================================================================
-- 4) CUÁNTOS CAJONES SE HAN ABIERTO, por campaña y source
-- ===========================================================================
-- Contexto para leer todo lo de arriba: volumen real y cuántas aperturas por reto hay ya.
SELECT c.nombre AS campana, o.source, count(*) AS aperturas,
       min(o.opened_at) AS primera, max(o.opened_at) AS ultima
FROM public.rebotica_openings o
JOIN public.rebotica_campaigns c ON c.id = o.campaign_id
GROUP BY c.nombre, o.source
ORDER BY ultima DESC;

-- ===========================================================================
-- QUÉ HACER CON EL RESULTADO
-- ===========================================================================
-- Si la 1 sale vacía y la 0 dice que sí hubo consumo y aperturas: no hay huérfanos, y el
-- arreglo (`rebotica_open_cajon`) es preventivo. Anotarlo con la fecha.
--
-- Si aparece descuadre positivo confirmado por la 2, la reposición es un UPDATE de una sola
-- unidad por huérfano y hay que decidirla con Francesc, con el número delante:
--   UPDATE public.rebotica_prizes SET stock_restante = stock_restante + <n>, updated_at = now()
--    WHERE id = '<prize_id>';
-- Y si se identifica al usuario que perdió su cajón, se le compensa con una apertura, no
-- tocando stock: eso es una decisión de Francesc, no de una sesión.
