
import { supabase } from '@/integrations/supabase/client';

/**
 * Calculate consecutive days of activity for a user.
 * Activity = completing a module, downloading a resource, forum post/reply, or quiz attempt.
 * If today has no activity but yesterday did, the streak still counts.
 */
export const calculateStreak = async (userId: string): Promise<number> => {
  try {
    // Gather activity dates from all sources in parallel
    const [modules, downloads, threads, replies, quizzes] = await Promise.all([
      supabase
        .from('course_enrollments')
        .select('completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null),
      supabase
        .from('resource_downloads')
        .select('downloaded_at')
        .eq('user_id', userId),
      supabase
        .from('forum_threads')
        .select('created_at')
        .eq('author_id', userId),
      supabase
        .from('forum_replies')
        .select('created_at')
        .eq('author_id', userId),
      supabase
        .from('quiz_attempts')
        .select('completed_at')
        .eq('user_id', userId),
    ]);

    // Collect all dates as YYYY-MM-DD strings
    const dateSet = new Set<string>();

    const addDates = (items: any[] | null, field: string) => {
      items?.forEach(item => {
        if (item[field]) {
          dateSet.add(item[field].substring(0, 10));
        }
      });
    };

    addDates(modules.data, 'completed_at');
    addDates(downloads.data, 'downloaded_at');
    addDates(threads.data, 'created_at');
    addDates(replies.data, 'created_at');
    addDates(quizzes.data, 'completed_at');

    if (dateSet.size === 0) return 0;

    // Count consecutive days backwards from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toDateStr = (d: Date) => d.toISOString().substring(0, 10);

    let streak = 0;
    let checkDate = new Date(today);

    // If today has no activity, check yesterday (grace period)
    if (!dateSet.has(toDateStr(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (!dateSet.has(toDateStr(checkDate))) {
        return 0; // No activity today or yesterday
      }
    }

    // Count backwards
    while (dateSet.has(toDateStr(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
};
