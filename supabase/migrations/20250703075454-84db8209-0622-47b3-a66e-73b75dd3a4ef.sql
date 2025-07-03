-- Primero, eliminar las políticas conflictivas que causan recursión infinita
DROP POLICY IF EXISTS "Owners can manage their team subscriptions" ON public.team_subscriptions;
DROP POLICY IF EXISTS "Team members can view team subscription" ON public.team_subscriptions;

-- Crear función de seguridad para verificar ownership sin recursión
CREATE OR REPLACE FUNCTION public.is_team_subscription_owner(subscription_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT owner_id = user_id FROM public.team_subscriptions WHERE id = subscription_id;
$$;

-- Crear función para verificar si usuario es miembro activo de un equipo
CREATE OR REPLACE FUNCTION public.is_active_team_member_of_subscription(subscription_id uuid, user_id uuid)
RETURNS boolean  
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = subscription_id 
    AND user_id = $2 
    AND status = 'active'
  );
$$;

-- Recrear políticas sin recursión
CREATE POLICY "Team owners can manage subscriptions" ON public.team_subscriptions
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team members can view subscription" ON public.team_subscriptions
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid() OR 
    is_active_team_member_of_subscription(id, auth.uid())
  );