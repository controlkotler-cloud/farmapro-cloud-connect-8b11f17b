import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="h-4 w-4 text-miel" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-foreground" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-muted-foreground" />;
  return <span className="text-xs font-bold text-muted-foreground">{rank}</span>;
};

export const MiniLeaderboard = () => {
  const { entries, currentUserRank, loading } = useLeaderboard();
  const navigate = useNavigate();

  if (loading) return null;

  const top5 = entries.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5 text-miel" />
            Top 5 Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {top5.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              <p className="mb-3">
                El ranking está a punto de empezar. Completa un curso o un reto y serás de los
                primeros en aparecer.
              </p>
              <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate('/retos')}>
                Ver los retos
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {top5.map(entry => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                      entry.isCurrentUser ? 'bg-miel-soft ring-1 ring-miel/30' : ''
                    }`}
                  >
                    <div className="w-6 flex justify-center"><RankIcon rank={entry.rank} /></div>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{entry.first_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate font-medium">
                      {entry.first_name}
                      {entry.isCurrentUser && <span className="text-miel ml-1">(tú)</span>}
                    </span>
                    <span className="font-bold text-xs">{entry.total_points}</span>
                  </div>
                ))}
              </div>

              {currentUserRank && (
                <div className="border-t mt-2 pt-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-miel-soft ring-1 ring-miel/30 text-sm">
                    <span className="text-xs font-bold w-6 text-center">#{currentUserRank.rank}</span>
                    <span className="flex-1 font-medium">{currentUserRank.first_name} (tú)</span>
                    <span className="font-bold text-xs">{currentUserRank.total_points}</span>
                  </div>
                </div>
              )}

              <Button variant="link" className="p-0 h-auto text-sm mt-2" onClick={() => navigate('/retos')}>
                Ver ranking completo
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
