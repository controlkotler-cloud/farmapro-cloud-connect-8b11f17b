
-- Crear tabla para configuraciones generales del sistema
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, key)
);

-- Insertar configuraciones por defecto
INSERT INTO public.system_settings (category, key, value, description) VALUES
-- Configuración de la Plataforma
('platform', 'company_info', '{"name": "farmapro", "description": "Portal de formación farmacéutica", "contact_email": "info@farmapro.com"}', 'Información de la empresa'),
('platform', 'email_config', '{"smtp_host": "", "smtp_port": 587, "smtp_user": "", "default_sender": "noreply@farmapro.com"}', 'Configuración de email SMTP'),
('platform', 'notifications_config', '{"push_enabled": true, "email_enabled": true, "sms_enabled": false}', 'Configuración de notificaciones'),

-- Gestión de Usuarios y Roles
('users', 'registration_config', '{"email_verification": true, "manual_moderation": false, "required_fields": ["full_name", "email"]}', 'Configuración de registro'),
('users', 'subscription_limits', '{"freemium": {"courses": 5, "resources": 10}, "premium": {"courses": -1, "resources": -1}}', 'Límites de suscripción'),
('users', 'points_config', '{"points_per_course": 100, "points_per_resource": 10, "level_threshold": 1000}', 'Sistema de puntos'),

-- Configuración Técnica
('technical', 'file_config', '{"max_upload_size": 10485760, "allowed_types": ["pdf", "doc", "docx", "jpg", "png"], "storage_provider": "supabase"}', 'Configuración de archivos'),
('technical', 'security_config', '{"min_password_length": 8, "session_timeout": 3600, "max_login_attempts": 5}', 'Configuración de seguridad'),
('technical', 'integrations', '{"google_analytics": "", "webhooks": []}', 'Integraciones externas'),

-- Métricas y Análisis
('analytics', 'google_analytics', '{"tracking_id": "", "enabled": false}', 'Configuración de Google Analytics'),
('analytics', 'reports_config', '{"frequency": "weekly", "recipients": [], "metrics": ["users", "courses", "engagement"]}', 'Reportes automáticos'),

-- Configuración Regional
('regional', 'localization', '{"default_language": "es", "timezone": "Europe/Madrid", "date_format": "DD/MM/YYYY"}', 'Idioma y localización'),
('regional', 'legal_config', '{"privacy_policy_url": "/politica-privacidad", "terms_url": "/aviso-legal", "cookies_url": "/politica-cookies"}', 'Configuración legal');

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política para que solo los administradores puedan ver y gestionar configuraciones
CREATE POLICY "Admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());
