-- =====================================================================
-- REBOTICA · CAMPAÑA "CAJÓN DE BIENVENIDA" + POOL DE PREMIOS T1
-- *** BORRADOR (10-07-2026) · NO EJECUTAR SIN VALIDAR CON FRANCESC ***
--
-- Qué hace: crea la campaña de bienvenida (estado 'draft': NO visible para
-- usuarios hasta pasarla a 'activa' en el D-day) + el pool de premios según
-- el catálogo T1 v3 cerrado por Francesc (09-07, ficha de la Rebotica).
--
-- QUÉ VALIDAR ANTES DE EJECUTAR (los TODO del fichero):
--   1. Stocks y pesos: son PROPUESTA proporcional al escenario de la ficha
--      (pool por ~1.000 aperturas). El peso es relativo: más peso = más
--      probable. Ajustar libremente ANTES de ejecutar.
--   2. ¿El Gordo T1 (Auditoría Farmacia Silenciosa) entra en el pool del
--      lanzamiento o se reserva para más adelante del trimestre? Va INCLUIDO
--      con stock 1 y peso mínimo; borrar su bloque si se reserva.
--   3. Fechas: campaña 10-09 → 30-11 (temporada 1 entera, porque el cajón de
--      bienvenida lo abre cada registro nuevo, no caduca por quincena).
--   4. La activación del D-day: UPDATE rebotica_campaigns SET estado='activa'
--      WHERE nombre='Cajón de Bienvenida · Temporada 1'; (o vía cron).
--
-- Idempotente: relanzable sin duplicar (guardas por nombre/título).
-- Reglas aplicadas: la Rebotica REGALA (0 descuentos) · meses de suscripción
-- SOLO como tier-up (Gratis→Plus, Plus→Equipo; Equipo no recibe suscripción) ·
-- caducidad 7-14 días · deontológico (nada sanitario).
-- =====================================================================

DO $bienvenida$
DECLARE
  v_camp uuid;
BEGIN
  -- 1. Campaña (get-or-create por nombre)
  SELECT id INTO v_camp FROM public.rebotica_campaigns
    WHERE nombre = 'Cajón de Bienvenida · Temporada 1';

  IF v_camp IS NULL THEN
    INSERT INTO public.rebotica_campaigns
      (nombre, quincena_inicio, quincena_fin, estado, tema, skin)
    VALUES
      ('Cajón de Bienvenida · Temporada 1',
       DATE '2026-09-10', DATE '2026-11-30',
       'draft',
       'Bienvenida: cada alta nueva elige y abre su primer cajón',
       'cajonera')
    RETURNING id INTO v_camp;
  END IF;

  -- 2. Premios (uno a uno, con guarda por título dentro de la campaña)
  -- Formato: titulo, descripcion, tipo, tier, valor, stock_total, peso, caducidad, incomprable

  -- 2.1 · Plantilla "solo cajón" (el premio base: exclusiva, no comprable)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'Plantilla exclusiva de la Rebotica') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'Plantilla exclusiva de la Rebotica',
      'Una plantilla premium de trabajo (solo se consigue en un cajón, no se puede comprar). Lista para usar en tu farmacia.',
      'contenido', 'todos', 29, 400, 380, 14, true);
  END IF;

  -- 2.2 · Masterclass del vault
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'Masterclass del vault') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'Masterclass del vault',
      'Acceso a una masterclass grabada (20-30 min) que no está en el catálogo: solo sale de los cajones.',
      'contenido', 'todos', 49, 250, 240, 14, true);
  END IF;

  -- 2.3 · +3 créditos de imagen IAFarma
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = '3 créditos de imagen IAFarma') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, '3 créditos de imagen IAFarma',
      'Tres imágenes extra con IAFarma este mes: carteles, posts y promos para tu farmacia.',
      'credito_ia', 'todos', 9, 200, 180, 14, false);
  END IF;

  -- 2.4 · Recurso premium desbloqueado (solo Gratis: degustación)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'Recurso premium desbloqueado') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'Recurso premium desbloqueado',
      'Elige un recurso premium del catálogo y es tuyo, sin ser Plus.',
      'contenido', 'gratis', 19, 80, 60, 14, false);
  END IF;

  -- 2.5 · Tier-up: 1 mes de Plus (SOLO pool de Gratis; conversión)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = '1 mes de Plus gratis') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, '1 mes de Plus gratis',
      'Un mes entero del plan Plus, de regalo y sin compromiso: pruébalo todo.',
      'producto_propio', 'gratis', 20, 15, 10, 7, false);
  END IF;

  -- 2.6 · Tier-up: 1 mes de Equipo (SOLO pool de Plus; upsell 3 plazas)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = '1 mes de Equipo gratis') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, '1 mes de Equipo gratis',
      'Un mes del plan Equipo para ti y tu gente (hasta 10 personas), sin compromiso.',
      'producto_propio', 'plus', 49, 5, 8, 7, false);
  END IF;

  -- 2.7 · Radiografía digital exprés (informe manual personalizado en PDF)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'Radiografía digital exprés de tu farmacia') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'Radiografía digital exprés de tu farmacia',
      'Informe personalizado en PDF con capturas reales de tu presencia digital (Google, web, redes) y 3 acciones priorizadas. Hecho a mano por el equipo.',
      'servicio', 'todos', 90, 3, 3, 14, true);
  END IF;

  -- 2.8 · Consulta exprés con Alejandro (15 min, cupo)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'Consulta exprés de 15 minutos con Alejandro') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'Consulta exprés de 15 minutos con Alejandro',
      'Videollamada de 15 minutos con nuestro director de estrategia para UNA consulta concreta de marketing o gestión.',
      'servicio', 'todos', 60, 4, 4, 14, true);
  END IF;

  -- 2.9 · Tu duda respondida en la newsletter (el canje ES el formulario de la duda)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'Tu duda, respondida en la newsletter') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'Tu duda, respondida en la newsletter',
      'Nos mandas tu duda de gestión o marketing y la respondemos con nombre (o sin él, tú eliges) en la próxima edición de Impulso.',
      'servicio', 'todos', 30, 2, 2, 14, true);
  END IF;

  -- 2.10 · EL BAÚL (premio mayor del lanzamiento: cajón físico de madera)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'El baúl de la Rebotica') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'El baúl de la Rebotica',
      'Un baúl de madera grabado que llega a tu farmacia con: placa con el nombre de tu farmacia, carta personal de Alejandro, kit de la pausa para el equipo y chapa de farmacia ganadora.',
      'producto_propio', 'todos', 90, 1, 1, 14, true);
  END IF;

  -- 2.11 · EL GORDO T1 (TODO Francesc: ¿entra en el lanzamiento o se reserva?)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'EL GORDO: Auditoría Farmacia Silenciosa completa') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'EL GORDO: Auditoría Farmacia Silenciosa completa',
      'El premio grande del trimestre: una Auditoría Farmacia Silenciosa completa en tu farmacia (visita de evaluación anónima + informe + sesión de resultados). Valor real: desde 360 euros.',
      'gordo', 'todos', 360, 1, 1, 14, true);
  END IF;

END
$bienvenida$;

-- ---------------------------------------------------------------------
-- Verificación (solo lectura, tras ejecutar):
--   SELECT nombre, estado, skin, quincena_inicio, quincena_fin
--     FROM public.rebotica_campaigns WHERE nombre LIKE 'Cajón de Bienvenida%';
--   SELECT titulo, tipo, tier, stock_total, stock_restante, peso, caducidad_dias
--     FROM public.rebotica_prizes p
--     JOIN public.rebotica_campaigns c ON c.id = p.campaign_id
--     WHERE c.nombre LIKE 'Cajón de Bienvenida%' ORDER BY peso DESC;
-- Activación en el D-day (NO antes):
--   UPDATE public.rebotica_campaigns SET estado = 'activa'
--     WHERE nombre = 'Cajón de Bienvenida · Temporada 1';
-- =====================================================================
