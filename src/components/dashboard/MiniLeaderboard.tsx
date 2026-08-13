import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { calculateStreak } from '@/utils/streakUtils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Medal, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Participantes reales mínimos (sin perfiles de siembra ni quienes se han dado
 * de baja del ranking) para enseñar la clasificación en el inicio. Por debajo
 * de esta cifra el ranking delata que el portal está vacío, así que en su
 * lugar se muestra el progreso personal de la semana.
 * Ajusta este número aquí y en ningún sitio más.
 */
const MIN_PARTICIPANTES_RANKING = 20;

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="h-4 w-4 text-miel" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-foreground" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-muted-foreground" />;
  return <span className="text-xs font-bold text-muted-foreground">{rank}</span>;
};

// Lunes de la semana en curso (semana natural española: de lunes a domingo).
const startOfWeek = () => {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

interface WeekProgress {
  weeklyPoints: number | null;
  activeChallenges: number | null;
  streak: number | null;
}

const useWeekProgress = (enabled: boolean) => {
  const { profile } = useAuth();
  const [data, setData] = useState<WeekProgress>({
    weeklyPoints: null,
    activeChallenges: null,
    streak: null,
  });

  useEffect(() => {
    if (!enabled || !profile?.id) return;
    let cancelled = false;

    (async () => {
      const since = startOfWeek().toISOString();
      const [completedRes, inProgressRes, streak] = await Promise.all([
        supabase
          .from('user_challenge_progress')
          .select('points_earned')
          .eq('user_id', profile.id)
          .gte('completed_at', since),
        supabase
          .from('user_challenge_progress')
          .select('id')
          .eq('user_id', profile.id)
          .is('completed_at', null)
          .gt('current_count', 0),
        calculateStreak(profile.id).catch(() => null),
      ]);

      if (cancelled) return;
      setData({
        weeklyPoints: completedRes.data
          ? completedRes.data.reduce((acc, r) => acc + (r.points_earned ?? 0), 0)
          : null,
        activeChallenges: inProgressRes.data ? inProgressRes.data.length : null,
        streak,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, profile?.id]);

  return data;
};

export const MiniLeaderboard = () => {
  const { entries, currentUserRank, loading } = useLeaderboard();
  const navigate = useNavigate();

  const hayRankingSuficiente = entries.length >= MIN_PARTICIPANTES_RANKING;
  const week = useWeekProgress(!loading && !hayRankingSuficiente);

  if (loading) return null;

  const top5 = entries.slice(0, 5);

  const wrapper = (children: React.ReactNode) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      {children}
    </motion.div>
  );

  if (!hayRankingSuficiente) {
    const filas = [
      week.weeklyPoints !== null
        ? { label: 'Puntos ganados esta semana', value: `${week.weeklyPoints}` }
        : null,
      week.activeChallenges !== null
        ? { label: 'Retos en marcha', value: `${week.activeChallenges}` }
        : null,
      week.streak !== null
        ? {
            label: 'Racha actual',
            value: `${week.streak} ${week.streak === 1 ? 'día' : 'días'}`,
          }
        : null,
    ].filter(Boolean) as { label: string; value: string }[];

    return wrapper(
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-brand-dark" />
            Tu progreso esta semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Empieza un reto o un curso y aquí verás tu avance de la semana.
            </p>
          ) : (
            <div className="space-y-2">
              {filas.map(fila => (
                <div
                  key={fila.label}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{fila.label}</span>
                  <span className="font-extrabold text-foreground">{fila.value}</span>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="link"
            className="mt-2 h-auto p-0 text-sm"
            onClick={() => navigate('/retos')}
          >
            Ver los retos
          </Button>
        </CardContent>
      </Card>,
    );
  }

  return wrapper(
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown className="h-5 w-5 text-miel" />
          Top 5 Ranking
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>,
  );
};
