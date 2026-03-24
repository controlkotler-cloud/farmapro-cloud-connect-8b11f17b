import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';
import { getLevelInfo, getNextLevelInfo, getNextLevelProgress, getPointsToNextLevel } from '@/services/pointsService';

interface WelcomeCardProps {
  userName: string;
  level: number;
  totalPoints: number;
  getNextLevelProgress: () => number;
  getPointsToNextLevel: () => number;
}

export const WelcomeCard = ({ 
  userName, 
  totalPoints, 
}: WelcomeCardProps) => {
  const currentLevel = getLevelInfo(totalPoints);
  const nextLevel = getNextLevelInfo(totalPoints);
  const progress = getNextLevelProgress(totalPoints);
  const pointsNeeded = getPointsToNextLevel(totalPoints);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl text-white font-bold">
            ¡Bienvenido de nuevo, {userName}!
          </CardTitle>
          <CardDescription className="text-white/90 text-base">
            Continúa el desarrollo de tu perfil profesional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentLevel.icon}</span>
              <div>
                <span className="text-lg font-bold text-white">{currentLevel.name}</span>
                <p className="text-xs text-white/70">Nivel {currentLevel.level}</p>
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between text-sm mb-1 text-white">
                <span>{totalPoints} puntos</span>
                {nextLevel ? (
                  <span>Próximo: {nextLevel.icon} {nextLevel.name} (faltan {pointsNeeded})</span>
                ) : (
                  <span>¡Nivel máximo alcanzado!</span>
                )}
              </div>
              <Progress value={progress} className="h-2 bg-white/20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
