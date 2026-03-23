
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ChallengeWithProgress {
  name: string;
  description: string | null;
  points_reward: number | null;
  target_count: number | null;
  current_count: number;
  percentage: number;
}

export const UpcomingChallenges = () => {
  const { profile } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) loadChallenges();
  }, [profile?.id]);

  const loadChallenges = async () => {
    if (!profile?.id) return;

    try {
      // Get all active challenges
      const { data: activeChallenges } = await supabase
        .from('challenges')
        .select('id, name, description, points_reward, target_count')
        .eq('is_active', true);

      if (!activeChallenges) { setLoading(false); return; }

      // Get user progress
      const { data: progress } = await supabase
        .from('user_challenge_progress')
        .select('challenge_id, current_count, completed_at')
        .eq('user_id', profile.id);

      const progressMap = new Map(
        (progress || []).map(p => [p.challenge_id, p])
      );

      // Filter incomplete and calculate percentage
      const incomplete = activeChallenges
        .filter(c => {
          const p = progressMap.get(c.id);
          return !p?.completed_at;
        })
        .map(c => {
          const p = progressMap.get(c.id);
          const current = p?.current_count || 0;
          const target = c.target_count || 1;
          return {
            name: c.name || 'Reto',
            description: c.description,
            points_reward: c.points_reward,
            target_count: c.target_count,
            current_count: current,
            percentage: Math.min((current / target) * 100, 99),
          };
        })
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3);

      setChallenges(incomplete);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Próximos Retos</CardTitle>
          <CardDescription>Objetivos que puedes completar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
            ) : challenges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>¡Felicidades! Has completado todos los retos disponibles.</p>
              </div>
            ) : (
              challenges.map((challenge, index) => (
                <div key={index} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{challenge.name}</p>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <Badge className="mb-1">{challenge.points_reward || 0} pts</Badge>
                      <p className="text-xs text-muted-foreground">
                        {challenge.current_count}/{challenge.target_count || '?'}
                      </p>
                    </div>
                  </div>
                  <Progress value={challenge.percentage} className="h-2" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
