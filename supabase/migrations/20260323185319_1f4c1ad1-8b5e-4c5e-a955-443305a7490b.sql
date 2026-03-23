
CREATE OR REPLACE FUNCTION public.update_challenge_progress(
  challenge_id_param uuid,
  points_earned_param integer DEFAULT 0,
  new_count_param integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_id_val uuid := auth.uid();
  current_record RECORD;
  challenge_record RECORD;
BEGIN
  IF user_id_val IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  -- Get challenge target
  SELECT target_count INTO challenge_record FROM public.challenges WHERE id = challenge_id_param;

  -- Get current progress
  SELECT current_count, completed_at, points_earned INTO current_record
  FROM public.user_challenge_progress
  WHERE user_id = user_id_val AND challenge_id = challenge_id_param;

  -- If already completed, do nothing
  IF current_record IS NOT NULL AND current_record.completed_at IS NOT NULL THEN
    RETURN;
  END IF;

  -- Determine if this update completes the challenge
  IF current_record IS NULL THEN
    -- Insert new record
    IF challenge_record.target_count IS NOT NULL AND new_count_param >= challenge_record.target_count THEN
      -- Completed on first insert
      INSERT INTO public.user_challenge_progress (user_id, challenge_id, current_count, points_earned, completed_at)
      VALUES (user_id_val, challenge_id_param, new_count_param, points_earned_param, now());
      PERFORM public.add_user_points(user_id_val, points_earned_param);
    ELSE
      INSERT INTO public.user_challenge_progress (user_id, challenge_id, current_count, points_earned, completed_at)
      VALUES (user_id_val, challenge_id_param, new_count_param, 0, NULL);
    END IF;
  ELSE
    -- Only update if new count is greater
    IF new_count_param > current_record.current_count THEN
      IF challenge_record.target_count IS NOT NULL AND new_count_param >= challenge_record.target_count THEN
        -- Mark as completed
        UPDATE public.user_challenge_progress
        SET current_count = new_count_param, points_earned = points_earned_param, completed_at = now()
        WHERE user_id = user_id_val AND challenge_id = challenge_id_param;
        PERFORM public.add_user_points(user_id_val, points_earned_param);
      ELSE
        -- Just update count
        UPDATE public.user_challenge_progress
        SET current_count = new_count_param
        WHERE user_id = user_id_val AND challenge_id = challenge_id_param;
      END IF;
    END IF;
  END IF;
END;
$$;
