
-- Verificar si el usuario ya existe y promoverlo a admin
DO $$
BEGIN
    -- Si el usuario ya existe en profiles, solo actualizamos su rol
    IF EXISTS (SELECT 1 FROM public.profiles WHERE email = 'control@mkpro.es') THEN
        UPDATE public.profiles 
        SET subscription_role = 'admin'::user_role,
            subscription_status = 'active'::subscription_status,
            full_name = COALESCE(full_name, 'Administrador farmapro'),
            pharmacy_name = COALESCE(pharmacy_name, 'farmapro Control'),
            position = COALESCE(position, 'Administrador')
        WHERE email = 'control@mkpro.es';
        
        RAISE NOTICE 'Usuario existente promovido a admin: control@mkpro.es';
    ELSE
        RAISE NOTICE 'Usuario no encontrado en profiles: control@mkpro.es';
        RAISE NOTICE 'El usuario debe registrarse primero en la aplicación.';
    END IF;
END $$;
