
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ChallengeType = Database['public']['Enums']['challenge_type'];

export const updateChallengeProgress = async (userId: string, challengeType: ChallengeType, incrementBy: number = 1) => {
  try {
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
      return;
    }

    for (const challenge of challenges) {
      // Check if user already has progress for this challenge
      const { data: existingProgress, error: progressError } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', challenge.id)
        .maybeSingle();

      if (progressError) {
        console.error('Error fetching user progress:', progressError);
        continue;
      }

      if (existingProgress) {
        // Update existing progress
        const newCount = existingProgress.current_count + incrementBy;
        const isCompleted = newCount >= challenge.target_count;
        
        const { error: updateError } = await supabase
          .from('user_challenge_progress')
          .update({
            current_count: newCount,
            completed_at: isCompleted && !existingProgress.completed_at ? new Date().toISOString() : existingProgress.completed_at,
            points_earned: isCompleted && !existingProgress.completed_at ? challenge.points_reward : existingProgress.points_earned
          })
          .eq('id', existingProgress.id);

        if (updateError) {
          console.error('Error updating challenge progress:', updateError);
        } else if (isCompleted && !existingProgress.completed_at) {
          // Award points for completing the challenge
          await supabase.rpc('add_user_points', {
            user_id: userId,
            points: challenge.points_reward
          });
        }
      } else {
        // Create new progress record
        const isCompleted = incrementBy >= challenge.target_count;
        
        const { error: insertError } = await supabase
          .from('user_challenge_progress')
          .insert({
            user_id: userId,
            challenge_id: challenge.id,
            current_count: incrementBy,
            completed_at: isCompleted ? new Date().toISOString() : null,
            points_earned: isCompleted ? challenge.points_reward : 0
          });

        if (insertError) {
          console.error('Error creating challenge progress:', insertError);
        } else if (isCompleted) {
          // Award points for completing the challenge
          await supabase.rpc('add_user_points', {
            user_id: userId,
            points: challenge.points_reward
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating challenge progress:', error);
  }
};
