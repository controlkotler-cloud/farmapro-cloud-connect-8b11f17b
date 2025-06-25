
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChallengeManagement } from '@/components/admin/challenges/ChallengeManagement';
import { ChallengeStats } from '@/components/admin/challenges/ChallengeStats';
import { UserChallengeProgress } from '@/components/admin/challenges/UserChallengeProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database } from '@/integrations/supabase/types';

type ChallengeType = Database['public']['Enums']['challenge_type'];

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  points_reward: number;
  target_count: number;
  is_active: boolean;
  created_at: string;
}

interface ChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  current_count: number;
  completed_at: string | null;
  points_earned: number;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  challenges?: {
    name: string;
    type: ChallengeType;
    points_reward: number;
    target_count: number;
  };
}

interface ChallengeStats {
  totalChallenges: number;
  activeChallenges: number;
  totalCompletions: number;
  totalPointsAwarded: number;
}

const AdminRetos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch challenges
  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ['admin-challenges'],
    queryFn: async () => {
      console.log('Fetching challenges...');
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching challenges:', error);
        throw error;
      }

      console.log('Challenges fetched:', data);
      return data as Challenge[];
    }
  });

  // Fetch challenge progress
  const { data: challengeProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['admin-challenge-progress'],
    queryFn: async () => {
      console.log('Fetching challenge progress...');
      const { data, error } = await supabase
        .from('user_challenge_progress')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          ),
          challenges:challenge_id (
            name,
            type,
            points_reward,
            target_count
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching challenge progress:', error);
        throw error;
      }

      console.log('Challenge progress fetched:', data);
      return data as ChallengeProgress[];
    }
  });

  // Calculate stats
  const stats: ChallengeStats = {
    totalChallenges: challenges.length,
    activeChallenges: challenges.filter(c => c.is_active).length,
    totalCompletions: challengeProgress.filter(p => p.completed_at).length,
    totalPointsAwarded: challengeProgress.reduce((sum, p) => sum + (p.points_earned || 0), 0)
  };

  // Create challenge mutation
  const createChallengeMutation = useMutation({
    mutationFn: async (challengeData: {
      name: string;
      description?: string;
      type: ChallengeType;
      points_reward: number;
      target_count: number;
      is_active: boolean;
    }) => {
      console.log('Creating challenge:', challengeData);
      const { data, error } = await supabase
        .from('challenges')
        .insert([challengeData])
        .select()
        .single();

      if (error) {
        console.error('Error creating challenge:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      toast({
        title: "Éxito",
        description: "Reto creado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el reto",
        variant: "destructive",
      });
    }
  });

  // Update challenge mutation
  const updateChallengeMutation = useMutation({
    mutationFn: async ({ id, ...challengeData }: { 
      id: string;
      name?: string;
      description?: string;
      type?: ChallengeType;
      points_reward?: number;
      target_count?: number;
      is_active?: boolean;
    }) => {
      console.log('Updating challenge:', id, challengeData);
      const { data, error } = await supabase
        .from('challenges')
        .update(challengeData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating challenge:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      toast({
        title: "Éxito",
        description: "Reto actualizado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error updating challenge:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el reto",
        variant: "destructive",
      });
    }
  });

  // Delete challenge mutation
  const deleteChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      console.log('Deleting challenge:', challengeId);
      
      // First delete all user progress for this challenge
      const { error: progressError } = await supabase
        .from('user_challenge_progress')
        .delete()
        .eq('challenge_id', challengeId);

      if (progressError) {
        console.error('Error deleting challenge progress:', progressError);
        throw progressError;
      }

      // Then delete the challenge
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId);

      if (error) {
        console.error('Error deleting challenge:', error);
        throw error;
      }

      return challengeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['admin-challenge-progress'] });
      toast({
        title: "Éxito",
        description: "Reto eliminado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error deleting challenge:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el reto",
        variant: "destructive",
      });
    }
  });

  // Reset user progress mutation
  const resetProgressMutation = useMutation({
    mutationFn: async (progressId: string) => {
      console.log('Resetting progress:', progressId);
      const { error } = await supabase
        .from('user_challenge_progress')
        .update({
          current_count: 0,
          completed_at: null,
          points_earned: 0
        })
        .eq('id', progressId);

      if (error) {
        console.error('Error resetting progress:', error);
        throw error;
      }

      return progressId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenge-progress'] });
      toast({
        title: "Éxito",
        description: "Progreso reiniciado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error resetting progress:', error);
      toast({
        title: "Error",
        description: "No se pudo reiniciar el progreso",
        variant: "destructive",
      });
    }
  });

  const handleCreateChallenge = async (challengeData: {
    name: string;
    description?: string;
    type: ChallengeType;
    points_reward: number;
    target_count: number;
    is_active: boolean;
  }) => {
    await createChallengeMutation.mutateAsync(challengeData);
  };

  const handleUpdateChallenge = async (id: string, challengeData: {
    name?: string;
    description?: string;
    type?: ChallengeType;
    points_reward?: number;
    target_count?: number;
    is_active?: boolean;
  }) => {
    await updateChallengeMutation.mutateAsync({ id, ...challengeData });
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    await deleteChallengeMutation.mutateAsync(challengeId);
  };

  const handleResetProgress = async (progressId: string) => {
    await resetProgressMutation.mutateAsync(progressId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Retos farmapro</h1>
        <p className="text-gray-600">Administra el sistema de gamificación y retos de la plataforma</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="challenges">Retos</TabsTrigger>
          <TabsTrigger value="progress">Progreso de Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ChallengeStats
            stats={stats}
            challenges={challenges}
            challengeProgress={challengeProgress}
          />
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          <ChallengeManagement
            challenges={challenges}
            loading={challengesLoading}
            onCreateChallenge={handleCreateChallenge}
            onUpdateChallenge={handleUpdateChallenge}
            onDeleteChallenge={handleDeleteChallenge}
            creating={createChallengeMutation.isPending}
            updating={updateChallengeMutation.isPending}
            deleting={deleteChallengeMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <UserChallengeProgress
            challengeProgress={challengeProgress}
            loading={progressLoading}
            onResetProgress={handleResetProgress}
            resetting={resetProgressMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminRetos;
