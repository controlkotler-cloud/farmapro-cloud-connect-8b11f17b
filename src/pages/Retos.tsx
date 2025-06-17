
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Star, CheckCircle, Clock, Gift, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  points_reward: number;
  target_count: number;
  is_active: boolean;
  created_at: string;
}

interface UserProgress {
  id: string;
  challenge_id: string;
  current_count: number;
  completed_at: string | null;
  points_earned: number;
}

const Retos = () => {
  const { profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    level: 1,
    completedChallenges: 0,
    activeStreaks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadChallenges();
      loadUserProgress();
      loadUserStats();
    }
  }, [profile]);

  const loadChallenges = async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('points_reward', { ascending: false });

    if (error) {
      console.error('Error loading challenges:', error);
    } else {
      setChallenges(data || []);
    }
  };

  const loadUserProgress = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', profile.id);

    if (error) {
      console.error('Error loading user progress:', error);
    } else {
      setUserProgress(data || []);
    }
  };

  const loadUserStats = async () => {
    if (!profile?.id) return;

    const { data: pointsData } = await supabase
      .from('user_points')
      .select('total_points, level')
      .eq('user_id', profile.id)
      .single();

    const { data: completedData } = await supabase
      .from('user_challenge_progress')
      .select('id')
      .eq('user_id', profile.id)
      .not('completed_at', 'is', null);

    // Calculate active streaks based on recent activity
    const { data: recentActivity } = await supabase
      .from('course_enrollments')
      .select('completed_at')
      .eq('user_id', profile.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(7);

    let activeStreaks = 0;
    if (recentActivity && recentActivity.length > 0) {
      // Simple streak calculation - courses completed in last 7 days
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      activeStreaks = recentActivity.filter(activity => 
        new Date(activity.completed_at) >= lastWeek
      ).length;
    }

    setUserStats({
      totalPoints: pointsData?.total_points || 0,
      level: pointsData?.level || 1,
      completedChallenges: completedData?.length || 0,
      activeStreaks
    });

    setLoading(false);
  };

  const getProgressForChallenge = (challengeId: string) => {
    return userProgress.find(p => p.challenge_id === challengeId);
  };

  const isCompleted = (challengeId: string) => {
    const progress = getProgressForChallenge(challengeId);
    return progress?.completed_at !== null;
  };

  const getProgressPercentage = (challenge: Challenge) => {
    const progress = getProgressForChallenge(challenge.id);
    if (!progress) return 0;
    return Math.min((progress.current_count / challenge.target_count) * 100, 100);
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'course_completed':
        return <Target className="h-6 w-6" />;
      case 'forum_participation':
        return <Star className="h-6 w-6" />;
      case 'resource_download':
        return <Gift className="h-6 w-6" />;
      default:
        return <Trophy className="h-6 w-6" />;
    }
  };

  const getChallengeTypeLabel = (type: string) => {
    switch (type) {
      case 'course_completed':
        return 'Cursos';
      case 'forum_participation':
        return 'Participación';
      case 'resource_download':
        return 'Recursos';
      default:
        return 'General';
    }
  };

  const getNextLevelProgress = () => {
    const pointsForNextLevel = userStats.level * 1000;
    const currentLevelPoints = userStats.totalPoints % 1000;
    const progressPercentage = (currentLevelPoints / pointsForNextLevel) * 100;
    return Math.min(progressPercentage, 100);
  };

  const getPointsToNextLevel = () => {
    const pointsForNextLevel = userStats.level * 1000;
    const currentLevelPoints = userStats.totalPoints % 1000;
    return pointsForNextLevel - currentLevelPoints;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sistema de Retos</h1>
        <p className="text-gray-600">Completa desafíos y gana puntos para subir de nivel</p>
      </div>

      {/* User Stats - Updated with level info */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Puntos Totales</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nivel Actual</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.level}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Retos Completados</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.completedChallenges}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rachas Activas</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.activeStreaks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Level Progress Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-3">
              <TrendingUp className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Progreso de Nivel</p>
                <p className="text-lg font-bold text-gray-900">Nivel {userStats.level}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>{userStats.totalPoints % 1000} pts</span>
                <span>{getPointsToNextLevel()} pts restantes</span>
              </div>
              <Progress value={getNextLevelProgress()} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Challenges */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Retos Disponibles</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((challenge, index) => {
              const progress = getProgressForChallenge(challenge.id);
              const completed = isCompleted(challenge.id);
              const progressPercentage = getProgressPercentage(challenge);

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className={`relative ${completed ? 'border-green-500 bg-green-50' : 'hover:shadow-lg'} transition-all`}>
                    {completed && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {getChallengeIcon(challenge.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{challenge.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{getChallengeTypeLabel(challenge.type)}</Badge>
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                              {challenge.points_reward} pts
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription>{challenge.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progreso:</span>
                          <span className="font-medium">
                            {progress?.current_count || 0} / {challenge.target_count}
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        {completed ? (
                          <Button variant="outline" disabled className="w-full">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completado
                          </Button>
                        ) : (
                          <div className="text-sm text-gray-600">
                            {progressPercentage > 0 ? 
                              `¡Vas por buen camino! ${Math.round(progressPercentage)}% completado` :
                              'Comienza este reto completando las actividades relacionadas'
                            }
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Retos;
