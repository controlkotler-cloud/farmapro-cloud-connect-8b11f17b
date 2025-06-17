import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { syncUserPoints } from '@/utils/pointsSync';

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
      // Primero sincronizar puntos de retos completados
      console.log('Syncing challenge points...');
      await syncUserPoints(profile.id);

      // Get user points with más logging
      const { data: points, error: pointsError } = await supabase
        .from('user_points')
        .select('total_points, level')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (pointsError && pointsError.code !== 'PGRST116') {
        console.error('Error fetching points:', pointsError);
      } else {
        console.log('User points fetched after sync:', points);
      }

      // Si no hay datos de puntos después de la sincronización, crear un registro inicial
      if (!points) {
        console.log('No points record found after sync, creating initial record...');
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

      // Buscar el reto de cursos completados - probamos diferentes nombres posibles
      console.log('Searching for course completion challenge...');
      const { data: challenges, error: challengeError } = await supabase
        .from('challenges')
        .select('id, name, type')
        .eq('type', 'course_completed');

      if (challengeError) {
        console.error('Error fetching challenges:', challengeError);
      } else {
        console.log('Found challenges:', challenges);
      }

      let coursesCompleted = 0;
      if (challenges && challenges.length > 0) {
        // Usar el primer challenge de tipo course_completed que encontremos
        const challenge = challenges[0];
        console.log('Using challenge:', challenge);
        
        // Get progress for course_completed challenge to count total completions
        const { data: courseProgress } = await supabase
          .from('user_challenge_progress')
          .select('current_count')
          .eq('user_id', profile.id)
          .eq('challenge_id', challenge.id)
          .maybeSingle();

        if (courseProgress) {
          coursesCompleted = courseProgress.current_count;
          console.log('Using challenge progress for courses completed:', coursesCompleted);
        } else {
          console.log('No challenge progress found, checking enrollments...');
          // Fallback: contar enrollments completados
          const { data: enrollments } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('user_id', profile.id)
            .not('completed_at', 'is', null);
          
          coursesCompleted = enrollments?.length || 0;
          console.log('Using enrollment count as fallback:', coursesCompleted);
        }
      } else {
        console.log('No course_completed challenges found, using enrollment count');
        // Si no hay challenges, usar enrollments
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', profile.id)
          .not('completed_at', 'is', null);
        
        coursesCompleted = enrollments?.length || 0;
        console.log('Using enrollment count:', coursesCompleted);
      }

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
      const { data: challengesData } = await supabase
        .from('user_challenge_progress')
        .select('id')
        .eq('user_id', profile.id)
        .not('completed_at', 'is', null);

      const newStats = {
        totalPoints: points?.total_points || 0,
        level: points?.level || 1,
        coursesCompleted,
        resourcesDownloaded: resources?.length || 0,
        forumPosts: posts?.length || 0,
        challengesCompleted: challengesData?.length || 0,
      };

      console.log('Dashboard stats updated after sync:', newStats);
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
