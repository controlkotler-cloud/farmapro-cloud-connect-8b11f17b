
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
      <Card className="bg-miel-soft border-miel/20">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-miel-soft rounded-lg">
              <Trophy className="h-8 w-8 text-miel" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Puntos Totales</p>
              <p className="text-2xl font-bold text-foreground">{userStats.totalPoints}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-brand-soft border-brand/20">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-brand-soft rounded-lg">
              <Star className="h-8 w-8 text-brand-dark" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Nivel Actual</p>
              <p className="text-2xl font-bold text-foreground">{userStats.level}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-success/10 border-success/20">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-success/10 rounded-lg">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Retos Completados</p>
              <p className="text-2xl font-bold text-foreground">{userStats.completedChallenges}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-terracota-soft border-terracota/20">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-terracota-soft rounded-lg">
              <Flame className="h-8 w-8 text-terracota" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Flame className="h-4 w-4" /> Racha</p>
              <p className="text-2xl font-bold text-foreground">{userStats.streakDays} días</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
