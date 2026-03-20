
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ChallengeType = Database['public']['Enums']['challenge_type'];

export const updateChallengeProgress = async (userId: string, challengeType: ChallengeType, incrementBy: number = 1) => {
  try {
    console.log('Updating challenge progress via RPC:', { userId, challengeType, incrementBy });
    
    // Get active challenges of this type
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('id, target_count, points_reward')
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
      console.log('Processing challenge via RPC:', challenge);
      
      // Check current progress to determine if challenge is already completed
      const { data: existingProgress } = await supabase
        .from('user_challenge_progress')
        .select('current_count, completed_at')
        .eq('user_id', userId)
        .eq('challenge_id', challenge.id)
        .maybeSingle();

      const currentCount = existingProgress?.current_count || 0;
      const newCount = Math.max(currentCount, incrementBy); // Use the higher value to avoid backwards progress
      const isAlreadyCompleted = existingProgress?.completed_at !== null;
      const willComplete = newCount >= challenge.target_count && !isAlreadyCompleted;
      
      console.log('Challenge progress check:', {
        challengeId: challenge.id,
        currentCount,
        incrementBy,
        newCount,
        targetCount: challenge.target_count,
        isAlreadyCompleted,
        willComplete
      });

      // Use RPC function to update progress securely
      const pointsToAward = willComplete ? challenge.points_reward : 0;
      const { error: rpcError } = await supabase.rpc('update_challenge_progress' as any, {
        challenge_id_param: challenge.id,
        points_earned_param: pointsToAward
      });

      if (rpcError) {
        console.error('Error updating challenge progress via RPC:', rpcError);
      } else {
        console.log('Challenge progress updated via RPC successfully:', {
          challengeId: challenge.id,
          pointsAwarded: pointsToAward
        });
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

    const totalPoints = (completedChallenges || []).reduce((sum, challenge) => sum + (challenge.points_earned || 0), 0);
    const level = Math.floor(totalPoints / 1000) + 1;

    console.log('Calculated points from challenges:', {
      completedChallenges: completedChallenges?.length || 0,
      totalPoints,
      level
    });

    return { totalPoints, level };
  } catch (error) {
    console.error('Error calculating points from challenges:', error);
    return { totalPoints: 0, level: 1 };
  }
};
