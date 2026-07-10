-- =====================================================================
-- REBOTICA · TANDA SQL 2 (2026-07-10) — idempotente, relanzable
-- Ejecutar COMPLETA en el SQL editor de Lovable (las migraciones no se
-- autoaplican). Cubre los hallazgos A5, A6, A13 y X5 del análisis 10-07:
--   1. 'reto' como origen válido de apertura (Cajón del Reto de 21 días)
--   2. consent_ledger: escritura automática en el registro (KPI nº 1)
--      vía handle_new_user (lee los checks que el AuthForm ya envía en
--      user_metadata: consent_rgpd / consent_comercial / texto_version)
--   3. RLS de rebotica_prizes: retirar la lectura de authenticated
--      (exponía peso y stock del sorteo; el sorteo va con service_role)
--   4. Documentar la columna incomprable
--   5. get_course_modules: la prueba de 30 días NO accede a premium
--      (decisión X5) + tope server-side de 2 cursos en la prueba +
--      free_locked sin contenido (solo ficha)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Origen 'reto' en rebotica_openings.source (bloqueante del reto 21d)
-- ---------------------------------------------------------------------
ALTER TABLE public.rebotica_openings
  DROP CONSTRAINT IF EXISTS rebotica_openings_source_check;
ALTER TABLE public.rebotica_openings
  ADD CONSTRAINT rebotica_openings_source_check
  CHECK (source IN ('welcome', 'quincena', 'aniversario', 'equipo', 'reto'));

COMMENT ON COLUMN public.rebotica_openings.source IS
  'Origen de la apertura: welcome (cajón de bienvenida), quincena, aniversario, equipo, reto (premio final del reto de 21 días; pool de PAGO, decisión Francesc 09-07).';

-- ---------------------------------------------------------------------
-- 2. Consentimiento en el registro → consent_ledger (KPI nº 1)
--    El AuthForm (commit 10-07) envía en user_metadata:
--      consent_rgpd (bool) · consent_comercial (bool)
--      consent_texto_version (text) · consent_accepted_at (ISO)
--    handle_new_user vuelca ambos consentimientos como filas del ledger.
--    Incluye TAMBIÉN, de forma idempotente, los prerrequisitos de las
--    tandas 2b/2e (cif + columnas utm) por si alguna no llegó a aplicarse.
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cif text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cif_unique
  ON public.profiles (upper(trim(cif))) WHERE cif IS NOT NULL AND trim(cif) <> '';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS landing_page text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_texto_version text := NULLIF(trim(NEW.raw_user_meta_data->>'consent_texto_version'), '');
  v_accepted_at timestamptz := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'consent_accepted_at', '')::timestamptz,
    now()
  );
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, cif,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_page)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(trim(NEW.raw_user_meta_data->>'cif'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_source'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_medium'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_campaign'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_term'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'utm_content'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'landing_page'), '')
  );

  -- Consent ledger (prueba art. 7.1 RGPD). Solo se escribe si el registro
  -- trajo los checks (los registros antiguos o de admin no fallan).
  IF (NEW.raw_user_meta_data->>'consent_rgpd') = 'true' AND v_texto_version IS NOT NULL THEN
    INSERT INTO public.consent_ledger (user_id, email, tipo, texto_version, accepted_at, source)
    VALUES (NEW.id, NEW.email, 'rgpd', v_texto_version, v_accepted_at, 'registro');
  END IF;

  IF (NEW.raw_user_meta_data->>'consent_comercial') = 'true' AND v_texto_version IS NOT NULL THEN
    INSERT INTO public.consent_ledger (user_id, email, tipo, texto_version, accepted_at, source)
    VALUES (NEW.id, NEW.email, 'comercial', v_texto_version, v_accepted_at, 'registro');
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- 3. RLS rebotica_prizes: fuera la lectura de authenticated (A6).
--    Exponía peso (probabilidades del sorteo), stock_restante y valor.
--    La UI no la usa; el sorteo y cualquier listado público van por edge
--    function con service_role o, si algún día hace falta enseñar
--    "posibles premios", por una vista sin columnas sensibles.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can view prizes of active campaigns" ON public.rebotica_prizes;
-- (Se conserva "Admins can manage prizes". rebotica_campaigns mantiene su
--  lectura de campañas activas: nombre/tema/skin no son sensibles.)

-- ---------------------------------------------------------------------
-- 4. Documentación de la columna incomprable (A13)
-- ---------------------------------------------------------------------
COMMENT ON COLUMN public.rebotica_prizes.incomprable IS
  'TRUE = premio que no se puede comprar con dinero (exclusividad de cajón: masterclass del vault, plantilla solo-cajón, baúl del Gordo). Solo etiqueta/comunicación; no afecta al sorteo.';

-- ---------------------------------------------------------------------
-- 5. get_course_modules v2 (X5 + P5, decisión Francesc 10-07):
--    · La prueba de 30 días NO accede a cursos premium (antes sí).
--    · La prueba tiene tope de 2 cursos distintos también en servidor
--      (course_enrollments; el curso ya empezado no se bloquea).
--    · free_locked (día 31+ sin pagar) ve la ficha pero no el contenido.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_course_modules(p_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_course record;
  v_role text;
  v_created timestamptz;
  v_paid boolean := false;
  v_in_trial boolean := false;
  v_enrolled boolean := false;
  v_course_count integer := 0;
BEGIN
  SELECT id, is_premium, is_published, course_modules
    INTO v_course
    FROM public.courses
    WHERE id = p_course_id;
  IF NOT FOUND OR NOT v_course.is_published THEN
    IF NOT public.is_current_user_admin() THEN
      RETURN '[]'::jsonb;
    END IF;
  END IF;

  IF public.is_current_user_admin() THEN
    RETURN COALESCE(v_course.course_modules, '[]'::jsonb);
  END IF;

  IF v_uid IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT subscription_role::text, created_at
    INTO v_role, v_created
    FROM public.profiles WHERE id = v_uid;

  v_paid := v_role IN ('plus','equipo','premium','profesional','admin');
  v_in_trial := (NOT v_paid)
    AND v_created IS NOT NULL
    AND v_created > (now() - interval '30 days');

  -- Cursos premium: SOLO planes de pago (X5: la prueba no accede a premium).
  IF v_course.is_premium THEN
    IF v_paid THEN
      RETURN COALESCE(v_course.course_modules, '[]'::jsonb);
    END IF;
    RETURN '[]'::jsonb;
  END IF;

  -- Cursos NO premium: pago sin límite; prueba con tope de 2 cursos
  -- distintos (un curso ya empezado nunca se corta a mitad); bloqueado
  -- (día 31+) ve la ficha en el catálogo pero no el contenido.
  IF v_paid THEN
    RETURN COALESCE(v_course.course_modules, '[]'::jsonb);
  END IF;

  IF v_in_trial THEN
    SELECT EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE user_id = v_uid AND course_id = p_course_id
    ) INTO v_enrolled;
    IF v_enrolled THEN
      RETURN COALESCE(v_course.course_modules, '[]'::jsonb);
    END IF;
    SELECT count(DISTINCT course_id) INTO v_course_count
      FROM public.course_enrollments
      WHERE user_id = v_uid;
    IF v_course_count < 2 THEN
      RETURN COALESCE(v_course.course_modules, '[]'::jsonb);
    END IF;
    RETURN '[]'::jsonb;
  END IF;

  RETURN '[]'::jsonb;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_course_modules(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_course_modules(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- Verificación rápida (opcional, solo lectura):
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--     WHERE conrelid = 'public.rebotica_openings'::regclass AND conname LIKE '%source%';
--   SELECT policyname FROM pg_policies WHERE tablename = 'rebotica_prizes';
--   SELECT prosrc LIKE '%consent_ledger%' AS hook_ok FROM pg_proc WHERE proname = 'handle_new_user';
-- =====================================================================
