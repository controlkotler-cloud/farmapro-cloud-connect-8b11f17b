
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  CheckCircle, 
  Award,
  TrendingUp,
  Users,
  Star
} from 'lucide-react';

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
    type: string;
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

interface ChallengeStatsProps {
  stats: ChallengeStats;
  challenges: Challenge[];
  challengeProgress: ChallengeProgress[];
}

export const ChallengeStats = ({ stats, challenges, challengeProgress }: ChallengeStatsProps) => {
  // Calculate completion rates by challenge type
  const challengeTypeStats = challenges.reduce((acc, challenge) => {
    const progressForChallenge = challengeProgress.filter(p => p.challenge_id === challenge.id);
    const completions = progressForChallenge.filter(p => p.completed_at).length;
    const attempts = progressForChallenge.length;
    
    if (!acc[challenge.type]) {
      acc[challenge.type] = {
        name: challenge.type,
        attempts: 0,
        completions: 0,
        completionRate: 0
      };
    }
    
    acc[challenge.type].attempts += attempts;
    acc[challenge.type].completions += completions;
    acc[challenge.type].completionRate = attempts > 0 ? (completions / attempts) * 100 : 0;
    
    return acc;
  }, {} as Record<string, { name: string; attempts: number; completions: number; completionRate: number }>);

  const typeStatsArray = Object.values(challengeTypeStats);

  // Recent completions
  const recentCompletions = challengeProgress
    .filter(p => p.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, 5);

  const getChallengeTypeLabel = (type: string) => {
    switch (type) {
      case 'course_completed':
        return 'Cursos Completados';
      case 'course_started':
        return 'Cursos Iniciados';
      case 'forum_post':
        return 'Posts en Foro';
      case 'forum_reply':
        return 'Respuestas en Foro';
      case 'resource_downloaded':
        return 'Recursos Descargados';
      default:
        return type;
    }
  };

  const getChallengeTypeEmoji = (type: string) => {
    switch (type) {
      case 'course_completed':
      case 'course_started':
        return '📚';
      case 'forum_post':
      case 'forum_reply':
        return '💬';
      case 'resource_downloaded':
        return '📁';
      default:
        return '🏆';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Retos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChallenges}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeChallenges} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompletions}</div>
            <p className="text-xs text-muted-foreground">Retos completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos Otorgados</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPointsAwarded.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Puntos totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {challengeProgress.length > 0 
                ? Math.round((stats.totalCompletions / challengeProgress.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Completación</p>
          </CardContent>
        </Card>
      </div>

      {/* Challenge Type Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Rendimiento por Tipo de Reto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {typeStatsArray.map((typeStat) => (
              <div key={typeStat.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getChallengeTypeEmoji(typeStat.name)}</span>
                    <span className="font-medium">{getChallengeTypeLabel(typeStat.name)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {typeStat.completions}/{typeStat.attempts} ({Math.round(typeStat.completionRate)}%)
                  </div>
                </div>
                <Progress value={typeStat.completionRate} className="h-2" />
              </div>
            ))}
            {typeStatsArray.length === 0 && (
              <p className="text-center text-gray-500 py-4">No hay datos de rendimiento disponibles</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Completions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Completaciones Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCompletions.map((completion) => (
              <div key={completion.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{completion.profiles?.full_name || 'Usuario desconocido'}</p>
                  <p className="text-sm text-gray-600">{completion.challenges?.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(completion.completed_at!).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                  +{completion.points_earned} pts
                </Badge>
              </div>
            ))}
            {recentCompletions.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay completaciones recientes</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
