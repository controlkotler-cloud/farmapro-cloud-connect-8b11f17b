
-- Crear tablas para el sistema de equipos
CREATE TABLE public.team_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT,
  team_name TEXT NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.team_subscriptions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'inactive'
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  invitation_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)
);

-- Habilitar RLS
ALTER TABLE public.team_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para team_subscriptions
CREATE POLICY "Owners can manage their team subscriptions" ON public.team_subscriptions
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team members can view team subscription" ON public.team_subscriptions
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Políticas RLS para team_members
CREATE POLICY "Team owners can manage members" ON public.team_members
  FOR ALL TO authenticated
  USING (
    team_id IN (
      SELECT id FROM public.team_subscriptions WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT id FROM public.team_subscriptions WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Team members can view other members" ON public.team_members
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Función para calcular precio del equipo
CREATE OR REPLACE FUNCTION public.calculate_team_price(member_count integer)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT (
    -- Premium titular (39€) + miembros profesionales (29€ cada uno)
    3900 + (member_count * 2900)
  ) * 85 / 100; -- Aplicar 15% descuento
$$;

-- Función para verificar si un usuario es propietario de equipo
CREATE OR REPLACE FUNCTION public.is_team_owner(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_subscriptions 
    WHERE owner_id = user_id_param AND status = 'active'
  );
$$;

-- Función para verificar si un usuario es miembro de equipo
CREATE OR REPLACE FUNCTION public.is_team_member(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = user_id_param AND status = 'active'
  );
$$;
