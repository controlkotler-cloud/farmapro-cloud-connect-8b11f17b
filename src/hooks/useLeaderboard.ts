
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  first_name: string;
  avatar_url: string | null;
  level: number;
  total_points: number;
  badge_count: number;
  rank: number;
  isCurrentUser: boolean;
}

export const useLeaderboard = () => {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all_time' | 'this_month'>('this_month');

  useEffect(() => {
    loadLeaderboard();
  }, [profile?.id, timeFilter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      // Get all user points with profiles (excluding opted-out users)
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('user_id, total_points, level')
        .order('total_points', { ascending: false })
        .limit(50);

      if (!pointsData) { setLoading(false); return; }

      // Get profiles for these users (filter opt_out)
      const userIds = pointsData.map(p => p.user_id).filter(Boolean) as string[];
      if (userIds.length === 0) { setLoading(false); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, opt_out_leaderboard')
        .in('id', userIds);

      // Get badge counts
      const { data: badgeCounts } = await supabase
        .from('user_badges')
        .select('user_id');

      const badgeCountMap = new Map<string, number>();
      (badgeCounts || []).forEach(b => {
        badgeCountMap.set(b.user_id, (badgeCountMap.get(b.user_id) || 0) + 1);
      });

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Build leaderboard
      let rank = 0;
      const allEntries: LeaderboardEntry[] = [];
      let currentUserEntry: LeaderboardEntry | null = null;

      for (const pt of pointsData) {
        if (!pt.user_id) continue;
        const prof = profileMap.get(pt.user_id);
        if (!prof || prof.opt_out_leaderboard) continue;

        rank++;
        const firstName = (prof.full_name || 'Usuario').split(' ')[0];
        const entry: LeaderboardEntry = {
          user_id: pt.user_id,
          first_name: firstName,
          avatar_url: prof.avatar_url,
          level: pt.level || 1,
          total_points: pt.total_points || 0,
          badge_count: badgeCountMap.get(pt.user_id) || 0,
          rank,
          isCurrentUser: pt.user_id === profile?.id,
        };

        allEntries.push(entry);
        if (entry.isCurrentUser) currentUserEntry = entry;
      }

      setEntries(allEntries.slice(0, 20));
      setCurrentUserRank(currentUserEntry && currentUserEntry.rank > 20 ? currentUserEntry : null);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    entries,
    currentUserRank,
    loading,
    timeFilter,
    setTimeFilter,
  };
};
