import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalPoints: number;
  level: number;
  coursesCompleted: number;
  resourcesDownloaded: number;
  forumPosts: number;
  challengesCompleted: number;
}

interface ActivityItem {
  type: string;
  title: string;
  date: string;
  points: number;
}

export const useDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPoints: 0,
    level: 1,
    coursesCompleted: 0,
    resourcesDownloaded: 0,
    forumPosts: 0,
    challengesCompleted: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (profile?.id) {
      loadUserStats();
      loadRecentActivity();
    }
  }, [profile]);

  // Función para recargar stats manualmente (útil después de completar retos)
  const reloadStats = async () => {
    if (profile?.id) {
      await loadUserStats();
    }
  };

  const loadUserStats = async () => {
    if (!profile?.id) return;

    console.log('Loading user stats for user:', profile.id);

    try {
      // Get user points with más logging
      const { data: points, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points, level')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (pointsError && pointsError.code !== 'PGRST116') {
        console.error('Error fetching points:', pointsError);
      } else {
        console.log('User points fetched:', points);
      }

      // Si no hay datos de puntos, crear un registro inicial
      if (!points) {
        console.log('No points record found, creating initial record...');
        const { data: newPoints, error: createError } = await supabase
          .from('user_points')
          .insert({
            user_id: profile.id,
            total_points: 0,
            level: 1
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating initial points record:', createError);
        } else {
          console.log('Initial points record created:', newPoints);
        }
      }

      // Get courses completed
      const { data: courses } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', profile.id)
        .not('completed_at', 'is', null);

      // Get resources downloaded
      const { data: resources } = await supabase
        .from('resource_downloads')
        .select('id')
        .eq('user_id', profile.id);

      // Get forum posts
      const { data: posts } = await supabase
        .from('forum_threads')
        .select('id')
        .eq('author_id', profile.id);

      // Get challenges completed
      const { data: challenges } = await supabase
        .from('user_challenge_progress')
        .select('id')
        .eq('user_id', profile.id)
        .not('completed_at', 'is', null);

      const newStats = {
        totalPoints: points?.total_points || 0,
        level: points?.level || 1,
        coursesCompleted: courses?.length || 0,
        resourcesDownloaded: resources?.length || 0,
        forumPosts: posts?.length || 0,
        challengesCompleted: challenges?.length || 0,
      };

      console.log('Dashboard stats updated:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    // This would load recent user activity
    setRecentActivity([
      { type: 'course', title: 'Completaste "DAFO para tu Farmacia"', date: '2 horas ago', points: 100 },
      { type: 'resource', title: 'Descargaste "Protocolo de Atención al Cliente"', date: '1 día ago', points: 50 },
      { type: 'forum', title: 'Creaste un nuevo hilo en Gestión', date: '3 días ago', points: 100 },
    ]);
  };

  const getNextLevelProgress = () => {
    // Cada nivel requiere 1000 puntos
    // Nivel 1: 0-999 puntos, Nivel 2: 1000-1999 puntos, etc.
    const pointsInCurrentLevel = stats.totalPoints % 1000;
    const progressPercentage = (pointsInCurrentLevel / 1000) * 100;
    
    console.log('Progress calculation:', {
      totalPoints: stats.totalPoints,
      level: stats.level,
      pointsInCurrentLevel,
      progressPercentage
    });
    
    return progressPercentage;
  };

  const getPointsToNextLevel = () => {
    // Puntos necesarios para llegar al siguiente nivel
    const pointsInCurrentLevel = stats.totalPoints % 1000;
    const pointsNeeded = 1000 - pointsInCurrentLevel;
    
    console.log('Points to next level:', {
      totalPoints: stats.totalPoints,
      pointsInCurrentLevel,
      pointsNeeded
    });
    
    return pointsNeeded;
  };

  return {
    stats,
    recentActivity,
    getNextLevelProgress,
    getPointsToNextLevel,
    reloadStats, // Exportar función para recargar
  };
};
