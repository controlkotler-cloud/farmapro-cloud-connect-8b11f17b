
-- Habilitar RLS en la tabla challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Política para que los administradores puedan ver todos los retos
CREATE POLICY "Admins can view all challenges" 
ON public.challenges 
FOR SELECT 
USING (public.is_current_user_admin());

-- Política para que los administradores puedan crear retos
CREATE POLICY "Admins can create challenges" 
ON public.challenges 
FOR INSERT 
WITH CHECK (public.is_current_user_admin());

-- Política para que los administradores puedan actualizar retos
CREATE POLICY "Admins can update challenges" 
ON public.challenges 
FOR UPDATE 
USING (public.is_current_user_admin());

-- Política para que los administradores puedan eliminar retos
CREATE POLICY "Admins can delete challenges" 
ON public.challenges 
FOR DELETE 
USING (public.is_current_user_admin());

-- Permitir que todos los usuarios autenticados puedan ver los retos activos
CREATE POLICY "Authenticated users can view active challenges"
ON public.challenges
FOR SELECT
TO authenticated
USING (is_active = true);

-- Habilitar RLS en la tabla user_challenge_progress
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Política para que los administradores puedan ver todo el progreso
CREATE POLICY "Admins can view all challenge progress" 
ON public.user_challenge_progress 
FOR SELECT 
USING (public.is_current_user_admin());

-- Política para que los administradores puedan actualizar el progreso
CREATE POLICY "Admins can update challenge progress" 
ON public.user_challenge_progress 
FOR UPDATE 
USING (public.is_current_user_admin());

-- Política para que los administradores puedan eliminar el progreso
CREATE POLICY "Admins can delete challenge progress" 
ON public.user_challenge_progress 
FOR DELETE 
USING (public.is_current_user_admin());

-- Política para que los usuarios puedan ver su propio progreso
CREATE POLICY "Users can view their own challenge progress"
ON public.user_challenge_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política para que el sistema pueda crear progreso para los usuarios
CREATE POLICY "System can create challenge progress"
ON public.user_challenge_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para que el sistema pueda actualizar el progreso del usuario
CREATE POLICY "System can update user challenge progress"
ON public.user_challenge_progress
FOR UPDATE
USING (auth.uid() = user_id);
