
-- Solo verificar y actualizar el usuario específico sin triggers complejos
UPDATE profiles 
SET subscription_role = 'admin'::user_role,
    updated_at = NOW()
WHERE email = 'hola@mkpro.es';

-- Verificar que se aplicó correctamente
SELECT id, email, subscription_role, updated_at FROM profiles WHERE email = 'hola@mkpro.es';
