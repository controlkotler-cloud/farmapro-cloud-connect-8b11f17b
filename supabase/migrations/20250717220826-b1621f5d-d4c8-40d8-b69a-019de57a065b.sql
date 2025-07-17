-- Crear tabla de control para generación de recursos
CREATE TABLE public.resource_generation_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_category_index INTEGER DEFAULT 0,
  cycle_complete BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar registro inicial de control
INSERT INTO public.resource_generation_control (current_category_index, cycle_complete) 
VALUES (0, false);

-- Crear tabla de log para recursos generados
CREATE TABLE public.generated_resources_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.resources(id),
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para las nuevas tablas
ALTER TABLE public.resource_generation_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_resources_log ENABLE ROW LEVEL SECURITY;

-- Políticas para resource_generation_control (solo admins)
CREATE POLICY "Only admins can manage resource generation control" 
ON public.resource_generation_control
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Políticas para generated_resources_log (solo admins)
CREATE POLICY "Only admins can view generated resources log" 
ON public.generated_resources_log
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());