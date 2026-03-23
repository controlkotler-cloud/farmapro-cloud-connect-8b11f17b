
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Star, CheckCircle, Flame } from 'lucide-react';

interface UserStatsCardsProps {
  userStats: {
    totalPoints: number;
    level: number;
    completedChallenges: number;
    streakDays: number;
  };
}

export const UserStatsCards = ({ userStats }: UserStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-700">Puntos Totales</p>
              <p className="text-2xl font-bold text-yellow-900">{userStats.totalPoints}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Star className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-700">Nivel Actual</p>
              <p className="text-2xl font-bold text-blue-900">{userStats.level}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-700">Retos Completados</p>
              <p className="text-2xl font-bold text-green-900">{userStats.completedChallenges}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Flame className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-700">🔥 Racha</p>
              <p className="text-2xl font-bold text-orange-900">{userStats.streakDays} días</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
