
-- 1) Tablas de mensajería interna
CREATE TABLE IF NOT EXISTS public.job_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL,      -- redundante para simplificar RLS/consultas
  applicant_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open', -- open | closed
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_conversations_unique UNIQUE (job_id, employer_id, applicant_id),
  CONSTRAINT job_conversations_no_self_contact CHECK (employer_id <> applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_job_conversations_applicant ON public.job_conversations(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_conversations_employer ON public.job_conversations(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_conversations_job ON public.job_conversations(job_id);

-- Trigger de updated_at
DROP TRIGGER IF EXISTS trg_job_conversations_updated_at ON public.job_conversations;
CREATE TRIGGER trg_job_conversations_updated_at
BEFORE UPDATE ON public.job_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mensajes
CREATE TABLE IF NOT EXISTS public.job_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.job_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_job_messages_conversation ON public.job_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_conversation_created ON public.job_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_messages_sender ON public.job_messages(sender_id);

-- 2) Funciones auxiliares de seguridad/acceso
CREATE OR REPLACE FUNCTION public.is_paid_user(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid
      AND subscription_status = 'active'
      AND subscription_role IN ('premium','profesional','estudiante','admin')
  );
$$;

-- Si prefieres excluir 'estudiante', cambia la lista a ('premium','profesional','admin')

CREATE OR REPLACE FUNCTION public.job_is_active_and_visible(job_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_listings j
    WHERE j.id = job_id_param
      AND j.is_active = true
      AND (j.expires_at IS NULL OR j.expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(conversation_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_conversations c
    WHERE c.id = conversation_id_param
      AND (c.employer_id = auth.uid() OR c.applicant_id = auth.uid())
  );
$$;

-- 3) RPC: iniciar (o recuperar) conversación
CREATE OR REPLACE FUNCTION public.start_job_conversation(job_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  emp_id uuid;
  conv_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión';
  END IF;

  IF NOT public.is_paid_user(auth.uid()) THEN
    RAISE EXCEPTION 'Solo los usuarios con plan de pago pueden contactar';
  END IF;

  IF NOT public.job_is_active_and_visible(job_id_param) THEN
    RAISE EXCEPTION 'La oferta no está activa o ha expirado';
  END IF;

  SELECT employer_id INTO emp_id
  FROM public.job_listings
  WHERE id = job_id_param
  LIMIT 1;

  IF emp_id IS NULL THEN
    RAISE EXCEPTION 'Oferta no encontrada';
  END IF;

  IF emp_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes contactar tu propia oferta';
  END IF;

  -- ¿Existe ya conversación?
  SELECT id INTO conv_id
  FROM public.job_conversations
  WHERE job_id = job_id_param
    AND employer_id = emp_id
    AND applicant_id = auth.uid()
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  INSERT INTO public.job_conversations (job_id, employer_id, applicant_id, last_message_preview)
  VALUES (job_id_param, emp_id, auth.uid(), NULL)
  RETURNING id INTO conv_id;

  RETURN conv_id;
END;
$$;

-- 4) RPC: crear notificación (campanita)
CREATE OR REPLACE FUNCTION public.create_notification_for_user(
  user_id_param uuid,
  title_param text,
  message_param text,
  target_url_param text,
  target_id_param text,
  type_param text DEFAULT 'job_message'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, target_url, target_id, type, created_at, is_read)
  VALUES (user_id_param, title_param, message_param, target_url_param, target_id_param, type_param, now(), false);
END;
$$;

-- 5) RPC: enviar mensaje con rate limit + actualización + notificación
CREATE OR REPLACE FUNCTION public.send_job_message(conversation_id_param uuid, body_param text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  msg_id uuid;
  emp_id uuid;
  app_id uuid;
  recipient_id uuid;
  msg_preview text;
  sent_last_min integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión';
  END IF;

  IF body_param IS NULL OR length(trim(body_param)) = 0 THEN
    RAISE EXCEPTION 'El mensaje no puede estar vacío';
  END IF;

  IF length(body_param) > 4000 THEN
    RAISE EXCEPTION 'El mensaje es demasiado largo (máx. 4000 caracteres)';
  END IF;

  -- Debe ser participante
  IF NOT public.is_conversation_participant(conversation_id_param) THEN
    RAISE EXCEPTION 'No tienes acceso a esta conversación';
  END IF;

  -- Rate limit simple: máx 5 mensajes por minuto por usuario
  SELECT COUNT(*) INTO sent_last_min
  FROM public.job_messages
  WHERE sender_id = auth.uid()
    AND created_at > (now() - interval '1 minute');

  IF sent_last_min >= 5 THEN
    RAISE EXCEPTION 'Has alcanzado el límite de envío (intenta en 1 minuto)';
  END IF;

  INSERT INTO public.job_messages (conversation_id, sender_id, body)
  VALUES (conversation_id_param, auth.uid(), body_param)
  RETURNING id INTO msg_id;

  -- Determinar receptor
  SELECT employer_id, applicant_id INTO emp_id, app_id
  FROM public.job_conversations
  WHERE id = conversation_id_param;

  IF emp_id IS NULL OR app_id IS NULL THEN
    RAISE EXCEPTION 'Conversación no encontrada';
  END IF;

  recipient_id := CASE WHEN auth.uid() = emp_id THEN app_id ELSE emp_id END;

  msg_preview := left(trim(body_param), 140);

  -- Actualizar resumen/fecha de la conversación
  UPDATE public.job_conversations
  SET last_message_at = now(),
      last_message_preview = msg_preview
  WHERE id = conversation_id_param;

  -- Crear notificación para el receptor (campanita)
  PERFORM public.create_notification_for_user(
    recipient_id,
    'Nuevo mensaje',
    'Has recibido un mensaje en una conversación de empleo',
    '/empleo/conversaciones/' || conversation_id_param::text,
    conversation_id_param::text,
    'job_message'
  );

  RETURN msg_id;
END;
$$;

-- 6) RPC: marcar como leídos
CREATE OR REPLACE FUNCTION public.mark_conversation_read(conversation_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  emp_id uuid;
  app_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión';
  END IF;

  IF NOT public.is_conversation_participant(conversation_id_param) THEN
    RAISE EXCEPTION 'No tienes acceso a esta conversación';
  END IF;

  -- Marca como leído todos los mensajes del otro usuario
  UPDATE public.job_messages
  SET read_at = now()
  WHERE conversation_id = conversation_id_param
    AND sender_id <> auth.uid()
    AND read_at IS NULL;
END;
$$;

-- 7) RLS
ALTER TABLE public.job_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;

-- job_conversations: solo participantes pueden ver/actualizar
DROP POLICY IF EXISTS "Participants can view conversations" ON public.job_conversations;
CREATE POLICY "Participants can view conversations"
  ON public.job_conversations
  FOR SELECT
  USING (employer_id = auth.uid() OR applicant_id = auth.uid());

DROP POLICY IF EXISTS "Participants can update conversations" ON public.job_conversations;
CREATE POLICY "Participants can update conversations"
  ON public.job_conversations
  FOR UPDATE
  USING (employer_id = auth.uid() OR applicant_id = auth.uid())
  WITH CHECK (employer_id = auth.uid() OR applicant_id = auth.uid());

-- No permitimos INSERT/DELETE directos: deben usar la RPC start_job_conversation
-- (si en el futuro quieres permitir INSERT directo, añadimos una policy con validaciones)

-- job_messages: ver solo si eres participante; inserts solo vía RPC (sin policy INSERT)
DROP POLICY IF EXISTS "Participants can view messages" ON public.job_messages;
CREATE POLICY "Participants can view messages"
  ON public.job_messages
  FOR SELECT
  USING (public.is_conversation_participant(conversation_id));

-- 8) Triggers útiles (opcional a futuro): ninguno adicional aquí; ya actualizamos conversación en la RPC.

