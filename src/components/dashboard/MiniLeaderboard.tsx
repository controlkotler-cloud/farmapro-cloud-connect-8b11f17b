import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Medal } from 'lucide-react';
import { getLevelInfo } from '@/services/pointsService';
import { motion } from 'framer-motion';

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
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
            <Crown className="h-5 w-5 text-yellow-500" />
            Top 5 Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {top5.map(entry => {
              const level = getLevelInfo(entry.total_points);
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                    entry.isCurrentUser ? 'bg-green-50 ring-1 ring-green-200' : ''
                  }`}
                >
                  <div className="w-6 flex justify-center"><RankIcon rank={entry.rank} /></div>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{entry.first_name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate font-medium">
                    {entry.first_name}
                    {entry.isCurrentUser && <span className="text-green-600 ml-1">(tú)</span>}
                  </span>
                  <span className="text-xs">{level.icon}</span>
                  <span className="font-bold text-xs">{entry.total_points}</span>
                </div>
              );
            })}
          </div>

          {currentUserRank && (
            <div className="border-t mt-2 pt-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 ring-1 ring-green-200 text-sm">
                <span className="text-xs font-bold w-6 text-center">#{currentUserRank.rank}</span>
                <span className="flex-1 font-medium">{currentUserRank.first_name} (tú)</span>
                <span className="font-bold text-xs">{currentUserRank.total_points}</span>
              </div>
            </div>
          )}

          <Button variant="link" className="p-0 h-auto text-sm mt-2" onClick={() => navigate('/retos')}>
            Ver ranking completo →
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
