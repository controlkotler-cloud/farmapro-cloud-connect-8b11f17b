
-- Obtener tu user_id y crear la suscripción del equipo
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'entra@mkpro.es'
),
team_insert AS (
  INSERT INTO public.team_subscriptions (
    owner_id,
    team_name,
    max_members,
    status,
    stripe_subscription_id
  ) 
  SELECT 
    user_data.id,
    'farmacia prueba',
    3,
    'active',
    'manual_team_sub_' || extract(epoch from now())::text
  FROM user_data
  RETURNING id, owner_id
)
-- Actualizar tu perfil a Premium
UPDATE public.profiles 
SET subscription_role = 'premium'
WHERE id = (SELECT id FROM auth.users WHERE email = 'entra@mkpro.es');

-- Crear invitaciones para los miembros del equipo
INSERT INTO public.team_members (
  team_id,
  email,
  status,
  invitation_token
) 
SELECT 
  ts.id,
  member_email,
  'pending',
  gen_random_uuid()::text
FROM public.team_subscriptions ts
CROSS JOIN (
  VALUES 
    ('control@mkpro.es'),
    ('contabilidad@mkpro.es')
) AS members(member_email)
WHERE ts.owner_id = (SELECT id FROM auth.users WHERE email = 'entra@mkpro.es')
AND ts.team_name = 'farmacia prueba';
