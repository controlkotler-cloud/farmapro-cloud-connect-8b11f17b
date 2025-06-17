
-- Crear tabla para configuración de notificaciones de usuario
CREATE TABLE public.user_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_courses BOOLEAN NOT NULL DEFAULT true,
  email_promotions BOOLEAN NOT NULL DEFAULT true,
  email_community BOOLEAN NOT NULL DEFAULT false,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agregar índice único para user_id
CREATE UNIQUE INDEX user_notification_settings_user_id_idx ON public.user_notification_settings(user_id);

-- Habilitar RLS
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propias configuraciones
CREATE POLICY "Users can view their own notification settings" 
  ON public.user_notification_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar sus propias configuraciones
CREATE POLICY "Users can create their own notification settings" 
  ON public.user_notification_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus propias configuraciones
CREATE POLICY "Users can update their own notification settings" 
  ON public.user_notification_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Agregar columnas target_url y target_id a la tabla notifications existente si no existen
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS target_url TEXT,
ADD COLUMN IF NOT EXISTS target_id TEXT;
