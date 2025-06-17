
-- Enable RLS for events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON public.events
FOR SELECT USING (true);

-- Enable RLS for promotions table
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view promotions" ON public.promotions
FOR SELECT USING (true);

-- Enable RLS for challenges table
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenges" ON public.challenges
FOR SELECT USING (true);

-- Enable RLS for user_points table (already has some policies but let's ensure they're complete)
CREATE POLICY "Users can view all user points" ON public.user_points
FOR SELECT USING (true);

-- Enable RLS for user_challenge_progress table (already has some policies but let's ensure they're complete)
CREATE POLICY "Users can view all challenge progress" ON public.user_challenge_progress
FOR SELECT USING (true);

-- Add missing RPC functions that are being called in the code
CREATE OR REPLACE FUNCTION public.add_user_points(user_id uuid, points integer)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_points (user_id, total_points)
  VALUES (user_id, points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = public.user_points.total_points + points,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the foreign key constraints and unique constraints that might be missing
ALTER TABLE public.user_points ADD CONSTRAINT user_points_user_id_unique UNIQUE (user_id);
ALTER TABLE public.course_enrollments ADD CONSTRAINT course_enrollments_user_course_unique UNIQUE (user_id, course_id);
ALTER TABLE public.resource_downloads ADD CONSTRAINT resource_downloads_user_resource_unique UNIQUE (user_id, resource_id);
ALTER TABLE public.user_challenge_progress ADD CONSTRAINT user_challenge_progress_user_challenge_unique UNIQUE (user_id, challenge_id);
