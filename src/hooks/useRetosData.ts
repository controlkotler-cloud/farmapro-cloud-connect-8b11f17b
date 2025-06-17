
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { syncUserPoints } from '@/utils/pointsSync';

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  points_reward: number;
  target_count: number;
  is_active: boolean;
  created_at: string;
}

interface UserProgress {
  id: string;
  challenge_id: string;
  current_count: number;
  completed_at: string | null;
  points_earned: number;
}

interface UserStats {
  totalPoints: number;
  level: number;
  completedChallenges: number;
  activeStreaks: number;
}

export const useRetosData = () => {
  const { profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    level: 1,
    completedChallenges: 0,
    activeStreaks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadChallenges();
      loadUserProgress();
      loadUserStats();
    }
  }, [profile]);

  const loadChallenges = async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('points_reward', { ascending: false });

    if (error) {
      console.error('Error loading challenges:', error);
    } else {
      setChallenges(data || []);
    }
  };

  const loadUserProgress = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', profile.id);

    if (error) {
      console.error('Error loading user progress:', error);
    } else {
      console.log('User progress loaded:', data);
      setUserProgress(data || []);
    }
  };

  const loadUserStats = async () => {
    if (!profile?.id) return;

    console.log('Loading user stats for retos page, user:', profile.id);

    // Sincronizar puntos antes de cargar stats
    console.log('Syncing points in retos page...');
    await syncUserPoints(profile.id);

    // Get user points
    const { data: pointsData, error: pointsError } = await supabase
      .from('user_points')
      .select('total_points, level')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (pointsError) {
      console.error('Error fetching user points:', pointsError);
    } else {
      console.log('User points from retos page after sync:', pointsData);
    }

    // Get completed challenges
    const { data: completedData } = await supabase
      .from('user_challenge_progress')
      .select('id')
      .eq('user_id', profile.id)
      .not('completed_at', 'is', null);

    // Calculate active streaks based on recent activity
    const { data: recentActivity } = await supabase
      .from('course_enrollments')
      .select('completed_at')
      .eq('user_id', profile.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(7);

    let activeStreaks = 0;
    if (recentActivity && recentActivity.length > 0) {
      // Simple streak calculation - courses completed in last 7 days
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      activeStreaks = recentActivity.filter(activity => 
        new Date(activity.completed_at) >= lastWeek
      ).length;
    }

    const newStats = {
      totalPoints: pointsData?.total_points || 0,
      level: pointsData?.level || 1,
      completedChallenges: completedData?.length || 0,
      activeStreaks
    };

    console.log('Retos page stats updated after sync:', newStats);
    setUserStats(newStats);
    setLoading(false);
  };

  const getProgressForChallenge = (challengeId: string) => {
    return userProgress.find(p => p.challenge_id === challengeId);
  };

  const getNextLevelProgress = () => {
    // Cada nivel requiere 1000 puntos
    // Nivel 1: 0-999 puntos, Nivel 2: 1000-1999 puntos, etc.
    const pointsInCurrentLevel = userStats.totalPoints % 1000;
    const progressPercentage = (pointsInCurrentLevel / 1000) * 100;
    
    console.log('Retos progress calculation:', {
      totalPoints: userStats.totalPoints,
      level: userStats.level,
      pointsInCurrentLevel,
      progressPercentage
    });
    
    return progressPercentage;
  };

  const getPointsToNextLevel = () => {
    // Puntos necesarios para llegar al siguiente nivel
    const pointsInCurrentLevel = userStats.totalPoints % 1000;
    const pointsNeeded = 1000 - pointsInCurrentLevel;
    
    console.log('Retos points to next level:', {
      totalPoints: userStats.totalPoints,
      pointsInCurrentLevel,
      pointsNeeded
    });
    
    return pointsNeeded;
  };

  return {
    challenges,
    userProgress,
    userStats,
    loading,
    getProgressForChallenge,
    getNextLevelProgress,
    getPointsToNextLevel
  };
};
