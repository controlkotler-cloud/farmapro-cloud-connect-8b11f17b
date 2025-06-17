
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ChallengeType = Database['public']['Enums']['challenge_type'];

export const updateChallengeProgress = async (userId: string, challengeType: ChallengeType, incrementBy: number = 1) => {
  try {
    console.log('Updating challenge progress:', { userId, challengeType, incrementBy });
    
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
      console.log('Processing challenge:', challenge);
      
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
        const wasAlreadyCompleted = existingProgress.completed_at !== null;
        
        console.log('Updating existing progress:', { 
          newCount, 
          isCompleted, 
          wasAlreadyCompleted,
          targetCount: challenge.target_count 
        });
        
        const { error: updateError } = await supabase
          .from('user_challenge_progress')
          .update({
            current_count: newCount,
            completed_at: isCompleted && !wasAlreadyCompleted ? new Date().toISOString() : existingProgress.completed_at,
            points_earned: isCompleted && !wasAlreadyCompleted ? challenge.points_reward : existingProgress.points_earned
          })
          .eq('id', existingProgress.id);

        if (updateError) {
          console.error('Error updating challenge progress:', updateError);
        } else if (isCompleted && !wasAlreadyCompleted) {
          // Award points for completing the challenge
          console.log('Challenge completed! Awarding points:', challenge.points_reward);
          await addUserPoints(userId, challenge.points_reward);
        }
      } else {
        // Create new progress record
        const isCompleted = incrementBy >= challenge.target_count;
        
        console.log('Creating new progress record:', { 
          incrementBy, 
          isCompleted,
          targetCount: challenge.target_count 
        });
        
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
          console.log('New challenge completed! Awarding points:', challenge.points_reward);
          await addUserPoints(userId, challenge.points_reward);
        }
      }
    }
  } catch (error) {
    console.error('Error updating challenge progress:', error);
  }
};

// Función mejorada para añadir puntos que actualiza tanto total_points como level
const addUserPoints = async (userId: string, points: number) => {
  try {
    console.log('Adding user points:', { userId, points });
    
    // Primero obtener los puntos actuales del usuario
    const { data: currentData, error: fetchError } = await supabase
      .from('user_points')
      .select('total_points, level')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching current points:', fetchError);
      return;
    }

    const currentTotalPoints = currentData?.total_points || 0;
    const newTotalPoints = currentTotalPoints + points;
    // Calcular el nivel basado en los puntos totales (cada 1000 puntos = 1 nivel)
    const newLevel = Math.floor(newTotalPoints / 1000) + 1;

    console.log('Calculating new points and level:', { 
      currentTotalPoints, 
      pointsToAdd: points,
      newTotalPoints, 
      newLevel 
    });

    // Hacer upsert de los puntos del usuario con mejor manejo de conflictos
    const { data: upsertData, error: upsertError } = await supabase
      .from('user_points')
      .upsert({
        user_id: userId,
        total_points: newTotalPoints,
        level: newLevel,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select();

    if (upsertError) {
      console.error('Error upserting user points:', upsertError);
      
      // Intentar una actualización directa si el upsert falla
      console.log('Trying direct update instead...');
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_points: newTotalPoints,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (updateError) {
        console.error('Error updating user points:', updateError);
      } else {
        console.log('User points updated successfully via direct update');
      }
    } else {
      console.log('User points updated successfully:', upsertData);
    }

    // Verificar que los puntos se guardaron correctamente
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_points')
      .select('total_points, level')
      .eq('user_id', userId)
      .single();

    if (verifyError) {
      console.error('Error verifying points update:', verifyError);
    } else {
      console.log('Verified user points after update:', verifyData);
    }
  } catch (error) {
    console.error('Error in addUserPoints:', error);
  }
};
