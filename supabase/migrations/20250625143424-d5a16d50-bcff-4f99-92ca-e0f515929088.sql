
-- Verificar y añadir el valor 'admin' al enum si no existe
DO $$ 
BEGIN
    -- Intentar añadir el valor 'admin' al enum user_role
    BEGIN
        ALTER TYPE user_role ADD VALUE 'admin';
    EXCEPTION 
        WHEN duplicate_object THEN 
            -- El valor ya existe, no hacer nada
            NULL;
    END;
END $$;

-- Crear una función para promocionar un usuario a admin (útil para testing)
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles 
    SET subscription_role = 'admin'::user_role
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario con email % no encontrado', user_email;
    END IF;
END;
$$;

-- Crear una función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = user_id 
        AND subscription_role = 'admin'
    );
END;
$$;

-- Para hacer que tu usuario actual sea admin, ejecuta esto reemplazando con tu email:
-- SELECT promote_user_to_admin('tu-email@ejemplo.com');
