
-- Add foreign keys using DO blocks to handle existing constraints
DO $$ BEGIN
  ALTER TABLE public.forum_threads 
    ADD CONSTRAINT forum_threads_author_id_profiles_fkey 
    FOREIGN KEY (author_id) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.forum_replies 
    ADD CONSTRAINT forum_replies_author_id_profiles_fkey 
    FOREIGN KEY (author_id) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.course_enrollments 
    ADD CONSTRAINT course_enrollments_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.subscriptions 
    ADD CONSTRAINT subscriptions_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.pharmacy_listings 
    ADD CONSTRAINT pharmacy_listings_seller_id_profiles_fkey 
    FOREIGN KEY (seller_id) REFERENCES public.profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add missing columns
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Add team_name column to team_subscriptions
ALTER TABLE public.team_subscriptions ADD COLUMN IF NOT EXISTS team_name text;

-- Add applicant columns to job_applications
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS applicant_id uuid;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS applicant_name text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS applicant_email text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS applied_at timestamptz DEFAULT now();
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Drop old calculate_quiz_stats and recreate with correct param name
DROP FUNCTION IF EXISTS public.calculate_quiz_stats(uuid);

CREATE OR REPLACE FUNCTION public.calculate_quiz_stats(quiz_id_param uuid)
RETURNS TABLE(total_attempts bigint, total_users bigint, average_score numeric, pass_rate numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) AS total_attempts,
    COUNT(DISTINCT user_id) AS total_users,
    ROUND(AVG(score), 1) AS average_score,
    ROUND(COUNT(*) FILTER (WHERE passed) * 100.0 / NULLIF(COUNT(*), 0), 1) AS pass_rate
  FROM public.quiz_attempts
  WHERE quiz_id = quiz_id_param;
$$;
