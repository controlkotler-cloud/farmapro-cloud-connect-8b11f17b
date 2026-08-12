-- =====================================================================
-- TANDA SQL 4 · Plan Equipo / "Mi farmacia" · 2026-07-15
-- Idempotente: se puede relanzar sin romper nada.
-- Spec completa: docs/plan-equipo-mi-farmacia-SPEC.md
-- DEBE ejecutarse ANTES de enviar el prompt Lovable nº 1 v4
-- (el stripe-webhook llamará a ensure_team_subscription y
--  deactivate_team_for_owner, definidas aquí).
--
-- Decisiones cerradas por Francesc (15-07):
--   · 10 personas EN TOTAL = titular + 9 invitaciones (max_members = 9).
--   · El titular ve el progreso FORMATIVO por persona (cursos + evaluaciones
--     + última actividad). Foro, IAFarma y Rebotica quedan privados.
--   · Los miembros NO se ven entre sí (fase 2: ranking interno opcional).
--   · La gestión vive en página propia /mi-farmacia (solo titular).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Plazas: titular + 9 (el default de marzo era 5 y el pricing dice 10 personas)
-- ---------------------------------------------------------------------
ALTER TABLE public.team_subscriptions ALTER COLUMN max_members SET DEFAULT 9;
UPDATE public.team_subscriptions SET max_members = 9 WHERE max_members <> 9;

-- ---------------------------------------------------------------------
-- 2) Invitaciones: caducidad real (14 días) + sin duplicados vivos
-- ---------------------------------------------------------------------
ALTER TABLE public.team_members
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '14 days');

-- Backfill de las pendientes que quedaron sin caducidad
UPDATE public.team_members
   SET expires_at = invited_at + interval '14 days'
 WHERE status = 'pending' AND expires_at IS NULL;

-- Un mismo email no puede tener dos plazas/invitaciones vivas en el mismo equipo.
-- Parcial: las filas 'inactive' no bloquean re-invitar a alguien retirado.
CREATE UNIQUE INDEX IF NOT EXISTS team_members_team_email_alive_uidx
  ON public.team_members (team_id, lower(email))
  WHERE status <> 'inactive';

-- ---------------------------------------------------------------------
-- 3) validate_team_invitation v2 — SIN team_id (la página /invitation solo
--    tiene el token; la versión de 3 parámetros exigía un team_id que el
--    frontend nunca envía → aceptar la invitación estaba roto).
--    Se eliminan TODOS los overloads previos (lección PGRST203 del smoke test).
-- ---------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'validate_team_invitation'
  LOOP
    EXECUTE 'DROP FUNCTION ' || r.sig;
  END LOOP;
END $$;

CREATE FUNCTION public.validate_team_invitation(
  invitation_token_param text,
  user_email_param text
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.team_members tm
      JOIN public.team_subscriptions ts ON ts.id = tm.team_id
     WHERE tm.invitation_token = invitation_token_param
       AND lower(tm.email) = lower(user_email_param)
       AND tm.status = 'pending'
       AND (tm.expires_at IS NULL OR tm.expires_at > now())
       AND ts.status = 'active'
  );
$$;

-- Solo la usan las edge functions (service role); el frontend nunca la llama
-- (verificado contra la lista de .rpc() del código antes de revocar).
REVOKE ALL ON FUNCTION public.validate_team_invitation(text, text) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) ensure_team_subscription — la llama el stripe-webhook al pagarse un
--    plan Equipo (checkout.session.completed / invoice.paid). Idempotente:
--    reactiva el equipo existente del titular o lo crea con 9 plazas.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_team_subscription(
  p_owner uuid,
  p_stripe_subscription_id text DEFAULT NULL,
  p_team_name text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_name text;
BEGIN
  SELECT id INTO v_id
    FROM public.team_subscriptions
   WHERE owner_id = p_owner
   ORDER BY created_at DESC
   LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE public.team_subscriptions
       SET status = 'active',
           stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
           team_name = COALESCE(team_name, p_team_name),
           updated_at = now()
     WHERE id = v_id;
    RETURN v_id;
  END IF;

  SELECT COALESCE(p_team_name, NULLIF(pharmacy_name, ''), 'Mi farmacia')
    INTO v_name
    FROM public.profiles WHERE id = p_owner;

  INSERT INTO public.team_subscriptions
         (owner_id, team_name, name, max_members, stripe_subscription_id, status)
  VALUES (p_owner, COALESCE(v_name, 'Mi farmacia'), COALESCE(v_name, 'Mi farmacia'), 9, p_stripe_subscription_id, 'active')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_team_subscription(uuid, text, text) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5) deactivate_team_for_owner — la llama el stripe-webhook cuando la
--    suscripción Equipo del titular se cancela o baja a Plus. Cancela el
--    equipo, retira las plazas y degrada los perfiles de los miembros
--    (salvo admins y salvo quien tenga suscripción propia activa).
--    Devuelve el nº de miembros degradados.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deactivate_team_for_owner(p_owner uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Miembros a degradar: activos en equipos de este titular, rol de equipo,
  -- sin suscripción propia activa y sin rol admin.
  WITH afectados AS (
    SELECT DISTINCT tm.user_id
      FROM public.team_members tm
      JOIN public.team_subscriptions ts ON ts.id = tm.team_id
     WHERE ts.owner_id = p_owner
       AND tm.status = 'active'
       AND tm.user_id IS NOT NULL
  ), degradables AS (
    SELECT a.user_id
      FROM afectados a
      JOIN public.profiles p ON p.id = a.user_id
     WHERE COALESCE(p.subscription_role::text, '') <> 'admin'
       AND COALESCE(p.role::text, '') <> 'admin'
       AND NOT EXISTS (
             SELECT 1 FROM public.subscriptions s
              WHERE s.user_id = a.user_id AND s.status = 'active'
           )
  )
  UPDATE public.profiles p
     SET subscription_role = 'freemium',
         subscription_status = 'trialing',
         updated_at = now()
    FROM degradables d
   WHERE p.id = d.user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Plazas fuera (activas y pendientes) y equipo cancelado
  UPDATE public.team_members tm
     SET status = 'inactive', updated_at = now()
    FROM public.team_subscriptions ts
   WHERE ts.id = tm.team_id
     AND ts.owner_id = p_owner
     AND tm.status <> 'inactive';

  UPDATE public.team_subscriptions
     SET status = 'canceled', updated_at = now()
   WHERE owner_id = p_owner AND status <> 'canceled';

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_team_for_owner(uuid) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------
-- 6) get_team_progress — la vista del titular en /mi-farmacia.
--    Devuelve el progreso FORMATIVO por persona (decisión 15-07): cursos,
--    evaluaciones aprobadas, puntos/nivel y última actividad. Nada de foro,
--    IAFarma ni Rebotica. Autoprotegida: si quien llama no es titular de un
--    equipo activo, devuelve 0 filas. SÍ se concede a authenticated porque
--    la llama el frontend (lección del hardening 13-07).
--    Incluye al titular como primera fila (es_titular = true).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_team_progress()
RETURNS TABLE (
  member_user_id uuid,
  es_titular boolean,
  nombre text,
  email text,
  puesto text,
  se_unio timestamptz,
  cursos_completados integer,
  cursos_en_curso integer,
  evaluaciones_aprobadas integer,
  puntos integer,
  nivel integer,
  ultima_actividad date
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH mi_equipo AS (
    SELECT ts.id, ts.owner_id, ts.created_at
      FROM public.team_subscriptions ts
     WHERE ts.owner_id = auth.uid() AND ts.status = 'active'
     ORDER BY ts.created_at DESC
     LIMIT 1
  ), personas AS (
    -- El titular
    SELECT e.owner_id AS user_id, true AS es_titular, e.created_at AS se_unio
      FROM mi_equipo e
    UNION ALL
    -- Miembros con plaza activa
    SELECT tm.user_id, false, tm.joined_at
      FROM public.team_members tm
      JOIN mi_equipo e ON e.id = tm.team_id
     WHERE tm.status = 'active' AND tm.user_id IS NOT NULL
       AND tm.user_id <> e.owner_id  -- defensivo: el titular nunca duplicado
  ), cursos AS (
    SELECT ce.user_id,
           COUNT(*) FILTER (WHERE ce.is_completed)     AS completados,
           COUNT(*) FILTER (WHERE NOT ce.is_completed) AS en_curso
      FROM public.course_enrollments ce
     WHERE ce.user_id IN (SELECT user_id FROM personas)
     GROUP BY ce.user_id
  ), quizzes AS (
    SELECT qa.user_id,
           COUNT(DISTINCT qa.quiz_id) FILTER (WHERE qa.passed) AS aprobadas
      FROM public.quiz_attempts qa
     WHERE qa.user_id IN (SELECT user_id FROM personas)
     GROUP BY qa.user_id
  )
  SELECT p.id,
         per.es_titular,
         COALESCE(NULLIF(p.full_name, ''), split_part(COALESCE(p.email, ''), '@', 1)) AS nombre,
         p.email,
         p."position" AS puesto,
         per.se_unio,
         COALESCE(c.completados, 0)::integer,
         COALESCE(c.en_curso, 0)::integer,
         COALESCE(q.aprobadas, 0)::integer,
         COALESCE(p.points, 0)::integer,
         COALESCE(p.level, 1)::integer,
         p.last_activity_date::date
    FROM personas per
    JOIN public.profiles p ON p.id = per.user_id
    LEFT JOIN cursos  c ON c.user_id = per.user_id
    LEFT JOIN quizzes q ON q.user_id = per.user_id
   ORDER BY per.es_titular DESC, per.se_unio ASC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_progress() TO authenticated;
REVOKE ALL ON FUNCTION public.get_team_progress() FROM PUBLIC, anon;

-- ---------------------------------------------------------------------
-- 7) Nota: team_members.member_role (enum premium/profesional) queda
--    VESTIGIAL: el acceso del miembro se asigna por profiles.subscription_role
--    = 'equipo' al aceptar (lo hace manage-team, prompt nº 1 v4). No se toca
--    el enum ni la columna para no romper datos existentes.
-- ---------------------------------------------------------------------
COMMENT ON COLUMN public.team_members.member_role IS
  'VESTIGIAL desde 2026-07-15: el acceso del miembro lo da profiles.subscription_role=''equipo''. No usar.';
