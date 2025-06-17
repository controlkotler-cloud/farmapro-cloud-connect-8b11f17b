
-- Corregir la función handle_new_user con search_path fijo
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, pharmacy_name, position)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'pharmacy_name',
    NEW.raw_user_meta_data->>'position'
  );
  
  -- Initialize user points
  INSERT INTO public.user_points (user_id, total_points, level)
  VALUES (NEW.id, 0, 1);
  
  RETURN NEW;
END;
$function$;

-- Corregir la función add_user_points con search_path fijo
CREATE OR REPLACE FUNCTION public.add_user_points(user_id uuid, points integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_points (user_id, total_points)
  VALUES (user_id, points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = public.user_points.total_points + points,
    updated_at = NOW();
END;
$function$;
