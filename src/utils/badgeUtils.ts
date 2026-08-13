
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateStreak } from '@/utils/streakUtils';

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
}

/**
 * Check all badges for a user and award any that are newly earned.
 * Call this after any activity that could unlock a badge.
 */
export const checkAndAwardBadges = async (userId: string) => {
  try {
    // Get all active badges
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true);

    if (badgesError || !allBadges) return;

    // Get user's already earned badges
    const { data: earnedBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const earnedIds = new Set((earnedBadges || []).map(b => b.badge_id));

    // Filter to unevaluated badges (exclude manual and already earned)
    const unchecked = allBadges.filter(b => !earnedIds.has(b.id) && b.requirement_type !== 'manual');

    if (unchecked.length === 0) return;

    // Gather all user stats in parallel
    const [
      coursesResult,
      perfectQuizResult,
      forumPostsResult,
      forumRepliesResult,
      downloadsResult,
      pointsResult,
      replyLikesResult,
      completedCoursesResult,
      teamMembersResult,
      subscriptionResult,
    ] = await Promise.all([
      supabase.from('course_enrollments').select('id', { count: 'exact', head: true }).eq('user_id', userId).not('completed_at', 'is', null),
      supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('percentage', 100),
      supabase.from('forum_threads').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('forum_replies').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('resource_downloads').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('user_points').select('total_points, level').eq('user_id', userId).maybeSingle(),
      supabase.from('forum_reply_likes').select('reply_id, forum_replies!inner(author_id)').eq('forum_replies.author_id', userId),
      supabase.from('course_enrollments').select('courses!inner(category, is_premium)').eq('user_id', userId).not('completed_at', 'is', null),
      supabase.from('team_members').select('id, team_subscriptions!inner(owner_id)').eq('status', 'active').eq('team_subscriptions.owner_id', userId),
      supabase.from('subscriptions').select('created_at').eq('user_id', userId).in('status', ['active', 'trialing']).order('created_at', { ascending: true }).limit(1).maybeSingle(),
    ]);

    const streakDays = await calculateStreak(userId);

    // Máximo de "me gusta" en una sola respuesta del usuario
    const likesByReply = new Map<string, number>();
    for (const like of (replyLikesResult.data as { reply_id: string }[] | null) || []) {
      likesByReply.set(like.reply_id, (likesByReply.get(like.reply_id) || 0) + 1);
    }
    const replyLikesMax = likesByReply.size ? Math.max(...likesByReply.values()) : 0;

    const completedCourses = ((completedCoursesResult.data as
      | { courses: { category: string | null; is_premium: boolean | null } | null }[]
      | null) || []);
    const courseCategories = new Set(
      completedCourses.map(row => row.courses?.category).filter(Boolean) as string[],
    ).size;
    const premiumCoursesCompleted = completedCourses.filter(row => row.courses?.is_premium).length;

    let monthsSubscribed = 0;
    if (subscriptionResult.data?.created_at) {
      const start = new Date(subscriptionResult.data.created_at);
      const now = new Date();
      monthsSubscribed = Math.max(
        0,
        (now.getFullYear() - start.getFullYear()) * 12 +
          (now.getMonth() - start.getMonth()) -
          (now.getDate() < start.getDate() ? 1 : 0),
      );
    }

    const statsMap: Record<string, number> = {
      courses_completed: coursesResult.count || 0,
      quizzes_passed: perfectQuizResult.count || 0,
      forum_posts: forumPostsResult.count || 0,
      forum_replies: forumRepliesResult.count || 0,
      resources_downloaded: downloadsResult.count || 0,
      streak_days: streakDays,
      points_total: pointsResult.data?.total_points || 0,
      level_reached: pointsResult.data?.level || 1,
      reply_likes_max: replyLikesMax,
      course_categories: courseCategories,
      premium_courses_completed: premiumCoursesCompleted,
      team_members_active: teamMembersResult.data?.length || 0,
      months_subscribed: monthsSubscribed,
    };


    // Check each badge
    for (const badge of unchecked) {
      const userValue = statsMap[badge.requirement_type] || 0;
      if (userValue >= badge.requirement_value) {
        // Award badge
        const { error: insertError } = await supabase
          .from('user_badges')
          .insert({ user_id: userId, badge_id: badge.id });

        if (!insertError) {
          toast.success('🏅 ¡Nueva insignia desbloqueada!', {
            description: `${badge.icon} ${badge.name}`,
            duration: 5000,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }
};
