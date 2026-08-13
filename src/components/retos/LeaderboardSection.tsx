
import { useLeaderboard, type LeaderboardEntry } from '@/hooks/useLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Medal, Award } from 'lucide-react';
import { getLevelInfo } from '@/services/pointsService';
import { LevelIcon } from '@/components/gamification/LevelIcon';

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-miel" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-foreground" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-muted-foreground" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
};

interface LeaderboardSectionProps {
  entries?: LeaderboardEntry[];
  currentUserRank?: LeaderboardEntry | null;
  loading?: boolean;
}

export const LeaderboardSection = (props: LeaderboardSectionProps) => {
  // Si la página ya ha consultado el ranking, reutilizamos sus datos por props
  // y evitamos repetir la consulta; si no, el componente sigue siendo autónomo.
  const hook = useLeaderboard({ enabled: props.entries === undefined });
  const entries = props.entries ?? hook.entries;
  const currentUserRank = props.currentUserRank !== undefined ? props.currentUserRank : hook.currentUserRank;
  const loading = props.loading !== undefined ? props.loading : hook.loading;



  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Ranking
        </CardTitle>
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
                  entry.isCurrentUser ? 'bg-miel-soft ring-1 ring-miel/30' : 'hover:bg-muted/50'
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
                    {entry.isCurrentUser && <span className="text-miel ml-1">(tú)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <LevelIcon totalPoints={entry.total_points} className="h-3.5 w-3.5 text-miel" />
                    {getLevelInfo(entry.total_points).name}
                  </p>

                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{entry.total_points} pts</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">{entry.badge_count} <Medal className="h-3 w-3" /></p>
                </div>
              </div>
            ))}

            {currentUserRank && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-miel-soft ring-1 ring-miel/30">
                  <div className="w-8 flex justify-center">
                    <span className="text-sm font-bold text-muted-foreground">#{currentUserRank.rank}</span>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUserRank.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{currentUserRank.first_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {currentUserRank.first_name} <span className="text-miel">(tú)</span>
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
