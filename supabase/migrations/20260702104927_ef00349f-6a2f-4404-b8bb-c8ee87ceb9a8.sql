
-- 1) Column-level lockdown on courses.course_modules
REVOKE SELECT (course_modules) ON public.courses FROM anon, authenticated, PUBLIC;

-- 2) Revoke EXECUTE on internal / trigger / admin-gated SECURITY DEFINER functions
-- Trigger functions (never called via API)
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_course_slug() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.normalize_job_expires_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.block_unsafe_profile_updates() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_admin_users_to_user_roles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_admin_role_to_user_roles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_pharmacy_listings_public() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_job_listings_public() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_contact_access() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_admin_action() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_points_by_author_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_points_by_user_id() FROM PUBLIC, anon, authenticated;

-- Internal helpers (called only from other functions / RLS internal use)
REVOKE ALL ON FUNCTION public.add_user_points(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_user_points(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.level_for_points(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_security_event(text, jsonb, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_notification_for_user(uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.anonymize_old_applications() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calculate_quiz_stats(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calculate_team_price(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calculate_team_price_v2(integer, integer) FROM PUBLIC, anon, authenticated;

-- Superseded/insecure variants (kept for internal use only)
REVOKE ALL ON FUNCTION public.get_pharmacy_contact_email(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_job_contact_email(uuid) FROM PUBLIC, anon, authenticated;

-- Admin-only RPCs (auth is checked inside, but no need for anon to see them)
REVOKE ALL ON FUNCTION public.grant_user_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_user_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_user_role_admin(uuid, user_role, subscription_status) FROM PUBLIC, anon;
