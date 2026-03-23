
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { calculateStreak } from '@/utils/streakUtils';

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  is_active: boolean;
}

export interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export interface BadgeWithStatus extends Badge {
  earned: boolean;
  earned_at: string | null;
  progress: number; // 0-100
  currentValue: number;
}

export const useBadges = () => {
  const { profile } = useAuth();
  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (profile?.id) loadBadges();
  }, [profile?.id]);

  const loadBadges = async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
        supabase.from('badges').select('*').eq('is_active', true).order('category').order('requirement_value'),
        supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', profile.id),
      ]);

      if (!allBadges) { setLoading(false); return; }

      const earnedMap = new Map((userBadges || []).map(ub => [ub.badge_id, ub.earned_at]));

      // Get user stats for progress calculation
      const [courses, quizzes, posts, replies, downloads, points] = await Promise.all([
        supabase.from('course_enrollments').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).not('completed_at', 'is', null),
        supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('percentage', 100),
        supabase.from('forum_threads').select('id', { count: 'exact', head: true }).eq('author_id', profile.id),
        supabase.from('forum_replies').select('id', { count: 'exact', head: true }).eq('author_id', profile.id),
        supabase.from('resource_downloads').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
        supabase.from('user_points').select('total_points, level').eq('user_id', profile.id).maybeSingle(),
      ]);

      const streak = await calculateStreak(profile.id);

      const statsMap: Record<string, number> = {
        courses_completed: courses.count || 0,
        quizzes_passed: quizzes.count || 0,
        forum_posts: posts.count || 0,
        forum_replies: replies.count || 0,
        resources_downloaded: downloads.count || 0,
        streak_days: streak,
        points_total: points.data?.total_points || 0,
        level_reached: points.data?.level || 1,
        manual: 0,
      };

      const enriched: BadgeWithStatus[] = allBadges.map(badge => {
        const earned = earnedMap.has(badge.id);
        const currentValue = statsMap[badge.requirement_type] || 0;
        const progress = earned ? 100 : Math.min(Math.round((currentValue / badge.requirement_value) * 100), 99);
        return {
          ...badge,
          earned,
          earned_at: earnedMap.get(badge.id) || null,
          progress,
          currentValue,
        };
      });

      setBadges(enriched);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBadges = categoryFilter === 'all'
    ? badges
    : badges.filter(b => b.category === categoryFilter);

  const earnedCount = badges.filter(b => b.earned).length;
  const recentBadges = badges
    .filter(b => b.earned)
    .sort((a, b) => new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime())
    .slice(0, 3);

  return {
    badges: filteredBadges,
    allBadges: badges,
    loading,
    categoryFilter,
    setCategoryFilter,
    earnedCount,
    totalCount: badges.length,
    recentBadges,
    reload: loadBadges,
  };
};
