
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface WeeklyChallenge {
  id: string;
  name: string | null;
  description: string | null;
  type: string;
  points_reward: number | null;
  target_count: number | null;
  is_weekly: boolean;
  week_start: string | null;
  week_end: string | null;
  current_count: number;
  completed_at: string | null;
}

export const useWeeklyChallenges = () => {
  const { profile } = useAuth();
  const [weeklyChallenges, setWeeklyChallenges] = useState<WeeklyChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) loadWeekly();
  }, [profile?.id]);

  const loadWeekly = async () => {
    if (!profile?.id) return;
    try {
      const today = new Date().toISOString().split('T')[0];

      // Use raw query to access new columns not yet in types
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('id, name, description, type, points_reward, target_count')
        .eq('is_active', true)
        .filter('is_weekly', 'eq', true)
        .filter('week_start', 'lte', today)
        .filter('week_end', 'gte', today) as any;

      if (error || !challenges || challenges.length === 0) {
        setWeeklyChallenges([]);
        setLoading(false);
        return;
      }

      const challengeIds = challenges.map((c: any) => c.id);

      const { data: progress } = await supabase
        .from('user_challenge_progress')
        .select('challenge_id, current_count, completed_at')
        .eq('user_id', profile.id)
        .in('challenge_id', challengeIds);

      const progressMap = new Map(
        (progress || []).map(p => [p.challenge_id, p])
      );

      const mapped: WeeklyChallenge[] = challenges.map((c: any) => {
        const p = progressMap.get(c.id);
        return {
          id: c.id,
          name: c.name,
          description: c.description,
          type: c.type,
          points_reward: c.points_reward,
          target_count: c.target_count,
          is_weekly: true,
          week_start: c.week_start || null,
          week_end: c.week_end || null,
          current_count: p?.current_count || 0,
          completed_at: p?.completed_at || null,
        };
      });

      setWeeklyChallenges(mapped);
    } catch (error) {
      console.error('Error loading weekly challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  return { weeklyChallenges, loading, reload: loadWeekly };
};
