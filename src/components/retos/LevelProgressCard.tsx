
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';

interface LevelProgressCardProps {
  userStats: {
    totalPoints: number;
    level: number;
  };
}

export const LevelProgressCard = ({ userStats }: LevelProgressCardProps) => {
  // Calcular progreso al siguiente nivel
  const getNextLevelProgress = () => {
    const pointsInCurrentLevel = userStats.totalPoints % 1000;
    return (pointsInCurrentLevel / 1000) * 100;
  };

  const getPointsToNextLevel = () => {
    const pointsInCurrentLevel = userStats.totalPoints % 1000;
    return 1000 - pointsInCurrentLevel;
  };

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-lg mr-4">
              <TrendingUp className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-indigo-900">Progreso de Nivel</h3>
              <p className="text-indigo-700">Nivel {userStats.level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-indigo-600">Faltan {getPointsToNextLevel()} puntos</p>
            <p className="text-lg font-bold text-indigo-900">para Nivel {userStats.level + 1}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-indigo-700">
            <span>Nivel {userStats.level}</span>
            <span>Nivel {userStats.level + 1}</span>
          </div>
          <Progress value={getNextLevelProgress()} className="h-3" />
          <div className="flex justify-between text-xs text-indigo-600">
            <span>{userStats.totalPoints} pts actuales</span>
            <span>{userStats.level * 1000} pts objetivo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
