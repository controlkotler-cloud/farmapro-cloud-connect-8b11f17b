-- Cajón de noviembre (Rebotica, Temporada 1). EJECUTADO en producción el
-- 10-09-2026 vía query_database (orden de Francesc). Idempotente. Mismo patrón que octubre
-- (supabase/migrations/20260910120000_rebotica_campanas_mensuales.sql):
-- premios sorteables clonados de Bienvenida; Baúl y Gordo no se clonan.
-- Si Francesc quiere premios distintos en noviembre, cambiar aquí los títulos
-- respetando los prefijos que reconoce el trigger de canje ('3 créditos%',
-- 'Recurso premium%', '1 mes de Plus%', '1 mes de Equipo%', 'Consulta exprés%',
-- 'Radiografía digital%', 'Tu duda%').

INSERT INTO public.rebotica_campaigns (id, nombre, quincena_inicio, quincena_fin, estado, skin, tema)
VALUES ('1f0a0c70-b3e1-4c1a-9a01-202611010000', 'Cajón de noviembre · Temporada 1',
        DATE '2026-11-01', DATE '2026-11-30', 'activa', 'cajonera',
        'Cajón mensual: cada usuario abre un cajón nuevo en noviembre')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.rebotica_prizes
       (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur,
        stock_total, stock_restante, peso, caducidad_dias, partner_id, incomprable)
SELECT '1f0a0c70-b3e1-4c1a-9a01-202611010000', p.titulo, p.descripcion, p.tipo, p.tier,
       p.valor_percibido_eur, p.stock_total, p.stock_total, p.peso, p.caducidad_dias,
       p.partner_id, p.incomprable
  FROM public.rebotica_prizes p
 WHERE p.campaign_id = '8bac0c59-3877-46ae-b7c3-d878a01477ec'
   AND p.peso > 0
   AND NOT EXISTS (
     SELECT 1 FROM public.rebotica_prizes q
      WHERE q.campaign_id = '1f0a0c70-b3e1-4c1a-9a01-202611010000' AND q.titulo = p.titulo
   );

SELECT nombre, quincena_inicio, quincena_fin, estado FROM public.rebotica_campaigns ORDER BY quincena_inicio;