-- =====================================================================
-- Auditoría 2026-06-17 — Endurecimiento de seguridad y consistencia
-- Generado por Cowork. REVISAR EN UNA RAMA DE SUPABASE ANTES DE PRODUCCIÓN.
-- No destructivo (no hace DROP de datos). Afecta a rol `authenticated`;
-- `service_role` (edge functions) no se ve afectado por los GRANT/RLS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- C-SEG1 — Impedir que un usuario edite columnas sensibles de su perfil
-- Problema: la policy "Users can update own profile" (USING auth.uid()=id)
-- no restringe columnas, así que el cliente podía hacer
--   update profiles set subscription_role='premium', subscription_status='active'
-- (bypass del muro de pago; NO concede admin, eso vive en user_roles).
-- Solución: GRANT de UPDATE a nivel de columna. Solo se permiten las
-- columnas que el cliente edita legítimamente (datos de perfil/onboarding).
-- ---------------------------------------------------------------------
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  full_name,
  avatar_url,
  bio,
  pharmacy_name,
  pharmacy_city,
  position,
  has_completed_onboarding,
  opt_out_leaderboard,
  student_document_url,
  last_activity_date,
  updated_at
) ON public.profiles TO authenticated;
-- Columnas que SOLO puede modificar service_role (edge functions):
--   role, subscription_role, subscription_status, points, level, streak_days,
--   stripe_customer_id, trial_ends_at, student_valid_until,
--   student_verification_status, email, id, created_at.

-- ---------------------------------------------------------------------
-- C-MNT3 — subscription_role es la ÚNICA fuente de verdad del plan.
-- `profiles.role` queda obsoleta. Rellenamos huecos y fijamos default.
-- (handle_new_user no setea subscription_role -> antes quedaba NULL.)
-- ---------------------------------------------------------------------
UPDATE public.profiles
   SET subscription_role = COALESCE(subscription_role, role, 'freemium'::public.user_role)
 WHERE subscription_role IS NULL;
ALTER TABLE public.profiles ALTER COLUMN subscription_role SET DEFAULT 'freemium';
COMMENT ON COLUMN public.profiles.role IS
  'OBSOLETA (2026-06-17): usar subscription_role. No leer desde la app. Eliminar tras verificar que nada depende de ella.';

-- ---------------------------------------------------------------------
-- C-FUNC1 — Hacer visibles los quizzes activos ya creados.
-- El formulario de admin fija is_active pero la RLS de lectura exige
-- is_published=true, que nunca se ponía -> quizzes invisibles para usuarios.
-- (El fix de cliente en QuizFormDialog ya sincroniza ambos a partir de ahora;
--  esto arregla los datos existentes.)
-- ---------------------------------------------------------------------
UPDATE public.course_quizzes
   SET is_published = true
 WHERE is_active = true AND is_published = false;

-- ---------------------------------------------------------------------
-- C-SEG2 — Proteger el CONTENIDO premium en el servidor (no solo en cliente).
-- Antes: course_lessons era legible por cualquier autenticado (USING true),
-- así que las lecciones de cursos premium se leían vía API sin pagar.
-- Ahora: lección visible si es gratuita (is_free) o si el curso no es premium
-- o si el usuario tiene plan de pago / es admin.
-- current_subscription_role() es fiable ahora que C-SEG1 impide auto-editarlo.
-- ⚠️ PROBAR EN RAMA: si bloquea acceso legítimo, ajustar la condición de roles.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_subscription_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT subscription_role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.can_access_lesson(_module_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.is_current_user_admin()
    OR EXISTS (
      SELECT 1
        FROM public.course_modules m
        JOIN public.courses c ON c.id = m.course_id
       WHERE m.id = _module_id
         AND (
           c.is_premium = false
           OR COALESCE(public.current_subscription_role(), 'freemium'::public.user_role) <> 'freemium'::public.user_role
         )
    );
$$;

DROP POLICY IF EXISTS "Anyone can view lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "View lessons by access" ON public.course_lessons;
CREATE POLICY "View lessons by access" ON public.course_lessons
  FOR SELECT TO authenticated
  USING (is_free = true OR public.can_access_lesson(module_id));
-- NOTA: si `resources` tiene contenido premium, puede protegerse de forma
-- análoga (hoy su policy es solo is_published=true). No se toca aquí.

-- ---------------------------------------------------------------------
-- C-SEG4 — Idempotencia del webhook de Stripe.
-- Tabla para registrar event.id ya procesados y evitar doble proceso.
-- Solo service_role (el webhook) accede; RLS activada sin policies.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text,
  processed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- C-SEG5 — Rate-limit del chat IA (ai-portal-chat).
-- Registro ligero de uso por usuario para limitar peticiones/día.
-- El usuario puede ver/insertar SU propio uso (la función lo usa con el
-- token del usuario); el conteo lo hace la edge function.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_chat_usage ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_chat_usage_user_time
  ON public.ai_chat_usage (user_id, created_at);
DROP POLICY IF EXISTS "Users can view own ai usage" ON public.ai_chat_usage;
CREATE POLICY "Users can view own ai usage" ON public.ai_chat_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own ai usage" ON public.ai_chat_usage;
CREATE POLICY "Users can insert own ai usage" ON public.ai_chat_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
