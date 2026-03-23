import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { updateChallengeProgress, calculateTotalPointsFromChallenges } from '@/utils/challengeUtils';
import { calculateStreak } from '@/utils/streakUtils';

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
  streakDays: number;
}

export const useRetosData = () => {
  const { profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    level: 1,
    completedChallenges: 0,
    streakDays: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadChallenges();
      loadUserProgress();
      loadUserStats();
      syncForumProgress(); // Sincronizar progreso del foro
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
      console.log('Challenges loaded:', data);
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
      // Verificar que los datos tienen los campos correctos
      data?.forEach(progress => {
        console.log('Progress item:', {
          challengeId: progress.challenge_id,
          currentCount: progress.current_count,
          completedAt: progress.completed_at,
          pointsEarned: progress.points_earned
        });
      });
      setUserProgress(data || []);
    }
  };

  const syncForumProgress = async () => {
    if (!profile?.id) return;

    console.log('Syncing forum progress for user:', profile.id);

    // Contar hilos creados por el usuario
    const { count: threadCount } = await supabase
      .from('forum_threads')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id);

    // Contar respuestas del usuario
    const { count: replyCount } = await supabase
      .from('forum_replies')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id);

    console.log('Forum stats:', { threadCount, replyCount });

    // Actualizar progreso de retos de foro usando los tipos correctos
    if (threadCount && threadCount > 0) {
      await updateChallengeProgress(profile.id, 'forum_post', threadCount);
    }

    if (replyCount && replyCount > 0) {
      await updateChallengeProgress(profile.id, 'forum_reply', replyCount);
    }

    // Recargar progreso después de sincronizar
    await loadUserProgress();
  };

  const loadUserStats = async () => {
    if (!profile?.id) return;

    console.log('Loading user stats for retos page, user:', profile.id);

    // Calculate points from completed challenges
    const { totalPoints, level } = await calculateTotalPointsFromChallenges(profile.id);
    console.log('Calculated points from challenges:', { totalPoints, level });

    // Get completed challenges - SOLO contar los que tienen completed_at no nulo
    const { data: completedData } = await supabase
      .from('user_challenge_progress')
      .select('id, completed_at')
      .eq('user_id', profile.id)
      .not('completed_at', 'is', null);

    console.log('Actually completed challenges:', completedData);

    // Calculate streak
    const streakDays = await calculateStreak(profile.id);

    const newStats = {
      totalPoints,
      level,
      completedChallenges: completedData?.length || 0,
      streakDays
    };

    console.log('Retos page stats updated after sync:', newStats);
    setUserStats(newStats);
    setLoading(false);
  };

  const getProgressForChallenge = (challengeId: string) => {
    const progress = userProgress.find(p => p.challenge_id === challengeId);
    console.log('Getting progress for challenge:', challengeId, progress);
    return progress;
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
    getPointsToNextLevel,
    syncForumProgress
  };
};
