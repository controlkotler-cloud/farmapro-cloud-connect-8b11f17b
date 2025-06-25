
-- Usar la función específica para promover usuarios a admin
SELECT promote_user_to_admin('hola@mkpro.es');

-- Verificar que funcionó
SELECT id, email, subscription_role FROM profiles WHERE email = 'hola@mkpro.es';

-- Probar la función is_admin con tu ID de usuario específico
SELECT is_user_admin('3f8032e8-ab8d-4a80-8179-e285d1e4be65') as is_admin_check;

-- Probar la función is_admin() general
SELECT public.is_admin() as is_current_user_admin;
