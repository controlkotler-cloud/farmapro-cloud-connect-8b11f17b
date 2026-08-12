-- =====================================================================
-- REBOTICA · CAMPAÑA "CAJÓN DE BIENVENIDA" + POOL DE PREMIOS T1
-- *** BORRADOR v2 (13-07-2026) · NO EJECUTAR SIN VALIDAR CON FRANCESC ***
--
-- ⚠️ ESTADO REAL [verificado en BD, Cowork 16-07 tarde]: la campaña y los 11
-- premios YA ESTÁN CARGADOS en producción (campaña en draft). La carga se
-- hizo con desviaciones respecto a este fichero, CORREGIDAS el 16-07 tarde
-- directamente en BD: baúl/Gordo tenían peso=1 (esquivaba el CHECK antiguo)
-- → peso=0; baúl tenía stock 1 → 3; descripción del baúl ajustada al
-- briefing real de imprenta (cartón full-print, no "madera grabada").
-- Stocks digitales cargados: 400/250/200/80 (NO los 999999 de este draft) —
-- pendiente decidir si se suben. La verdad del pool es la BD, no este SQL.
--
-- v2 (13-07, decisiones de Francesc en sesión Cowork):
--   · DOS MECÁNICAS: (1) sorteo instantáneo al abrir el cajón (premio seguro,
--     solo premios con peso > 0) y (2) PREMIOS DE CALENDARIO (peso = 0: baúl
--     mensual y Gordo trimestral), que NO entran en el sorteo instantáneo:
--     los adjudica el cron por SORTEO entre las aperturas del período
--     (cada apertura = una papeleta). Garantizados se abran 50 o 2.000.
--   · Base digital SIN LÍMITE práctico (stock 999999): el cajón nunca queda
--     sin premio aunque haya 2.000 registros. Los stocks son techos, no
--     compromisos: el premio digital no dado no cuesta nada.
--   · Tier-ups y créditos PRIMADOS (prioridad Francesc: upsell gratis).
--   · Exclusiones: ganador de baúl no puede ganar el Gordo de la temporada;
--     nadie gana 2 baúles por temporada. Nada más se excluye.
--
-- QUÉ VALIDAR ANTES DE EJECUTAR (los TODO del fichero):
--   1. Stocks y pesos: PROPUESTA v2 (pesos ya primados hacia upsell).
--      El peso es relativo dentro del pool apto para el plan del usuario.
--   2. Fechas: campaña 10-09 → 30-11 (temporada 1 entera). Sorteos de
--      calendario: baúles 30-09 / 31-10 / 30-11 · Gordo 30-11 (propuesto).
--   3. La activación del D-day: UPDATE al final del fichero (o vía cron).
--
-- REQUISITO TÉCNICO PREVIO al prompt Lovable nº 2: tanda SQL 3 con la tabla
-- rebotica_calendar_draws (registra las adjudicaciones de baúl/Gordo sin
-- violar el UNIQUE(user_id, campaign_id) de rebotica_openings).
--
-- Idempotente: relanzable sin duplicar (guardas por nombre/título).
-- Reglas: la Rebotica REGALA (0 descuentos) · suscripción solo como tier-up
-- (Gratis→Plus, Plus→Equipo; Equipo no recibe suscripción) · caducidad
-- 7-14 días · deontológico (nada sanitario).
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

  -- =====================================================================
  -- 2. POOL DEL SORTEO INSTANTÁNEO (peso > 0)
  -- Formato: titulo, descripcion, tipo, tier, valor, stock_total, peso, caducidad, incomprable
  -- =====================================================================

  -- 2.1 · Plantilla "solo cajón" (base digital, sin límite práctico)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'Plantilla exclusiva de la Rebotica') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'Plantilla exclusiva de la Rebotica',
      'Una plantilla premium de trabajo (solo se consigue en un cajón, no se puede comprar). Lista para usar en tu farmacia.',
      'contenido', 'todos', 29, 999999, 330, 14, true);
  END IF;

  -- 2.2 · Masterclass del vault (base digital, sin límite práctico)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'Masterclass del vault') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'Masterclass del vault',
      'Acceso a una masterclass grabada (20-30 min) que no está en el catálogo: solo sale de los cajones.',
      'contenido', 'todos', 49, 999999, 240, 14, true);
  END IF;

  -- 2.3 · +3 créditos de imagen IAFarma (PRIMADO: hace probar y gastar)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = '3 créditos de imagen IAFarma') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, '3 créditos de imagen IAFarma',
      'Tres imágenes extra con IAFarma este mes: carteles, posts y promos para tu farmacia.',
      'credito_ia', 'todos', 9, 999999, 220, 14, false);
  END IF;

  -- 2.4 · Recurso premium desbloqueado (solo Gratis: degustación, PRIMADO)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'Recurso premium desbloqueado') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'Recurso premium desbloqueado',
      'Elige un recurso premium del catálogo y es tuyo, sin ser Plus.',
      'contenido', 'gratis', 19, 999999, 80, 14, false);
  END IF;

  -- 2.5 · Tier-up: 1 mes de Plus (SOLO pool de Gratis; conversión, PRIMADO)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = '1 mes de Plus gratis') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, '1 mes de Plus gratis',
      'Un mes entero del plan Plus, de regalo y sin compromiso: pruébalo todo.',
      'producto_propio', 'gratis', 20, 30, 25, 7, false);
  END IF;

  -- 2.6 · Tier-up: 1 mes de Equipo (SOLO pool de Plus; upsell 3 plazas, PRIMADO)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = '1 mes de Equipo gratis') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, '1 mes de Equipo gratis',
      'Un mes del plan Equipo para ti y tu gente (hasta 10 personas), sin compromiso.',
      'producto_propio', 'plus', 49, 10, 12, 7, false);
  END IF;

  -- 2.7 · Consulta exprés con Alejandro (15 min, cupo real)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'Consulta exprés de 15 minutos con Alejandro') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'Consulta exprés de 15 minutos con Alejandro',
      'Videollamada de 15 minutos con nuestro director de estrategia para UNA consulta concreta de marketing o gestión.',
      'servicio', 'todos', 60, 2, 5, 14, true);
  END IF;

  -- 2.8 · Radiografía digital exprés (informe manual personalizado en PDF)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'Radiografía digital exprés de tu farmacia') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'Radiografía digital exprés de tu farmacia',
      'Informe personalizado en PDF con capturas reales de tu presencia digital (Google, web, redes) y 3 acciones priorizadas. Hecho a mano por el equipo.',
      'servicio', 'todos', 90, 3, 4, 14, true);
  END IF;

  -- 2.9 · Tu duda respondida en la newsletter (el canje ES el formulario de la duda)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'Tu duda, respondida en la newsletter') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'Tu duda, respondida en la newsletter',
      'Nos mandas tu duda de gestión o marketing y la respondemos con nombre (o sin él, tú eliges) en la próxima edición de Impulso.',
      'servicio', 'todos', 30, 2, 3, 14, true);
  END IF;

  -- =====================================================================
  -- 3. PREMIOS DE CALENDARIO (peso = 0: NO entran en el sorteo instantáneo)
  -- Los adjudica el cron por sorteo entre las aperturas del período
  -- (rebotica_openings del mes/temporada) y quedan registrados en la tabla
  -- rebotica_calendar_draws (tanda SQL 3). Exclusiones en el sorteo:
  -- ganador de baúl fuera del Gordo; máximo 1 baúl por usuario y temporada.
  -- =====================================================================

  -- 3.1 · EL BAÚL (1/MES: sorteos 30-09, 31-10, 30-11 · stock 3 + 1 reserva física)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'El baúl de la Rebotica') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'El baúl de la Rebotica',
      'Cada mes, una caja llena de cosas buenas llega a la farmacia ganadora: carta personal de Alejandro, las cartas de la Rebotica, el cuaderno del mostrador, galletas artesanas, chocolate, gominolas, una vela, una plantita, 1 mes del plan Equipo y 20 créditos IAFarma. Todos los cajones abiertos en el mes participan en el sorteo.',
      'producto_propio', 'todos', 120, 3, 0, 14, true);
  END IF;

  -- 3.2 · EL GORDO (1/TRIMESTRE: sorteo 30-11 entre toda la temporada)
  IF NOT EXISTS (SELECT 1 FROM public.rebotica_prizes WHERE campaign_id = v_camp AND titulo = 'EL GORDO: Auditoría Farmacia Silenciosa completa') THEN
    INSERT INTO public.rebotica_prizes (campaign_id, titulo, descripcion, tipo, tier, valor_percibido_eur, stock_total, peso, caducidad_dias, incomprable)
    VALUES (v_camp, 'EL GORDO: Auditoría Farmacia Silenciosa completa',
      'El premio grande del trimestre: una Auditoría Farmacia Silenciosa completa en tu farmacia (visita de evaluación anónima + informe + sesión de resultados). Valor real: desde 360 euros. El ganador recibe una llamada de Alejandro — y una única regla: no contárselo a nadie hasta después de la visita.',
      'gordo', 'todos', 360, 1, 0, 14, true);
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
--   (los 2 premios con peso 0 = calendario; el resto = sorteo instantáneo)
--
-- Si ejecutaste la v1 de este borrador (10-07): borra antes los premios de la
-- campaña y relanza (los stocks/pesos v1 quedaron obsoletos):
--   DELETE FROM public.rebotica_prizes WHERE campaign_id IN
--     (SELECT id FROM public.rebotica_campaigns WHERE nombre LIKE 'Cajón de Bienvenida%');
--
-- Activación en el D-day (NO antes):
--   UPDATE public.rebotica_campaigns SET estado = 'activa'
--     WHERE nombre = 'Cajón de Bienvenida · Temporada 1';
-- =====================================================================
