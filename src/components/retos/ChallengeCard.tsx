
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Star, CheckCircle, Gift } from 'lucide-react';
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

interface ChallengeCardProps {
  challenge: Challenge;
  progress: UserProgress | undefined;
  index: number;
}

export const ChallengeCard = ({ challenge, progress, index }: ChallengeCardProps) => {
  const completed = progress?.completed_at !== null;
  const progressPercentage = progress ? Math.min((progress.current_count / challenge.target_count) * 100, 100) : 0;
  const hasProgress = progress && progress.current_count > 0;

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

  return (
    <motion.div
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
                {hasProgress ? 
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
};
