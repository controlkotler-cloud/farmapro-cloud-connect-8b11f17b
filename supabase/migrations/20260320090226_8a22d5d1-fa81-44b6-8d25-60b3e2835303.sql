
-- Add missing columns to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_modules jsonb;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS featured_image_url text;

-- Add missing columns to challenges table
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS points_reward integer DEFAULT 10;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS target_count integer;
-- Copy existing data
UPDATE public.challenges SET name = title WHERE name IS NULL;
UPDATE public.challenges SET points_reward = points WHERE points_reward IS NULL OR points_reward = 10;

-- Add missing columns to quiz_questions table
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS question_text text;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'multiple_choice';
-- Copy existing data
UPDATE public.quiz_questions SET question_text = question WHERE question_text IS NULL;

-- Add missing columns to quiz_attempts table
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS attempt_number integer DEFAULT 1;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS max_score integer DEFAULT 100;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS percentage numeric DEFAULT 0;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now();
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS time_taken_seconds integer;

-- Add missing columns to course_quizzes table
ALTER TABLE public.course_quizzes ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.course_quizzes ADD COLUMN IF NOT EXISTS max_attempts integer;
ALTER TABLE public.course_quizzes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_document_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_valid_until timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_verification_status text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_role public.user_role;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status public.subscription_status;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Add missing columns to pharmacy_listings table
ALTER TABLE public.pharmacy_listings ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.pharmacy_listings ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.pharmacy_listings ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.pharmacy_listings ADD COLUMN IF NOT EXISTS surface_area numeric;
ALTER TABLE public.pharmacy_listings ADD COLUMN IF NOT EXISTS images_urls text[];
ALTER TABLE public.pharmacy_listings ADD COLUMN IF NOT EXISTS seller_id uuid;
ALTER TABLE public.pharmacy_listings ADD COLUMN IF NOT EXISTS location text;

-- Add missing columns to promotions table
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS company_type text;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS discount_details text;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS terms_conditions text;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS valid_until timestamptz;

-- Add missing columns to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_url text;

-- Add missing columns to resources table
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS format public.resource_format;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS download_count integer DEFAULT 0;

-- Add missing columns to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_id text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_url text;

-- Add missing columns to subscriptions table
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan_name text DEFAULT 'free';

-- Add missing columns to job_listings table
ALTER TABLE public.job_listings ADD COLUMN IF NOT EXISTS province text;

-- Add missing columns to system_settings table
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- Add missing columns to course_enrollments table
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS started_at timestamptz;

-- Add missing columns to forum_replies table
ALTER TABLE public.forum_replies ADD COLUMN IF NOT EXISTS parent_reply_id uuid;

-- Add missing columns to user_roles table
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
