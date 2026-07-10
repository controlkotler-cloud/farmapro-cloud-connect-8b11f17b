
GRANT EXECUTE ON FUNCTION public.can_access_contact_info()                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_lesson(uuid)                    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_user_data(uuid)                 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_thread_author(uuid)               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_subscription_role()                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_team_member_of_subscription(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin()                    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_admin(text)                       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_paid_user(uuid)                         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid)                       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_owner(uuid)                        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_owner_strict(uuid, uuid)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_subscription_owner(uuid, uuid)     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.job_is_active_and_visible(uuid)            TO anon, authenticated;
