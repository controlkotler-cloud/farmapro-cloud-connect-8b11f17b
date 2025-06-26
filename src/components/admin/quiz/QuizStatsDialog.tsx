
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { QuizStats } from '@/types/quiz';

interface QuizStatsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string | null;
}

interface QuizAttemptData {
  id: string;
  user_id: string;
  percentage: number;
  passed: boolean;
  completed_at: string;
  time_taken_seconds: number;
  profiles: {
    full_name: string;
    email: string;
  };
}

export const QuizStatsDialog: React.FC<QuizStatsDialogProps> = ({
  isOpen,
  onOpenChange,
  quizId
}) => {
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quizId && isOpen) {
      loadStats();
      loadAttempts();
    }
  }, [quizId, isOpen]);

  const loadStats = async () => {
    if (!quizId) return;

    const { data, error } = await supabase
      .rpc('calculate_quiz_stats', { quiz_id_param: quizId });

    if (error) {
      console.error('Error loading quiz stats:', error);
    } else if (data && data.length > 0) {
      setStats(data[0]);
    }
  };

  const loadAttempts = async () => {
    if (!quizId) return;

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        id,
        user_id,
        percentage,
        passed,
        completed_at,
        time_taken_seconds,
        profiles!quiz_attempts_user_id_fkey(full_name, email)
      `)
      .eq('quiz_id', quizId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading quiz attempts:', error);
    } else {
      setAttempts(data || []);
    }
    
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-8">Cargando estadísticas...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Estadísticas del Quiz</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Intentos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_attempts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Únicos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_users}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Puntuación Media</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.average_score}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pass_rate}%</div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Intentos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No hay intentos completados aún.
                </p>
              ) : (
                <div className="space-y-4">
                  {attempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">
                          {attempt.profiles?.full_name || attempt.profiles?.email || 'Usuario desconocido'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(attempt.completed_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">{attempt.percentage}%</p>
                          {attempt.time_taken_seconds && (
                            <p className="text-sm text-gray-600">
                              {formatTime(attempt.time_taken_seconds)}
                            </p>
                          )}
                        </div>
                        <Badge variant={attempt.passed ? "default" : "destructive"}>
                          {attempt.passed ? 'Aprobado' : 'Reprobado'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
