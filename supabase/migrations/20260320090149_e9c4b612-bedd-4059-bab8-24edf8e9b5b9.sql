
-- Add new enum types
DO $$ BEGIN
  CREATE TYPE public.resource_format AS ENUM ('pdf', 'docs', 'url', 'xls', 'video');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.team_member_role AS ENUM ('premium', 'profesional');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend challenge_type enum with new values
ALTER TYPE public.challenge_type ADD VALUE IF NOT EXISTS 'course_started';
ALTER TYPE public.challenge_type ADD VALUE IF NOT EXISTS 'course_completed';
ALTER TYPE public.challenge_type ADD VALUE IF NOT EXISTS 'resource_downloaded';
ALTER TYPE public.challenge_type ADD VALUE IF NOT EXISTS 'forum_post';
ALTER TYPE public.challenge_type ADD VALUE IF NOT EXISTS 'forum_reply';

-- Extend course_category enum
ALTER TYPE public.course_category ADD VALUE IF NOT EXISTS 'atencion_cliente';
ALTER TYPE public.course_category ADD VALUE IF NOT EXISTS 'tecnologia';

-- Extend resource_category enum
ALTER TYPE public.resource_category ADD VALUE IF NOT EXISTS 'finanzas';
ALTER TYPE public.resource_category ADD VALUE IF NOT EXISTS 'digital';

-- Extend resource_type enum
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'protocolo';
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'calculadora';
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'checklist';
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'manual';
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'herramienta';

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage admin_users" ON public.admin_users FOR ALL TO authenticated USING (public.is_current_user_admin());

-- Create course_generation_control table
CREATE TABLE IF NOT EXISTS public.course_generation_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_topic_index integer DEFAULT 0,
  cycle_complete boolean DEFAULT false,
  last_updated timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.course_generation_control ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage course_generation_control" ON public.course_generation_control FOR ALL TO authenticated USING (public.is_current_user_admin());

-- Create resource_generation_control table
CREATE TABLE IF NOT EXISTS public.resource_generation_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_category_index integer DEFAULT 0,
  cycle_complete boolean DEFAULT false,
  last_updated timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.resource_generation_control ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage resource_generation_control" ON public.resource_generation_control FOR ALL TO authenticated USING (public.is_current_user_admin());

-- Create generated_courses_log table
CREATE TABLE IF NOT EXISTS public.generated_courses_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid,
  generated_at timestamptz DEFAULT now(),
  topic text,
  category text,
  status text DEFAULT 'success'
);
ALTER TABLE public.generated_courses_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage generated_courses_log" ON public.generated_courses_log FOR ALL TO authenticated USING (public.is_current_user_admin());

-- Create generated_resources_log table
CREATE TABLE IF NOT EXISTS public.generated_resources_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid,
  generated_at timestamptz DEFAULT now(),
  category text,
  status text DEFAULT 'success'
);
ALTER TABLE public.generated_resources_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage generated_resources_log" ON public.generated_resources_log FOR ALL TO authenticated USING (public.is_current_user_admin());

-- Create quiz_question_options table
CREATE TABLE IF NOT EXISTS public.quiz_question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_question_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage quiz_question_options" ON public.quiz_question_options FOR ALL TO authenticated USING (public.is_current_user_admin());
CREATE POLICY "Anyone can view quiz_question_options" ON public.quiz_question_options FOR SELECT TO authenticated USING (true);

-- Create quiz_answers table
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option_id uuid REFERENCES public.quiz_question_options(id),
  answer_text text,
  is_correct boolean NOT NULL DEFAULT false,
  points_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create quiz_answers" ON public.quiz_answers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view own quiz_answers" ON public.quiz_answers FOR SELECT TO authenticated USING (true);

-- Create resource_downloads table
CREATE TABLE IF NOT EXISTS public.resource_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES public.resources(id),
  user_id uuid REFERENCES public.profiles(id),
  downloaded_at timestamptz DEFAULT now()
);
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create resource_downloads" ON public.resource_downloads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own resource_downloads" ON public.resource_downloads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all resource_downloads" ON public.resource_downloads FOR SELECT TO authenticated USING (public.is_current_user_admin());

-- Create security_audit_log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view security_audit_log" ON public.security_audit_log FOR SELECT TO authenticated USING (public.is_current_user_admin());

-- Create forum_reply_likes table
CREATE TABLE IF NOT EXISTS public.forum_reply_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id uuid NOT NULL REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reply_id, user_id)
);
ALTER TABLE public.forum_reply_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own likes" ON public.forum_reply_likes FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view likes" ON public.forum_reply_likes FOR SELECT TO authenticated USING (true);

-- Create user_challenge_progress table
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  challenge_id uuid REFERENCES public.challenges(id),
  current_count integer DEFAULT 0,
  completed_at timestamptz,
  points_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own challenge_progress" ON public.user_challenge_progress FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create user_notification_settings table
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_courses boolean NOT NULL DEFAULT true,
  email_community boolean NOT NULL DEFAULT true,
  email_promotions boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notification_settings" ON public.user_notification_settings FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create user_points table
CREATE TABLE IF NOT EXISTS public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) UNIQUE,
  total_points integer DEFAULT 0,
  level integer DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own points" ON public.user_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all points" ON public.user_points FOR SELECT TO authenticated USING (public.is_current_user_admin());

-- Create team_subscriptions table
CREATE TABLE IF NOT EXISTS public.team_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id),
  name text NOT NULL DEFAULT 'Mi Equipo',
  max_members integer NOT NULL DEFAULT 5,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage team_subscriptions" ON public.team_subscriptions FOR ALL TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all team_subscriptions" ON public.team_subscriptions FOR ALL TO authenticated USING (public.is_current_user_admin());

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.team_subscriptions(id) ON DELETE CASCADE,
  user_id uuid,
  email text NOT NULL,
  invited_email text,
  invitation_token text,
  member_role public.team_member_role NOT NULL DEFAULT 'profesional',
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team owners can manage members" ON public.team_members FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.team_subscriptions WHERE id = team_members.team_id AND owner_id = auth.uid())
);
CREATE POLICY "Members can view own membership" ON public.team_members FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Create job_listings_public table
CREATE TABLE IF NOT EXISTS public.job_listings_public (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  company_name text NOT NULL,
  location text NOT NULL,
  province text,
  job_type text NOT NULL DEFAULT 'full-time',
  salary_range text,
  description text NOT NULL,
  requirements text,
  benefits text,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.job_listings_public ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active public jobs" ON public.job_listings_public FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage public jobs" ON public.job_listings_public FOR ALL TO authenticated USING (public.is_current_user_admin());

-- Create job_conversations table
CREATE TABLE IF NOT EXISTS public.job_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL,
  employer_id uuid,
  last_message_at timestamptz DEFAULT now(),
  applicant_unread boolean DEFAULT false,
  employer_unread boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.job_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view conversations" ON public.job_conversations FOR SELECT TO authenticated USING (auth.uid() = applicant_id OR auth.uid() = employer_id);

-- Create job_messages table
CREATE TABLE IF NOT EXISTS public.job_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.job_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conversation participants can view messages" ON public.job_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.job_conversations WHERE id = job_messages.conversation_id AND (applicant_id = auth.uid() OR employer_id = auth.uid()))
);

-- Create pharmacy_listings_public table
CREATE TABLE IF NOT EXISTS public.pharmacy_listings_public (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  price numeric,
  surface_area numeric,
  images_urls text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.pharmacy_listings_public ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active public pharmacies" ON public.pharmacy_listings_public FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage public pharmacies" ON public.pharmacy_listings_public FOR ALL TO authenticated USING (public.is_current_user_admin());
