-- ============================================================================
-- Rebotica · Temporada 1 con CAJONERA MENSUAL (decisión Francesc 02-09-2026)
-- PENDIENTE DE EJECUTAR: toca 9 filas de stock y crea 17 premios nuevos.
-- Francesc valida el reparto antes de correrlo.
-- ----------------------------------------------------------------------------
-- Hoy hay UNA campaña del 10-09 al 30-11 y un único pool de premios colgado
-- de ella. Con cajonera mensual hacen falta tres campañas y que cada una
-- tenga su pool, porque `rebotica_pick_and_consume_prize` filtra por
-- campaign_id (y la columna es NOT NULL, así que no hay "premio de temporada").
--
-- El Baúl y El Gordo NO se duplican: llevan peso 0 y el cron los busca sin
-- filtrar campaña, así que las tres filas de Baúl y la del Gordo que ya
-- existen sirven para toda la temporada.
--
-- Reparto propuesto (septiembre son 20 días; octubre y noviembre, meses
-- enteros). Los premios de servicio, con stock mínimo, se reservan a un mes
-- concreto para que cada mes tenga su premio grande:
--
--   Premio                        sept   oct   nov   (total actual)
--   Plantilla exclusiva            130    135   135   (400)
--   Masterclass del vault           80     85    85   (250)
--   3 créditos IAFarma              66     67    67   (200)
--   Recurso premium                 26     27    27   (80)
--   1 mes de Plus                    5      5     5   (15)
--   1 mes de Equipo                  2      2     1   (5)
--   Consulta exprés Alejandro        1      1     -   (2)
--   Radiografía digital              1      1     1   (3)
--   Duda en la newsletter            1      -     1   (2)
-- ============================================================================

BEGIN;

-- 1. La campaña actual pasa a ser solo septiembre ---------------------------
UPDATE public.rebotica_campaigns
   SET nombre = 'Cajón de Bienvenida · Septiembre',
       quincena_fin = DATE '2026-09-30',
       updated_at = now()
 WHERE quincena_inicio = DATE '2026-09-10';

-- 2. Campañas de octubre y noviembre ----------------------------------------
INSERT INTO public.rebotica_campaigns (nombre, quincena_inicio, quincena_fin, estado, skin, tema)
SELECT v.nombre, v.ini, v.fin, 'draft', 'cajonera', v.tema
  FROM (VALUES
    ('Cajón de Octubre',   DATE '2026-10-01', DATE '2026-10-31', 'mes 2'),
    ('Cajón de Noviembre', DATE '2026-11-01', DATE '2026-11-30', 'mes 3')
  ) AS v(nombre, ini, fin, tema)
 WHERE NOT EXISTS (SELECT 1 FROM public.rebotica_campaigns c WHERE c.nombre = v.nombre);

-- 3. Stock de septiembre (baja al tercio que le toca) ------------------------
UPDATE public.rebotica_prizes p
   SET stock_total = v.n, stock_restante = v.n, updated_at = now()
  FROM (VALUES
    ('Plantilla exclusiva de la Rebotica', 130),
    ('Masterclass del vault', 80),
    ('3 créditos de imagen IAFarma', 66),
    ('Recurso premium desbloqueado', 26),
    ('1 mes de Plus gratis', 5),
    ('1 mes de Equipo gratis', 2),
    ('Consulta exprés de 15 minutos con Alejandro', 1),
    ('Radiografía digital exprés de tu farmacia', 1),
    ('Tu duda, respondida en la newsletter', 1)
  ) AS v(titulo, n)
 WHERE p.titulo = v.titulo
   AND p.peso > 0;

-- 4. Pool de octubre y noviembre (clona el de septiembre con su stock) -------
INSERT INTO public.rebotica_prizes
  (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur,
   stock_total, stock_restante, peso, caducidad_dias, partner_id, incomprable)
SELECT c.id, p.titulo, p.descripcion, p.tipo, p.tier, p.valor_percibido_eur,
       v.n, v.n, p.peso, p.caducidad_dias, p.partner_id, p.incomprable
  FROM public.rebotica_prizes p
  JOIN (VALUES
    ('Cajón de Octubre',   'Plantilla exclusiva de la Rebotica', 135),
    ('Cajón de Octubre',   'Masterclass del vault', 85),
    ('Cajón de Octubre',   '3 créditos de imagen IAFarma', 67),
    ('Cajón de Octubre',   'Recurso premium desbloqueado', 27),
    ('Cajón de Octubre',   '1 mes de Plus gratis', 5),
    ('Cajón de Octubre',   '1 mes de Equipo gratis', 2),
    ('Cajón de Octubre',   'Consulta exprés de 15 minutos con Alejandro', 1),
    ('Cajón de Octubre',   'Radiografía digital exprés de tu farmacia', 1),
    ('Cajón de Noviembre', 'Plantilla exclusiva de la Rebotica', 135),
    ('Cajón de Noviembre', 'Masterclass del vault', 85),
    ('Cajón de Noviembre', '3 créditos de imagen IAFarma', 67),
    ('Cajón de Noviembre', 'Recurso premium desbloqueado', 27),
    ('Cajón de Noviembre', '1 mes de Plus gratis', 5),
    ('Cajón de Noviembre', '1 mes de Equipo gratis', 1),
    ('Cajón de Noviembre', 'Radiografía digital exprés de tu farmacia', 1),
    ('Cajón de Noviembre', 'Tu duda, respondida en la newsletter', 1)
  ) AS v(campana, titulo, n) ON v.titulo = p.titulo
  JOIN public.rebotica_campaigns c ON c.nombre = v.campana
 WHERE p.peso > 0
   AND p.campaign_id = (SELECT id FROM public.rebotica_campaigns WHERE nombre = 'Cajón de Bienvenida · Septiembre')
   AND NOT EXISTS (
     SELECT 1 FROM public.rebotica_prizes x
      WHERE x.campaign_id = c.id AND x.titulo = p.titulo
   );

COMMIT;

-- Comprobación
-- SELECT c.nombre, count(p.id) premios, sum(p.stock_total) stock
--   FROM rebotica_campaigns c LEFT JOIN rebotica_prizes p ON p.campaign_id = c.id
--  GROUP BY c.nombre ORDER BY min(c.quincena_inicio);
