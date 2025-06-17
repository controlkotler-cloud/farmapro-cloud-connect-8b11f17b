
import { supabase } from '@/integrations/supabase/client';

export const syncUserPoints = async (userId: string) => {
  try {
    console.log('Starting points synchronization for user:', userId);
    
    // Obtener todos los puntos ganados de retos completados
    const { data: completedChallenges, error: challengesError } = await supabase
      .from('user_challenge_progress')
      .select('points_earned')
      .eq('user_id', userId)
      .not('completed_at', 'is', null);

    if (challengesError) {
      console.error('Error fetching completed challenges:', challengesError);
      return false;
    }

    // Calcular total de puntos ganados de retos
    const totalChallengePoints = completedChallenges?.reduce((sum, challenge) => sum + (challenge.points_earned || 0), 0) || 0;
    
    console.log('Total points from completed challenges:', totalChallengePoints);

    if (totalChallengePoints === 0) {
      console.log('No challenge points to sync');
      return true;
    }

    // Calcular nivel basado en puntos totales
    const newLevel = Math.floor(totalChallengePoints / 1000) + 1;

    console.log('Syncing points:', { totalChallengePoints, newLevel });

    // Actualizar o crear registro en user_points
    const { data: upsertData, error: upsertError } = await supabase
      .from('user_points')
      .upsert({
        user_id: userId,
        total_points: totalChallengePoints,
        level: newLevel,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select();

    if (upsertError) {
      console.error('Error syncing user points:', upsertError);
      return false;
    }

    console.log('Points synchronized successfully:', upsertData);
    return true;
  } catch (error) {
    console.error('Error in syncUserPoints:', error);
    return false;
  }
};
