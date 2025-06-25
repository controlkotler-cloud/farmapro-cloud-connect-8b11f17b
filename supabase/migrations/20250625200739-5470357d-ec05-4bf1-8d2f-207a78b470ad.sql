
-- Añadir políticas RLS para que los administradores puedan gestionar las categorías del foro
CREATE POLICY "Admins can manage forum categories" 
ON public.forum_categories 
FOR ALL 
USING (public.is_current_user_admin());

-- Añadir políticas RLS para que los administradores puedan gestionar los hilos del foro
CREATE POLICY "Admins can manage forum threads"
ON public.forum_threads
FOR ALL
USING (public.is_current_user_admin());

-- Añadir políticas RLS para que los administradores puedan gestionar las respuestas del foro
CREATE POLICY "Admins can manage forum replies"
ON public.forum_replies
FOR ALL
USING (public.is_current_user_admin());

-- Permitir que todos los usuarios autenticados puedan ver las categorías
CREATE POLICY "Authenticated users can view forum categories"
ON public.forum_categories
FOR SELECT
TO authenticated
USING (true);

-- Permitir que todos los usuarios autenticados puedan ver los hilos
CREATE POLICY "Authenticated users can view forum threads"
ON public.forum_threads
FOR SELECT
TO authenticated
USING (true);

-- Permitir que todos los usuarios autenticados puedan ver las respuestas
CREATE POLICY "Authenticated users can view forum replies"
ON public.forum_replies
FOR SELECT
TO authenticated
USING (true);
