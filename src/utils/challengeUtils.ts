
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type ChallengeType = Database['public']['Enums']['challenge_type'];

export const updateChallengeProgress = async (userId: string, challengeType: ChallengeType, currentCount: number = 1) => {
  try {
    console.log('Updating challenge progress:', { userId, challengeType, currentCount });
    
    // Get active challenges of this type
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('id, target_count, points_reward, name')
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
      const willComplete = challenge.target_count != null && currentCount >= challenge.target_count && !existingProgress?.completed_at;
      const pointsToAward = willComplete ? (challenge.points_reward || 0) : 0;

      // Only call RPC if count actually increased
      if (currentCount <= prevCount) {
        console.log('Count not increased, skipping:', { prevCount, currentCount });
        continue;
      }

      const { error: rpcError } = await supabase.rpc('update_challenge_progress' as any, {
        challenge_id_param: challenge.id,
        points_earned_param: pointsToAward,
        new_count_param: currentCount
      });

      if (rpcError) {
        console.error('Error updating challenge progress via RPC:', rpcError);
      } else {
        console.log('Challenge progress updated:', { challengeId: challenge.id, currentCount, pointsToAward });
        
        // Show completion toast
        if (willComplete) {
          toast.success('🎉 ¡Reto completado!', {
            description: `${challenge.name || 'Reto'} — +${pointsToAward} puntos`,
            duration: 5000,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in updateChallengeProgress:', error);
  }
};

// Calculate total points from completed challenges
export const calculateTotalPointsFromChallenges = async (userId: string): Promise<{ totalPoints: number; level: number }> => {
  try {
    const { data: completedChallenges, error } = await supabase
      .from('user_challenge_progress')
      .select('points_earned')
      .eq('user_id', userId)
      .not('completed_at', 'is', null);

    if (error) {
      console.error('Error fetching completed challenges:', error);
      return { totalPoints: 0, level: 1 };
    }

    const totalPoints = (completedChallenges || []).reduce((sum, c) => sum + (c.points_earned || 0), 0);
    const level = Math.floor(totalPoints / 1000) + 1;

    return { totalPoints, level };
  } catch (error) {
    console.error('Error calculating points from challenges:', error);
    return { totalPoints: 0, level: 1 };
  }
};
