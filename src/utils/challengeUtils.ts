import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { checkAndAwardBadges } from '@/utils/badgeUtils';

type ChallengeType = Database['public']['Enums']['challenge_type'];

/**
 * Cuenta real de acciones del usuario para un tipo de reto, leída de la
 * tabla de origen. Devuelve null si el tipo no tiene tabla asociada o si la
 * consulta falla (entonces se usa el fallback incremental).
 *
 * `since` (ISO) limita la cuenta a partir de una fecha: los retos semanales
 * (`is_weekly` con `start_date`) solo cuentan lo hecho dentro de su semana.
 */
const countRealActions = async (
  userId: string,
  challengeType: ChallengeType,
  since: string | null,
): Promise<number | null> => {
  try {
    switch (challengeType) {
      case 'resource_downloaded': {
        // Distintos: volver a bajar el mismo recurso no es "otro recurso".
        let q = supabase.from('resource_downloads').select('resource_id').eq('user_id', userId);
        if (since) q = q.gte('downloaded_at', since);
        const { data, error } = await q;
        if (error) return null;
        return new Set((data || []).map((d) => d.resource_id).filter(Boolean)).size;
      }
      case 'course_started': {
        let q = supabase.from('course_enrollments').select('id', { count: 'exact', head: true }).eq('user_id', userId);
        if (since) q = q.gte('enrolled_at', since);
        const { count, error } = await q;
        return error ? null : (count ?? 0);
      }
      case 'course_completed': {
        let q = supabase
          .from('course_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('completed_at', 'is', null);
        if (since) q = q.gte('completed_at', since);
        const { count, error } = await q;
        return error ? null : (count ?? 0);
      }
      case 'quiz_completed': {
        // Distintos por quiz: repetir una evaluación aprobada no suma.
        let q = supabase.from('quiz_attempts').select('quiz_id').eq('user_id', userId).eq('passed', true);
        if (since) q = q.gte('completed_at', since);
        const { data, error } = await q;
        if (error) return null;
        return new Set((data || []).map((d) => d.quiz_id).filter(Boolean)).size;
      }
      case 'forum_post': {
        let q = supabase.from('forum_threads').select('id', { count: 'exact', head: true }).eq('author_id', userId);
        if (since) q = q.gte('created_at', since);
        const { count, error } = await q;
        return error ? null : (count ?? 0);
      }
      case 'forum_reply': {
        let q = supabase.from('forum_replies').select('id', { count: 'exact', head: true }).eq('author_id', userId);
        if (since) q = q.gte('created_at', since);
        const { count, error } = await q;
        return error ? null : (count ?? 0);
      }
      default:
        return null;
    }
  } catch (e) {
    console.error('countRealActions failed:', e);
    return null;
  }
};

/**
 * Avanza los retos activos de un tipo para el usuario.
 *
 * El progreso que se guarda es la CUENTA REAL de acciones (recursos distintos
 * descargados, cursos terminados, etc.), leída de la tabla de origen. Antes
 * cada llamada mandaba `1` como cuenta absoluta y la RPC solo actualiza si la
 * cuenta nueva es mayor que la guardada, así que a partir de la segunda acción
 * ningún reto avanzaba (lo vio Francesc el 08-09-2026: tres recursos
 * descargados y "Cinco recursos" seguía en 1/5).
 *
 * `currentCount` se conserva por compatibilidad: si no se puede leer la cuenta
 * real, se usa como mínimo `max(currentCount, guardada + 1)`.
 */
export const updateChallengeProgress = async (userId: string, challengeType: ChallengeType, currentCount: number = 1) => {
  try {
    console.log('Updating challenge progress:', { userId, challengeType, currentCount });

    // Get active challenges of this type
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('id, target_count, points_reward, name, is_weekly, start_date')
      .eq('type', challengeType)
      .eq('is_active', true);

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError);
      return;
    }

    if (!challenges || challenges.length === 0) {
      console.log('No active challenges found for type:', challengeType);
      return;
    }

    // Cuenta real, una consulta por ventana temporal (global o desde start_date).
    const realCounts = new Map<string, number | null>();
    const realCountFor = async (since: string | null) => {
      const key = since ?? '';
      if (!realCounts.has(key)) realCounts.set(key, await countRealActions(userId, challengeType, since));
      return realCounts.get(key) ?? null;
    };

    for (const challenge of challenges) {
      // Check if already completed
      const { data: existingProgress } = await supabase
        .from('user_challenge_progress')
        .select('current_count, completed_at')
        .eq('user_id', userId)
        .eq('challenge_id', challenge.id)
        .maybeSingle();

      if (existingProgress?.completed_at) {
        console.log('Challenge already completed:', challenge.id);
        continue;
      }

      const prevCount = existingProgress?.current_count || 0;
      const since = challenge.is_weekly && challenge.start_date ? `${challenge.start_date}T00:00:00Z` : null;
      const real = await realCountFor(since);
      const newCount = real ?? Math.max(currentCount, prevCount + 1);

      const willComplete = challenge.target_count != null && newCount >= challenge.target_count;
      const pointsToAward = willComplete ? (challenge.points_reward || 0) : 0;

      // Only call RPC if count actually increased
      if (newCount <= prevCount) {
        console.log('Count not increased, skipping:', { prevCount, newCount });
        continue;
      }

      const { error: rpcError } = await supabase.rpc('update_challenge_progress' as any, {
        challenge_id_param: challenge.id,
        points_earned_param: pointsToAward,
        new_count_param: newCount
      });

      if (rpcError) {
        console.error('Error updating challenge progress via RPC:', rpcError);
      } else {
        console.log('Challenge progress updated:', { challengeId: challenge.id, newCount, pointsToAward });

        // Show completion toast
        if (willComplete) {
          toast.success('¡Reto completado!', {
            description: `${challenge.name || 'Reto'}: +${pointsToAward} puntos`,
            duration: 5000,
          });
        }
      }
    }
    // After processing all challenges, check for new badges
    await checkAndAwardBadges(userId);
  } catch (error) {
    console.error('Error in updateChallengeProgress:', error);
  }
};

// Calculate total points from completed challenges
export const calculateTotalPointsFromChallenges = async (userId: string): Promise<{ totalPoints: number; level: number }> => {
  // Lee el total CANÓNICO de user_points (lo mantiene la BD desde TODA la actividad:
  // retos, cursos completados, quizzes aprobados, foro y descargas). Antes sumaba solo
  // los retos, por eso el total visible salía descuadrado (0) aunque hubiera puntos.
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user points:', error);
      return { totalPoints: 0, level: 1 };
    }

    const totalPoints = data?.total_points ?? 0;
    // Nivel coherente con pointsService (mismos tramos en toda la app).
    const level =
      totalPoints >= 2000 ? 6 :
      totalPoints >= 1000 ? 5 :
      totalPoints >= 600 ? 4 :
      totalPoints >= 300 ? 3 :
      totalPoints >= 100 ? 2 : 1;

    return { totalPoints, level };
  } catch (error) {
    console.error('Error calculating user points:', error);
    return { totalPoints: 0, level: 1 };
  }
};
