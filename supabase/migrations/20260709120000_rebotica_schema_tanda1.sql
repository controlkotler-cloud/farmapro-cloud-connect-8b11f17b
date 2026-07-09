-- =====================================================================
-- La Rebotica — Tanda SQL 1 (esquema §2.1 del plan maestro)
-- portal-plan-rebotica-maestro.md · impulso/memory/project_rebotica_portal.md
--
-- Contenido: rebotica_partners, rebotica_campaigns, rebotica_prizes,
-- rebotica_openings, consent_ledger + RLS + vistas admin (v_rebotica_dashboard,
-- v_rebotica_consentimientos_diarios).
--
-- Idempotente: se puede volver a ejecutar sin romper nada (CREATE TABLE/INDEX
-- IF NOT EXISTS, CREATE OR REPLACE TRIGGER/VIEW/FUNCTION, DROP POLICY IF EXISTS
-- + CREATE POLICY).
--
-- Decisión de diseño: columnas de clasificación (estado, tipo, tier, source...)
-- van como TEXT + CHECK, no como PG ENUM. El plan §2.1 marca explícitamente
-- "source(text: ...)" en rebotica_openings y el roadmap (fase 2, Fórmula
-- Magistral, nuevos orígenes de apertura) va a añadir valores con frecuencia:
-- alterar un CHECK es una operación ligera, alterar un ENUM en Postgres no.
--
-- Fuera de esta tanda (fase server-side, §2.2 del plan, vía Lovable):
-- edge functions open-reward / redeem-reward, cron quincenal, templates email,
-- hook en handle_new_user. No se toca handle_new_user aquí para no interferir
-- con el flujo de alta ya en producción.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. rebotica_partners (sin dependencias)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rebotica_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  contacto TEXT,
  tipo TEXT NOT NULL DEFAULT 'patrocinio'
    CHECK (tipo IN ('patrocinio', 'especie', 'ambos')),
  estado TEXT NOT NULL DEFAULT 'pipeline'
    CHECK (estado IN ('pipeline', 'contactado', 'negociacion', 'cerrado', 'activo', 'finalizado', 'descartado')),
  notas TEXT,
  opt_in_texto TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.rebotica_partners IS
  'Pipeline comercial de partners de la Rebotica (§5 del plan maestro). Solo admin/service_role: nunca se expone la lista a clientes.';

-- ---------------------------------------------------------------------
-- 2. rebotica_campaigns
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rebotica_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  quincena_inicio DATE NOT NULL,
  quincena_fin DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'draft'
    CHECK (estado IN ('draft', 'activa', 'cerrada')),
  partner_id UUID REFERENCES public.rebotica_partners(id) ON DELETE SET NULL,
  tema TEXT,
  email_campaign_ref TEXT,
  skin TEXT NOT NULL DEFAULT 'cajonera'
    CHECK (skin IN ('cajonera', 'eonbox')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (quincena_fin >= quincena_inicio)
);

COMMENT ON TABLE public.rebotica_campaigns IS
  'Campañas quincenales de la Rebotica. skin=eonbox para quincenas patrocinadas por Apotheka (demo dossier-partner-rebotica/demo-eonbox-rebotica.html).';

CREATE INDEX IF NOT EXISTS idx_rebotica_campaigns_estado ON public.rebotica_campaigns(estado);
CREATE INDEX IF NOT EXISTS idx_rebotica_campaigns_partner_id ON public.rebotica_campaigns(partner_id);

-- ---------------------------------------------------------------------
-- 3. rebotica_prizes
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rebotica_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.rebotica_campaigns(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL
    CHECK (tipo IN ('producto_propio', 'credito_ia', 'contenido', 'servicio', 'partner_especie', 'gordo')),
  tier TEXT NOT NULL DEFAULT 'todos'
    CHECK (tier IN ('gratis', 'plus', 'equipo', 'todos')),
  valor_percibido_eur NUMERIC(10, 2),
  stock_total INTEGER NOT NULL CHECK (stock_total >= 0),
  stock_restante INTEGER NOT NULL CHECK (stock_restante >= 0),
  peso INTEGER NOT NULL DEFAULT 1 CHECK (peso > 0),
  caducidad_dias INTEGER NOT NULL DEFAULT 7 CHECK (caducidad_dias > 0),
  partner_id UUID REFERENCES public.rebotica_partners(id) ON DELETE SET NULL,
  incomprable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (stock_restante <= stock_total)
);

COMMENT ON TABLE public.rebotica_prizes IS
  'Premios por campaña. peso = ponderación del sorteo (edge open-reward, fase 2). stock_restante se decrementa de forma atómica, mismo patrón que consume_image_credit.';

CREATE INDEX IF NOT EXISTS idx_rebotica_prizes_campaign_id ON public.rebotica_prizes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_rebotica_prizes_partner_id ON public.rebotica_prizes(partner_id);

-- Comodidad para el SQL editor: si no se indica stock_restante al insertar,
-- arranca igual a stock_total (evita repetir el valor a mano en cada premio).
CREATE OR REPLACE FUNCTION public.rebotica_prizes_default_stock_restante()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.stock_restante IS NULL THEN
    NEW.stock_restante := NEW.stock_total;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_rebotica_prizes_default_stock_restante
  BEFORE INSERT ON public.rebotica_prizes
  FOR EACH ROW
  EXECUTE FUNCTION public.rebotica_prizes_default_stock_restante();

-- ---------------------------------------------------------------------
-- 4. rebotica_openings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rebotica_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.rebotica_campaigns(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES public.rebotica_prizes(id) ON DELETE RESTRICT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL DEFAULT 'welcome'
    CHECK (source IN ('welcome', 'quincena', 'aniversario', 'equipo')),
  email_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, campaign_id)
);

COMMENT ON TABLE public.rebotica_openings IS
  'Una apertura por usuario y campaña (UNIQUE user_id+campaign_id = idempotencia del sorteo, ver plan §2.2). Insert/update vía edge functions con service_role (open-reward/redeem-reward, fase 2); RLS solo permite lectura de la fila propia.';

CREATE INDEX IF NOT EXISTS idx_rebotica_openings_user_id ON public.rebotica_openings(user_id);
CREATE INDEX IF NOT EXISTS idx_rebotica_openings_campaign_id ON public.rebotica_openings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_rebotica_openings_prize_id ON public.rebotica_openings(prize_id);
CREATE INDEX IF NOT EXISTS idx_rebotica_openings_expires_pending
  ON public.rebotica_openings(expires_at) WHERE redeemed_at IS NULL;

-- ---------------------------------------------------------------------
-- 5. consent_ledger
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consent_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  tipo TEXT NOT NULL
    CHECK (tipo IN ('rgpd', 'comercial', 'partner_optin')),
  texto_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL
    CHECK (source IN ('registro', 'canje', 'reto', 'descargable')),
  ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.consent_ledger IS
  'Prueba art. 7.1 RGPD: versión literal del texto aceptado + fecha + origen + IP (plan §3). KPI norte del lanzamiento (§1: 30% de la lista activa en 90 días, tipo=rgpd). user_id nullable: hay consentimientos capturados antes del alta (partner_optin, descargable). Escritura server-side only (service_role / triggers SECURITY DEFINER); sin políticas de escritura para anon/authenticated por diseño.';

CREATE INDEX IF NOT EXISTS idx_consent_ledger_user_id ON public.consent_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_ledger_email ON public.consent_ledger(email);
CREATE INDEX IF NOT EXISTS idx_consent_ledger_tipo_accepted_at ON public.consent_ledger(tipo, accepted_at);

-- ---------------------------------------------------------------------
-- 6. Triggers updated_at (reutiliza public.update_updated_at_column(), ya
--    existente en la base real aunque no viva en una migración versionada
--    — mismo caso que el enum user_role, ver impulso/memory §verificación).
-- ---------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_rebotica_partners_updated_at
  BEFORE UPDATE ON public.rebotica_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_rebotica_campaigns_updated_at
  BEFORE UPDATE ON public.rebotica_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_rebotica_prizes_updated_at
  BEFORE UPDATE ON public.rebotica_prizes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 7. RLS
-- ---------------------------------------------------------------------
ALTER TABLE public.rebotica_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rebotica_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rebotica_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rebotica_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_ledger ENABLE ROW LEVEL SECURITY;

-- rebotica_partners: solo admin/service_role (nunca se expone a clientes).
DROP POLICY IF EXISTS "Admins can manage partners" ON public.rebotica_partners;
CREATE POLICY "Admins can manage partners" ON public.rebotica_partners
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- rebotica_campaigns: autenticados ven campañas activas; admin gestiona todo.
DROP POLICY IF EXISTS "Authenticated can view active campaigns" ON public.rebotica_campaigns;
CREATE POLICY "Authenticated can view active campaigns" ON public.rebotica_campaigns
  FOR SELECT TO authenticated
  USING (estado = 'activa' OR public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.rebotica_campaigns;
CREATE POLICY "Admins can manage campaigns" ON public.rebotica_campaigns
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- rebotica_prizes: lectura de premios de campañas activas; admin gestiona todo.
DROP POLICY IF EXISTS "Authenticated can view prizes of active campaigns" ON public.rebotica_prizes;
CREATE POLICY "Authenticated can view prizes of active campaigns" ON public.rebotica_prizes
  FOR SELECT TO authenticated
  USING (
    public.is_current_user_admin()
    OR EXISTS (
      SELECT 1 FROM public.rebotica_campaigns c
      WHERE c.id = rebotica_prizes.campaign_id AND c.estado = 'activa'
    )
  );

DROP POLICY IF EXISTS "Admins can manage prizes" ON public.rebotica_prizes;
CREATE POLICY "Admins can manage prizes" ON public.rebotica_prizes
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- rebotica_openings: cada usuario lee solo lo suyo; admin lee/gestiona todo.
-- Sin política de INSERT/UPDATE para authenticated: el sorteo y el canje son
-- server-side (edge functions con service_role, plan §2.2).
DROP POLICY IF EXISTS "Users can view own openings" ON public.rebotica_openings;
CREATE POLICY "Users can view own openings" ON public.rebotica_openings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage openings" ON public.rebotica_openings;
CREATE POLICY "Admins can manage openings" ON public.rebotica_openings
  FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- consent_ledger: solo admin lee (auditoría/dashboard); escritura server-side only.
DROP POLICY IF EXISTS "Admins can view consent_ledger" ON public.consent_ledger;
CREATE POLICY "Admins can view consent_ledger" ON public.consent_ledger
  FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 8. Vistas admin (plan §2.1: "aperturas, canjes, consentimientos/día, stock").
--    Definer-style (owner de la vista bypassa RLS de las tablas base) con la
--    condición is_current_user_admin() incrustada como gate — mismo patrón
--    de exposición controlada que public.profiles_public, pero en sentido
--    restrictivo: cero filas para cualquiera que no sea admin.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_rebotica_dashboard AS
SELECT
  c.id AS campaign_id,
  c.nombre AS campaign_nombre,
  c.estado AS campaign_estado,
  c.skin,
  c.quincena_inicio,
  c.quincena_fin,
  c.partner_id,
  COUNT(DISTINCT p.id) AS premios_total,
  COALESCE(SUM(p.stock_total), 0) AS stock_total,
  COALESCE(SUM(p.stock_restante), 0) AS stock_restante,
  COALESCE(SUM(p.stock_total) - SUM(p.stock_restante), 0) AS stock_consumido,
  COUNT(DISTINCT o.id) AS aperturas,
  COUNT(DISTINCT o.id) FILTER (WHERE o.redeemed_at IS NOT NULL) AS canjes,
  ROUND(
    CASE WHEN COUNT(DISTINCT o.id) = 0 THEN 0
    ELSE COUNT(DISTINCT o.id) FILTER (WHERE o.redeemed_at IS NOT NULL)::numeric
         / COUNT(DISTINCT o.id) * 100
    END, 1
  ) AS pct_canje,
  COUNT(DISTINCT o.id) FILTER (WHERE o.redeemed_at IS NULL AND o.expires_at < now()) AS caducados_sin_canjear
FROM public.rebotica_campaigns c
LEFT JOIN public.rebotica_prizes p ON p.campaign_id = c.id
LEFT JOIN public.rebotica_openings o ON o.campaign_id = c.id
WHERE public.is_current_user_admin()
GROUP BY c.id, c.nombre, c.estado, c.skin, c.quincena_inicio, c.quincena_fin, c.partner_id
ORDER BY c.quincena_inicio DESC;

COMMENT ON VIEW public.v_rebotica_dashboard IS
  'Panel admin por campaña: premios/stock, aperturas, canjes, % canje, caducados sin canjear. Cero filas si quien consulta no es admin (gate incrustado).';

CREATE OR REPLACE VIEW public.v_rebotica_consentimientos_diarios AS
SELECT
  date_trunc('day', accepted_at)::date AS dia,
  tipo,
  source,
  COUNT(*) AS consentimientos,
  COUNT(DISTINCT COALESCE(user_id::text, email)) AS personas_unicas
FROM public.consent_ledger
WHERE public.is_current_user_admin()
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

COMMENT ON VIEW public.v_rebotica_consentimientos_diarios IS
  'Serie diaria de consent_ledger por tipo/origen — seguimiento del KPI norte (§1 y §3 del plan maestro: 30% de la lista activa en 90 días). Cero filas si quien consulta no es admin.';

REVOKE ALL ON public.v_rebotica_dashboard FROM PUBLIC, anon;
GRANT SELECT ON public.v_rebotica_dashboard TO authenticated;

REVOKE ALL ON public.v_rebotica_consentimientos_diarios FROM PUBLIC, anon;
GRANT SELECT ON public.v_rebotica_consentimientos_diarios TO authenticated;

REVOKE ALL ON FUNCTION public.rebotica_prizes_default_stock_restante() FROM PUBLIC, anon, authenticated;
