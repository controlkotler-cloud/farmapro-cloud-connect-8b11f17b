
import { supabase } from '@/integrations/supabase/client';
import { syncUserPoints } from '@/utils/pointsSync';
import type { DashboardStats, ActivityItem } from '@/types/dashboard';

export const loadUserStats = async (userId: string): Promise<DashboardStats> => {
  console.log('Loading user stats for user:', userId);

  try {
    // Primero sincronizar puntos de retos completados
    console.log('Syncing challenge points...');
    await syncUserPoints(userId);

    // Get user points with más logging
    const { data: points, error: pointsError } = await supabase
      .from('user_points')
      .select('total_points, level')
      .eq('user_id', userId)
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
          user_id: userId,
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
        .eq('user_id', userId)
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
          .eq('user_id', userId)
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
        .eq('user_id', userId)
        .not('completed_at', 'is', null);
      
      coursesCompleted = enrollments?.length || 0;
      console.log('Using enrollment count:', coursesCompleted);
    }

    // Get resources downloaded
    const { data: resources } = await supabase
      .from('resource_downloads')
      .select('id')
      .eq('user_id', userId);

    // Get forum posts
    const { data: posts } = await supabase
      .from('forum_threads')
      .select('id')
      .eq('author_id', userId);

    // Get challenges completed
    const { data: challengesData } = await supabase
      .from('user_challenge_progress')
      .select('id')
      .eq('user_id', userId)
      .not('completed_at', 'is', null);

    const stats = {
      totalPoints: points?.total_points || 0,
      level: points?.level || 1,
      coursesCompleted,
      resourcesDownloaded: resources?.length || 0,
      forumPosts: posts?.length || 0,
      challengesCompleted: challengesData?.length || 0,
    };

    console.log('Dashboard stats updated after sync:', stats);
    return stats;
  } catch (error) {
    console.error('Error loading user stats:', error);
    throw error;
  }
};

export const loadRecentActivity = async (): Promise<ActivityItem[]> => {
  // This would load recent user activity
  return [
    { type: 'course', title: 'Completaste "DAFO para tu Farmacia"', date: '2 horas ago', points: 100 },
    { type: 'resource', title: 'Descargaste "Protocolo de Atención al Cliente"', date: '1 día ago', points: 50 },
    { type: 'forum', title: 'Creaste un nuevo hilo en Gestión', date: '3 días ago', points: 100 },
  ];
};
