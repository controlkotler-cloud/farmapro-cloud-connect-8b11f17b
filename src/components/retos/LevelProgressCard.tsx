import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';
import {
  getLevelInfo,
  getNextLevelInfo,
  getNextLevelProgress,
  getPointsToNextLevel,
} from '@/services/pointsService';

interface LevelProgressCardProps {
  userStats: {
    totalPoints: number;
    level: number;
  };
}

export const LevelProgressCard = ({ userStats }: LevelProgressCardProps) => {
  // Usar el modelo de niveles canónico (pointsService) para que coincida con el
  // resto de la app (antes este componente calculaba con % 1000, incoherente).
  const points = userStats.totalPoints;
  const current = getLevelInfo(points);
  const next = getNextLevelInfo(points);
  const progress = getNextLevelProgress(points);
  const toNext = getPointsToNextLevel(points);

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
              <p className="text-indigo-700">Nivel {current.level} · {current.name}</p>
            </div>
          </div>
          <div className="text-right">
            {next ? (
              <>
                <p className="text-sm text-indigo-600">Faltan {toNext} puntos</p>
                <p className="text-lg font-bold text-indigo-900">para Nivel {next.level}</p>
              </>
            ) : (
              <p className="text-lg font-bold text-indigo-900">¡Nivel máximo!</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-indigo-700">
            <span>Nivel {current.level}</span>
            <span>{next ? `Nivel ${next.level}` : '—'}</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-indigo-600">
            <span>{points} pts actuales</span>
            <span>{next ? `${next.minPoints} pts objetivo` : 'Máximo'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
