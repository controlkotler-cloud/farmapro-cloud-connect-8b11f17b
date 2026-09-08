
import { supabase } from '@/integrations/supabase/client';
import { calculateTotalPointsFromChallenges } from '@/utils/challengeUtils';
import type { DashboardStats, ActivityItem } from '@/types/dashboard';

export const loadUserStats = async (userId: string): Promise<DashboardStats> => {
  console.log('Loading user stats for user:', userId);

  try {
    // Calculate points from completed challenges
    const { totalPoints, level } = await calculateTotalPointsFromChallenges(userId);
    console.log('Calculated total points from challenges:', { totalPoints, level });

    // Cursos completados = inscripciones con completed_at. Antes se leía el
    // current_count del reto "course_completed", que es un dato derivado y
    // se quedaba desfasado (Francesc 08-09-2026: dos cursos terminados y el
    // panel decía 1 porque el reto seguía en 1).
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .not('completed_at', 'is', null);
    const coursesCompleted = enrollments?.length || 0;

    const { data: resources, error: resourcesError } = await supabase
      .from('resource_downloads')
      .select('id')
      .eq('user_id', userId);

    if (resourcesError) {
      console.error('[dashboardStats] Error fetching resource_downloads:', resourcesError);
    }

    const { data: posts, error: postsError } = await supabase
      .from('forum_threads')
      .select('id')
      .eq('author_id', userId);

    if (postsError) {
      console.error('[dashboardStats] Error fetching forum_threads:', postsError);
    }

    const { data: challengesData, error: challengesDataError } = await supabase
      .from('user_challenge_progress')
      .select('id')
      .eq('user_id', userId)
      .not('completed_at', 'is', null);

    if (challengesDataError) {
      console.error('[dashboardStats] Error fetching user_challenge_progress:', challengesDataError);
    }

    const stats = {
      totalPoints,
      level,
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

export const loadRecentActivity = async (userId: string): Promise<ActivityItem[]> => {
  console.log('Loading recent activity for user:', userId);
  
  try {
    const activities: ActivityItem[] = [];

    // Obtener cursos completados recientes
    const { data: recentCourses } = await supabase
      .from('course_enrollments')
      .select(`
        completed_at,
        courses (title)
      `)
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(3);

    if (recentCourses) {
      recentCourses.forEach(enrollment => {
        if (enrollment.courses && enrollment.completed_at) {
          activities.push({
            type: 'course',
            title: `Completaste "${enrollment.courses.title}"`,
            date: new Date(enrollment.completed_at).toLocaleDateString('es-ES'),
            sortDate: enrollment.completed_at,
            points: 100
          });
        }
      });
    }

    // Obtener descargas recientes de recursos
    const { data: recentDownloads } = await supabase
      .from('resource_downloads')
      .select(`
        downloaded_at,
        resources (title)
      `)
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false })
      .limit(3);

    if (recentDownloads) {
      recentDownloads.forEach(download => {
        if (download.resources && download.downloaded_at) {
          activities.push({
            type: 'resource',
            title: `Descargaste "${download.resources.title}"`,
            date: new Date(download.downloaded_at).toLocaleDateString('es-ES'),
            sortDate: download.downloaded_at,
            points: 50
          });
        }
      });
    }

    // Obtener posts recientes en el foro
    const { data: recentPosts } = await supabase
      .from('forum_threads')
      .select('title, created_at')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (recentPosts) {
      recentPosts.forEach(post => {
        activities.push({
          type: 'forum',
          title: `Creaste el hilo "${post.title}"`,
          date: new Date(post.created_at).toLocaleDateString('es-ES'),
          sortDate: post.created_at,
          points: 100
        });
      });
    }

    // Obtener retos completados recientes
    const { data: recentChallenges } = await supabase
      .from('user_challenge_progress')
      .select(`
        completed_at,
        points_earned,
        challenges (name)
      `)
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(3);

    if (recentChallenges) {
      recentChallenges.forEach(challenge => {
        if (challenge.challenges && challenge.completed_at) {
          activities.push({
            type: 'challenge',
            title: `Completaste el reto "${challenge.challenges.name}"`,
            date: new Date(challenge.completed_at).toLocaleDateString('es-ES'),
            sortDate: challenge.completed_at,
            points: challenge.points_earned || 0
          });
        }
      });
    }

    // Ordenar todas las actividades por fecha más reciente y limitar a las 3 más recientes
    const sortedActivities = activities
      .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
      .slice(0, 3);

    console.log('Loaded recent activities:', sortedActivities);
    return sortedActivities;
    
  } catch (error) {
    console.error('Error loading recent activity:', error);
    return [];
  }
};
