-- =====================================================================
-- La Rebotica · tanda5: cajón por farmacia (no por usuario) en equipos.
-- Decisión de producto (16-07-2026): en el plan Equipo, el cajón CON premio
-- real es 1 por farmacia y solo lo abre el titular. El resto de miembros del
-- equipo sí pueden abrir su cajón cada quincena, pero en vez de un premio
-- real generan 1 PARTICIPACIÓN para su farmacia en los sorteos periódicos
-- (El Baúl, mensual; El Gordo, trimestral — cadencia ya anunciada en el copy
-- de la landing, src/pages/Rebotica.tsx PRIZES). Cuentas individuales
-- (gratis/plus, sin equipo) siguen exactamente igual que hoy: 1 cajón con
-- premio real por campaña.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) rebotica_openings: una apertura ya no implica siempre premio real.
--    prize_id pasa a nullable; reward_type distingue el caso, y
--    team_subscription_id deja trazado de qué farmacia viene (NULL si el
--    usuario no tiene equipo).
-- ---------------------------------------------------------------------
ALTER TABLE public.rebotica_openings
  ALTER COLUMN prize_id DROP NOT NULL,
  ADD COLUMN reward_type text NOT NULL DEFAULT 'premio' CHECK (reward_type IN ('premio', 'participacion')),
  ADD COLUMN team_subscription_id uuid REFERENCES public.team_subscriptions(id) ON DELETE SET NULL;

ALTER TABLE public.rebotica_openings
  ADD CONSTRAINT rebotica_openings_prize_or_participacion CHECK (
    (reward_type = 'premio'        AND prize_id IS NOT NULL) OR
    (reward_type = 'participacion' AND prize_id IS NULL)
  );

CREATE INDEX IF NOT EXISTS idx_rebotica_openings_team_subscription_id
  ON public.rebotica_openings(team_subscription_id) WHERE team_subscription_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 2) rebotica_participaciones: 1 fila = 1 billete de una farmacia para un
--    sorteo (baul/gordo) de un periodo concreto. El nº de filas de una
--    farmacia en un periodo ES su nº de billetes — el sorteo ponderado se
--    resuelve solo con un ORDER BY random() sobre esta tabla, sin tener
--    que calcular pesos a mano.
-- ---------------------------------------------------------------------
CREATE TABLE public.rebotica_participaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_subscription_id uuid NOT NULL REFERENCES public.team_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opening_id uuid NOT NULL REFERENCES public.rebotica_openings(id) ON DELETE CASCADE,
  sorteo_tipo text NOT NULL CHECK (sorteo_tipo IN ('baul', 'gordo')),
  periodo text NOT NULL, -- 'YYYY-MM' para baul, 'YYYY-Q1'..'YYYY-Q4' para gordo
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opening_id, sorteo_tipo) -- una apertura da como mucho 1 billete por tipo de sorteo
);

CREATE INDEX idx_rebotica_participaciones_periodo ON public.rebotica_participaciones(sorteo_tipo, periodo);
CREATE INDEX idx_rebotica_participaciones_team ON public.rebotica_participaciones(team_subscription_id);

COMMENT ON TABLE public.rebotica_participaciones IS
  'Billetes de sorteo por farmacia. Cada apertura de un miembro no-titular de un equipo genera 1 fila por sorteo activo (normalmente baul + gordo).';

-- ---------------------------------------------------------------------
-- 3) rebotica_sorteos: registro del resultado de cada sorteo ejecutado.
--    Visible para cualquier usuario autenticado (transparencia del sorteo,
--    coherente con /rebotica/bases-legales), gestionable solo por admin.
-- ---------------------------------------------------------------------
CREATE TABLE public.rebotica_sorteos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('baul', 'gordo')),
  periodo text NOT NULL,
  ganador_team_subscription_id uuid REFERENCES public.team_subscriptions(id) ON DELETE SET NULL,
  total_participaciones int NOT NULL DEFAULT 0,
  sorteado_at timestamptz NOT NULL DEFAULT now(),
  sorteado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, periodo) -- un periodo no se sortea dos veces
);

COMMENT ON TABLE public.rebotica_sorteos IS
  'Resultado de cada sorteo de El Baúl (mensual) / El Gordo (trimestral). Un periodo solo se sortea una vez (UNIQUE tipo+periodo).';

-- ---------------------------------------------------------------------
-- 4) RLS
-- ---------------------------------------------------------------------
ALTER TABLE public.rebotica_participaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own participaciones"
  ON public.rebotica_participaciones FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_current_user_admin());

CREATE POLICY "Admins can manage participaciones"
  ON public.rebotica_participaciones FOR ALL TO authenticated
  USING (public.is_current_user_admin());

ALTER TABLE public.rebotica_sorteos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view sorteos"
  ON public.rebotica_sorteos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sorteos"
  ON public.rebotica_sorteos FOR ALL TO authenticated
  USING (public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 5) rebotica_pick_and_consume_prize — elige un premio real ponderado por
--    `peso` entre los que tienen stock, filtrado por tier, y decrementa su
--    stock atómicamente (FOR UPDATE SKIP LOCKED evita carreras si dos
--    titulares abren a la vez). SOLO la llama open-reward con service_role.
--    Patrón de selección ponderada: ORDER BY -ln(random())/peso (Efraimidis
--    -Spirakis) — a más peso, más probabilidad, sin necesitar normalizar.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rebotica_pick_and_consume_prize(
  p_campaign_id uuid,
  p_tier text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_prize_id uuid;
BEGIN
  SELECT id INTO v_prize_id
    FROM public.rebotica_prizes
   WHERE campaign_id = p_campaign_id
     AND stock_restante > 0
     AND tier IN ('todos', p_tier)
   ORDER BY -ln(random()) / peso
   LIMIT 1
   FOR UPDATE SKIP LOCKED;

  IF v_prize_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.rebotica_prizes
     SET stock_restante = stock_restante - 1,
         updated_at = now()
   WHERE id = v_prize_id;

  RETURN v_prize_id;
END;
$$;

REVOKE ALL ON FUNCTION public.rebotica_pick_and_consume_prize(uuid, text) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------
-- 6) ejecutar_sorteo_rebotica — cierra un periodo y elige ganador entre las
--    farmacias con billetes (rebotica_participaciones), ponderado por nº de
--    billetes (ORDER BY random() sobre las filas = ya está ponderado: quien
--    tiene más filas tiene más probabilidad). Expuesta a authenticated pero
--    con chequeo de admin interno — pensada para dispararse a mano desde un
--    panel admin, NO hay cron automático: un sorteo con premio real
--    (Auditoría Farmacia Silenciosa valorada en 360€+) debe ejecutarse con
--    supervisión, no solo.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ejecutar_sorteo_rebotica(
  p_tipo text,
  p_periodo text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ganador_team_id uuid;
  v_sorteo_id uuid;
  v_total_participaciones int;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Solo un admin puede ejecutar sorteos';
  END IF;

  IF p_tipo NOT IN ('baul', 'gordo') THEN
    RAISE EXCEPTION 'Tipo de sorteo inválido: %', p_tipo;
  END IF;

  IF EXISTS (SELECT 1 FROM public.rebotica_sorteos WHERE tipo = p_tipo AND periodo = p_periodo) THEN
    RAISE EXCEPTION 'El sorteo % de % ya se ejecutó', p_tipo, p_periodo;
  END IF;

  SELECT count(*) INTO v_total_participaciones
    FROM public.rebotica_participaciones
   WHERE sorteo_tipo = p_tipo AND periodo = p_periodo;

  IF v_total_participaciones = 0 THEN
    RAISE EXCEPTION 'No hay participaciones para % de %', p_tipo, p_periodo;
  END IF;

  SELECT team_subscription_id INTO v_ganador_team_id
    FROM public.rebotica_participaciones
   WHERE sorteo_tipo = p_tipo AND periodo = p_periodo
   ORDER BY random()
   LIMIT 1;

  INSERT INTO public.rebotica_sorteos
         (tipo, periodo, ganador_team_subscription_id, total_participaciones, sorteado_at, sorteado_por)
  VALUES (p_tipo, p_periodo, v_ganador_team_id, v_total_participaciones, now(), auth.uid())
  RETURNING id INTO v_sorteo_id;

  RETURN v_sorteo_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ejecutar_sorteo_rebotica(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ejecutar_sorteo_rebotica(text, text) TO authenticated;
