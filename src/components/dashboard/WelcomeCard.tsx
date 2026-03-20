
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';

interface WelcomeCardProps {
  userName: string;
  level: number;
  totalPoints: number;
  getNextLevelProgress: () => number;
  getPointsToNextLevel: () => number;
}

export const WelcomeCard = ({ 
  userName, 
  level, 
  totalPoints, 
  getNextLevelProgress, 
  getPointsToNextLevel 
}: WelcomeCardProps) => {
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
            Continúa el desarrollo de tu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-yellow-300" />
              <span className="text-xl font-bold text-white">Nivel {level}</span>
            </div>
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-sm mb-1 text-white">
                <span>{totalPoints} puntos</span>
                <span>Siguiente nivel: {level * 1000} (faltan {getPointsToNextLevel()})</span>
              </div>
              <Progress value={getNextLevelProgress()} className="h-2 bg-white/20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
