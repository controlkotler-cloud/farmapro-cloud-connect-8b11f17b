
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
    ] = await Promise.all([
      supabase.from('course_enrollments').select('id', { count: 'exact', head: true }).eq('user_id', userId).not('completed_at', 'is', null),
      supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('percentage', 100),
      supabase.from('forum_threads').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('forum_replies').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('resource_downloads').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('user_points').select('total_points, level').eq('user_id', userId).maybeSingle(),
    ]);

    const streakDays = await calculateStreak(userId);

    const statsMap: Record<string, number> = {
      courses_completed: coursesResult.count || 0,
      quizzes_passed: perfectQuizResult.count || 0,
      forum_posts: forumPostsResult.count || 0,
      forum_replies: forumRepliesResult.count || 0,
      resources_downloaded: downloadsResult.count || 0,
      streak_days: streakDays,
      points_total: pointsResult.data?.total_points || 0,
      level_reached: pointsResult.data?.level || 1,
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
