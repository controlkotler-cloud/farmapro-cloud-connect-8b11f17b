-- Fix the block_unsafe_profile_updates function to allow admins to modify profiles
CREATE OR REPLACE FUNCTION public.block_unsafe_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service role (system) updates
  IF auth.jwt() ->> 'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- Allow admins to modify any profile
  IF is_current_user_admin() THEN
    -- Log admin profile modifications for audit
    PERFORM log_security_event(
      'admin_action',
      jsonb_build_object(
        'action', 'profile_update',
        'admin_user_id', auth.uid(),
        'target_user_id', NEW.id,
        'changes', jsonb_build_object(
          'old_subscription_role', OLD.subscription_role,
          'new_subscription_role', NEW.subscription_role,
          'old_subscription_status', OLD.subscription_status,
          'new_subscription_status', NEW.subscription_status
        )
      ),
      auth.uid()
    );
    RETURN NEW;
  END IF;
  
  -- Ensure user can only update their own profile
  IF auth.uid() != NEW.id THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify other users profiles';
  END IF;
  
  -- For regular users, block changes to sensitive fields
  IF OLD.subscription_role IS DISTINCT FROM NEW.subscription_role OR
     OLD.subscription_status IS DISTINCT FROM NEW.subscription_status OR
     OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id OR
     OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify sensitive profile attributes';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create a secure RPC function for admin user role updates
CREATE OR REPLACE FUNCTION public.update_user_role_admin(
  target_user_id uuid,
  new_role user_role,
  new_status subscription_status DEFAULT 'active'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  updated_profile profiles%ROWTYPE;
  target_user_email text;
BEGIN
  -- Check if current user is admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Permission denied: Only admins can update user roles';
  END IF;
  
  -- Get target user email for admin_users sync
  SELECT email INTO target_user_email
  FROM profiles
  WHERE id = target_user_id;
  
  IF target_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Update the profile
  UPDATE profiles
  SET 
    subscription_role = new_role,
    subscription_status = new_status,
    updated_at = now()
  WHERE id = target_user_id
  RETURNING * INTO updated_profile;
  
  -- Synchronize admin_users table
  IF new_role = 'admin' THEN
    -- Add to admin_users if not already there
    INSERT INTO admin_users (user_id, email, role)
    VALUES (target_user_id, target_user_email, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = now();
  ELSE
    -- Remove from admin_users if present
    DELETE FROM admin_users WHERE user_id = target_user_id;
  END IF;
  
  -- Log the action
  PERFORM log_security_event(
    'admin_action',
    jsonb_build_object(
      'action', 'user_role_update_rpc',
      'admin_user_id', auth.uid(),
      'target_user_id', target_user_id,
      'new_role', new_role,
      'new_status', new_status,
      'target_email', target_user_email
    ),
    auth.uid()
  );
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'new_role', new_role,
    'new_status', new_status
  );
END;
$function$;