
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Star, CheckCircle, Gift, MessageSquare, Users, BookOpen } from 'lucide-react';
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
  // Un reto está completado SOLO si tiene un completed_at no nulo
  const completed = progress?.completed_at !== null && progress?.completed_at !== undefined;
  const currentCount = progress?.current_count || 0;
  const progressPercentage = Math.min((currentCount / challenge.target_count) * 100, 100);
  const hasProgress = currentCount > 0;

  console.log('Challenge progress debug:', {
    challengeName: challenge.name,
    currentCount,
    targetCount: challenge.target_count,
    completedAt: progress?.completed_at,
    completed,
    progressPercentage
  });

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'course_completed':
      case 'course_started':
        return <BookOpen className="h-6 w-6" />;
      case 'forum_post':
      case 'forum_reply':
        return <MessageSquare className="h-6 w-6" />;
      case 'resource_downloaded':
        return <Gift className="h-6 w-6" />;
      case 'community_engagement':
        return <Users className="h-6 w-6" />;
      default:
        return <Trophy className="h-6 w-6" />;
    }
  };

  const getChallengeTypeLabel = (type: string) => {
    switch (type) {
      case 'course_completed':
      case 'course_started':
        return 'Formación';
      case 'forum_post':
      case 'forum_reply':
        return 'Comunidad';
      case 'resource_downloaded':
        return 'Recursos';
      case 'community_engagement':
        return 'Participación';
      default:
        return 'General';
    }
  };

  const getChallengeEmoji = (type: string) => {
    switch (type) {
      case 'course_completed':
      case 'course_started':
        return '📚';
      case 'forum_post':
      case 'forum_reply':
        return '💬';
      case 'resource_downloaded':
        return '📁';
      case 'community_engagement':
        return '👥';
      default:
        return '🏆';
    }
  };

  const getProgressMessage = () => {
    if (completed) return '¡Reto completado! 🎉';
    if (!hasProgress) return 'Comienza este reto participando en las actividades relacionadas';
    
    const remaining = challenge.target_count - currentCount;
    switch (challenge.type) {
      case 'forum_post':
        return `Te faltan ${remaining} hilos por crear`;
      case 'forum_reply':
        return `Te faltan ${remaining} respuestas por escribir`;
      case 'course_completed':
        return `Te faltan ${remaining} cursos por completar`;
      case 'course_started':
        return `Te faltan ${remaining} cursos por iniciar`;
      case 'resource_downloaded':
        return `Te faltan ${remaining} recursos por descargar`;
      default:
        return `Progreso: ${Math.round(progressPercentage)}% completado`;
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
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>{getChallengeEmoji(challenge.type)}</span>
                <span>{challenge.name}</span>
              </CardTitle>
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
                {currentCount} / {challenge.target_count}
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
                {getProgressMessage()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
