
import { supabase } from '@/integrations/supabase/client';
import { syncUserPoints } from '@/utils/pointsSync';
import type { DashboardStats, ActivityItem } from '@/types/dashboard';

export const loadUserStats = async (userId: string): Promise<DashboardStats> => {
  console.log('Loading user stats for user:', userId);

  try {
    // Primero sincronizar puntos de retos completados
    console.log('Syncing challenge points...');
    await syncUserPoints(userId);

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
      const challenge = challenges.find(c => c.name === 'Estudiante Dedicado') || challenges[0];
      console.log('Using challenge:', challenge);
      
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
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);
      
      coursesCompleted = enrollments?.length || 0;
      console.log('Using enrollment count:', coursesCompleted);
    }

    const { data: resources } = await supabase
      .from('resource_downloads')
      .select('id')
      .eq('user_id', userId);

    const { data: posts } = await supabase
      .from('forum_threads')
      .select('id')
      .eq('author_id', userId);

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
      .limit(5);

    if (recentCourses) {
      recentCourses.forEach(enrollment => {
        if (enrollment.courses && enrollment.completed_at) {
          activities.push({
            type: 'course',
            title: `Completaste "${enrollment.courses.title}"`,
            date: new Date(enrollment.completed_at).toLocaleDateString('es-ES'),
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
      .limit(5);

    if (recentDownloads) {
      recentDownloads.forEach(download => {
        if (download.resources && download.downloaded_at) {
          activities.push({
            type: 'resource',
            title: `Descargaste "${download.resources.title}"`,
            date: new Date(download.downloaded_at).toLocaleDateString('es-ES'),
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
      .limit(5);

    if (recentPosts) {
      recentPosts.forEach(post => {
        activities.push({
          type: 'forum',
          title: `Creaste el hilo "${post.title}"`,
          date: new Date(post.created_at).toLocaleDateString('es-ES'),
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
      .limit(5);

    if (recentChallenges) {
      recentChallenges.forEach(challenge => {
        if (challenge.challenges && challenge.completed_at) {
          activities.push({
            type: 'challenge',
            title: `Completaste el reto "${challenge.challenges.name}"`,
            date: new Date(challenge.completed_at).toLocaleDateString('es-ES'),
            points: challenge.points_earned || 0
          });
        }
      });
    }

    // Ordenar todas las actividades por fecha más reciente y limitar a las 10 más recientes
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    console.log('Loaded recent activities:', sortedActivities);
    return sortedActivities;
    
  } catch (error) {
    console.error('Error loading recent activity:', error);
    return [];
  }
};
