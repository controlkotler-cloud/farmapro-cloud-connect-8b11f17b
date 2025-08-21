-- One-time cleanup: Remove entries from admin_users where the user's profile role is not 'admin'
DELETE FROM public.admin_users 
WHERE user_id IN (
  SELECT admin_users.user_id 
  FROM public.admin_users 
  LEFT JOIN public.profiles ON admin_users.user_id = profiles.id 
  WHERE profiles.subscription_role != 'admin'
);