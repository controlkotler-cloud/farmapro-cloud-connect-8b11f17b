
-- ========================================
-- ENABLE RLS ON ALL TABLES
-- ========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ========================================
-- SECURITY DEFINER FUNCTIONS
-- ========================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- ========================================
-- HANDLE NEW USER TRIGGER
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- ADD USER POINTS FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION public.add_user_points(p_user_id UUID, p_points INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + p_points,
      level = GREATEST(1, FLOOR((points + p_points) / 100) + 1)::INTEGER,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- ========================================
-- CALCULATE QUIZ STATS FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION public.calculate_quiz_stats(p_quiz_id UUID)
RETURNS TABLE(total_attempts BIGINT, avg_score NUMERIC, pass_rate NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) AS total_attempts,
    ROUND(AVG(score), 1) AS avg_score,
    ROUND(COUNT(*) FILTER (WHERE passed) * 100.0 / NULLIF(COUNT(*), 0), 1) AS pass_rate
  FROM public.quiz_attempts
  WHERE quiz_id = p_quiz_id;
$$;

-- ========================================
-- RLS POLICIES
-- ========================================

-- PROFILES
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- USER ROLES
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_current_user_admin());
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- SUBSCRIPTIONS
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (public.is_current_user_admin());

-- COURSES (public read, admin write)
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT TO authenticated USING (is_published = true OR public.is_current_user_admin());
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL TO authenticated USING (public.is_current_user_admin());

-- COURSE MODULES
CREATE POLICY "Anyone can view modules" ON public.course_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage modules" ON public.course_modules FOR ALL TO authenticated USING (public.is_current_user_admin());

-- COURSE LESSONS
CREATE POLICY "Anyone can view lessons" ON public.course_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage lessons" ON public.course_lessons FOR ALL TO authenticated USING (public.is_current_user_admin());

-- COURSE ENROLLMENTS
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll themselves" ON public.course_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enrollment" ON public.course_enrollments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING (public.is_current_user_admin());

-- QUIZZES
CREATE POLICY "Anyone can view published quizzes" ON public.course_quizzes FOR SELECT TO authenticated USING (is_published = true OR public.is_current_user_admin());
CREATE POLICY "Admins can manage quizzes" ON public.course_quizzes FOR ALL TO authenticated USING (public.is_current_user_admin());

-- QUIZ QUESTIONS
CREATE POLICY "Anyone can view questions" ON public.quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage questions" ON public.quiz_questions FOR ALL TO authenticated USING (public.is_current_user_admin());

-- QUIZ ATTEMPTS
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (public.is_current_user_admin());

-- RESOURCES
CREATE POLICY "Anyone can view published resources" ON public.resources FOR SELECT TO authenticated USING (is_published = true OR public.is_current_user_admin());
CREATE POLICY "Admins can manage resources" ON public.resources FOR ALL TO authenticated USING (public.is_current_user_admin());

-- FORUM CATEGORIES
CREATE POLICY "Anyone can view forum categories" ON public.forum_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage forum categories" ON public.forum_categories FOR ALL TO authenticated USING (public.is_current_user_admin());

-- FORUM THREADS
CREATE POLICY "Anyone can view threads" ON public.forum_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create threads" ON public.forum_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own threads" ON public.forum_threads FOR UPDATE TO authenticated USING (auth.uid() = author_id OR public.is_current_user_admin());
CREATE POLICY "Admins can delete threads" ON public.forum_threads FOR DELETE TO authenticated USING (public.is_current_user_admin());

-- FORUM REPLIES
CREATE POLICY "Anyone can view replies" ON public.forum_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create replies" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own replies" ON public.forum_replies FOR UPDATE TO authenticated USING (auth.uid() = author_id OR public.is_current_user_admin());
CREATE POLICY "Admins can delete replies" ON public.forum_replies FOR DELETE TO authenticated USING (public.is_current_user_admin());

-- CHALLENGES
CREATE POLICY "Anyone can view active challenges" ON public.challenges FOR SELECT TO authenticated USING (is_active = true OR public.is_current_user_admin());
CREATE POLICY "Admins can manage challenges" ON public.challenges FOR ALL TO authenticated USING (public.is_current_user_admin());

-- USER CHALLENGES
CREATE POLICY "Users can view own challenges" ON public.user_challenges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own challenges" ON public.user_challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON public.user_challenges FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ACHIEVEMENTS
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL TO authenticated USING (public.is_current_user_admin());

-- USER ACHIEVEMENTS
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage user achievements" ON public.user_achievements FOR ALL TO authenticated USING (public.is_current_user_admin());

-- JOB LISTINGS
CREATE POLICY "Anyone can view active jobs" ON public.job_listings FOR SELECT TO authenticated USING (is_active = true OR public.is_current_user_admin());
CREATE POLICY "Authenticated users can create jobs" ON public.job_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = posted_by);
CREATE POLICY "Authors can update own jobs" ON public.job_listings FOR UPDATE TO authenticated USING (auth.uid() = posted_by OR public.is_current_user_admin());
CREATE POLICY "Admins can delete jobs" ON public.job_listings FOR DELETE TO authenticated USING (public.is_current_user_admin());

-- JOB APPLICATIONS
CREATE POLICY "Users can view own applications" ON public.job_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create applications" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Job owners can view applications" ON public.job_applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.job_listings WHERE id = job_id AND posted_by = auth.uid()));

-- PHARMACY LISTINGS
CREATE POLICY "Anyone can view active pharmacies" ON public.pharmacy_listings FOR SELECT TO authenticated USING (is_active = true OR public.is_current_user_admin());
CREATE POLICY "Owners can create pharmacies" ON public.pharmacy_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own pharmacies" ON public.pharmacy_listings FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.is_current_user_admin());
CREATE POLICY "Admins can delete pharmacies" ON public.pharmacy_listings FOR DELETE TO authenticated USING (public.is_current_user_admin());

-- EVENTS
CREATE POLICY "Anyone can view published events" ON public.events FOR SELECT TO authenticated USING (is_published = true OR public.is_current_user_admin());
CREATE POLICY "Admins can manage events" ON public.events FOR ALL TO authenticated USING (public.is_current_user_admin());

-- EVENT REGISTRATIONS
CREATE POLICY "Users can view own registrations" ON public.event_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can register for events" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unregister" ON public.event_registrations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PROMOTIONS
CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT TO authenticated USING (is_active = true OR public.is_current_user_admin());
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL TO authenticated USING (public.is_current_user_admin());

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- SYSTEM SETTINGS
CREATE POLICY "Anyone can view settings" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL TO authenticated USING (public.is_current_user_admin());

-- ACTIVITY LOG
CREATE POLICY "Users can view own activity" ON public.activity_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can log own activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all activity" ON public.activity_log FOR SELECT TO authenticated USING (public.is_current_user_admin());
