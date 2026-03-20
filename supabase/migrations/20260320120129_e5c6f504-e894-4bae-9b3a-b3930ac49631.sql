
-- Disable the security trigger temporarily
ALTER TABLE profiles DISABLE TRIGGER trigger_block_unsafe_profile_updates;

-- Update profile with admin role
UPDATE profiles 
SET email = 'control@mkpro.es', 
    subscription_role = 'admin', 
    subscription_status = 'active',
    updated_at = now()
WHERE id = '9ab8b139-2fc3-4987-88a8-a15cc703539b';

-- Re-enable the trigger
ALTER TABLE profiles ENABLE TRIGGER trigger_block_unsafe_profile_updates;

-- Add unique constraint on admin_users.user_id if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_user_id_key') THEN
    ALTER TABLE admin_users ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Insert into admin_users
INSERT INTO admin_users (user_id, email, role) 
VALUES ('9ab8b139-2fc3-4987-88a8-a15cc703539b', 'control@mkpro.es', 'admin')
ON CONFLICT (user_id) DO NOTHING;
