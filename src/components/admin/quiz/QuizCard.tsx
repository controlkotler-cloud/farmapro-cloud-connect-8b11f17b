
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, BarChart3, Clock, Users, Target } from 'lucide-react';
import type { CourseQuiz } from '@/types/quiz';

interface QuizCardProps {
  quiz: CourseQuiz & {
    courses?: {
      title: string;
      slug: string;
    };
  };
  onEdit: (quiz: CourseQuiz) => void;
  onDelete: (quizId: string) => void;
  onViewStats: (quizId: string) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  onEdit,
  onDelete,
  onViewStats
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{quiz.title}</CardTitle>
            <p className="text-sm text-gray-600 mb-2">
              {quiz.courses?.title || 'Curso no encontrado'}
            </p>
            {quiz.description && (
              <p className="text-sm text-gray-500 line-clamp-2">
                {quiz.description}
              </p>
            )}
          </div>
          <Badge variant={quiz.is_active ? "default" : "secondary"}>
            {quiz.is_active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span>{quiz.passing_score}% mínimo</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-green-500" />
            <span>{quiz.max_attempts === -1 ? 'Sin límite' : `${quiz.max_attempts} intentos`}</span>
          </div>
          {quiz.time_limit_minutes && (
            <div className="flex items-center space-x-2 col-span-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>{quiz.time_limit_minutes} minutos</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewStats(quiz.id)}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Stats
          </Button>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(quiz)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(quiz.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
