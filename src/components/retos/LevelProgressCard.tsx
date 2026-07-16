import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="bg-gradient-to-br from-miel-soft to-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 bg-card rounded-lg mr-4">
              <TrendingUp className="h-8 w-8 text-miel" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Progreso de Nivel</h3>
              <p className="text-muted-foreground">Nivel {current.level} · {current.name}</p>
            </div>
          </div>
          <div className="text-right">
            {next ? (
              <>
                <p className="text-sm text-muted-foreground">Faltan {toNext} puntos</p>
                <p className="text-lg font-bold text-foreground">para Nivel {next.level}</p>
              </>
            ) : (
              <p className="text-lg font-bold text-foreground">¡Nivel máximo!</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Nivel {current.level}</span>
            <span>{next ? `Nivel ${next.level}` : '—'}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full border border-border bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-miel to-brand"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{points} pts actuales</span>
            <span>{next ? `${next.minPoints} pts objetivo` : 'Máximo'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
