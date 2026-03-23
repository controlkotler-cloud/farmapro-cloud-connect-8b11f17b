
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

      const { data: challenges } = await supabase
        .from('challenges')
        .select('id, name, description, type, points_reward, target_count, is_weekly, week_start, week_end')
        .eq('is_active', true)
        .eq('is_weekly', true)
        .lte('week_start', today)
        .gte('week_end', today);

      if (!challenges || challenges.length === 0) {
        setWeeklyChallenges([]);
        setLoading(false);
        return;
      }

      const { data: progress } = await supabase
        .from('user_challenge_progress')
        .select('challenge_id, current_count, completed_at')
        .eq('user_id', profile.id);

      const progressMap = new Map(
        (progress || []).map(p => [p.challenge_id, p])
      );

      const mapped: WeeklyChallenge[] = challenges.map(c => {
        const p = progressMap.get(c.id);
        return {
          ...c,
          is_weekly: c.is_weekly ?? false,
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
