
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Medal, Award } from 'lucide-react';
import { getLevelInfo } from '@/services/pointsService';

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
};

export const LeaderboardSection = () => {
  const { entries, currentUserRank, loading, timeFilter, setTimeFilter } = useLeaderboard();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Ranking
          </CardTitle>
          <div className="flex gap-2">
            {(['this_week', 'this_month', 'all_time'] as const).map(filter => (
              <Badge
                key={filter}
                variant={timeFilter === filter ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTimeFilter(filter)}
              >
                {filter === 'this_week' ? 'Esta semana' : filter === 'this_month' ? 'Este mes' : 'Todos los tiempos'}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-muted h-12 rounded-lg" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Aún no hay datos de ranking.</p>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  entry.isCurrentUser ? 'bg-green-50 ring-1 ring-green-200' : 'hover:bg-muted/50'
                }`}
              >
                <div className="w-8 flex justify-center">
                  <RankIcon rank={entry.rank} />
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{entry.first_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {entry.first_name}
                    {entry.isCurrentUser && <span className="text-green-600 ml-1">(tú)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">Nivel {entry.level}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{entry.total_points} pts</p>
                  <p className="text-xs text-muted-foreground">{entry.badge_count} 🏅</p>
                </div>
              </div>
            ))}

            {currentUserRank && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 ring-1 ring-green-200">
                  <div className="w-8 flex justify-center">
                    <span className="text-sm font-bold text-muted-foreground">#{currentUserRank.rank}</span>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUserRank.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{currentUserRank.first_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {currentUserRank.first_name} <span className="text-green-600">(tú)</span>
                    </p>
                  </div>
                  <p className="font-bold text-sm">{currentUserRank.total_points} pts</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
