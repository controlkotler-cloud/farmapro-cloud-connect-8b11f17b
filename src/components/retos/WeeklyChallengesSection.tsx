
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WeeklyChallenge } from '@/hooks/useWeeklyChallenges';

interface WeeklyChallengesSectionProps {
  challenges: WeeklyChallenge[];
  loading: boolean;
}

const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const end = new Date(endDate + 'T23:59:59');
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) { setTimeLeft('Expirado'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${d > 0 ? d + 'd ' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return <span>{timeLeft}</span>;
};

export const WeeklyChallengesSection = ({ challenges, loading }: WeeklyChallengesSectionProps) => {
  if (loading) {
    return <div className="animate-pulse bg-muted h-48 rounded-xl" />;
  }

  if (challenges.length === 0) return null;

  const endDate = challenges[0]?.week_end;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-miel/30 bg-miel-soft overflow-hidden">
        <div className="bg-miel px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="h-6 w-6 text-foreground" />
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">Retos de la Semana</h2>
          </div>
          {endDate && (
            <div className="flex items-center gap-2 text-foreground/80 text-sm font-bold">
              <Clock className="h-4 w-4" />
              <span>Quedan </span>
              <CountdownTimer endDate={endDate} />
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge) => {
              const completed = !!challenge.completed_at;
              const target = challenge.target_count || 1;
              const pct = Math.min((challenge.current_count / target) * 100, 100);
              return (
                <Card key={challenge.id} className={`relative transition-all ${completed ? 'border-success bg-success/10' : 'hover:shadow-lift'}`}>
                  {completed && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{challenge.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{challenge.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-full bg-miel-soft px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-miel hover:bg-miel-soft">
                        Semanal
                      </Badge>
                      <Badge variant="outline" className="text-xs">{challenge.points_reward} pts</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{challenge.current_count}/{target}</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full border border-border bg-secondary">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-miel to-brand"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                    {completed && (
                      <Badge className="w-full justify-center gap-1.5 bg-success/15 text-success hover:bg-success/15">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Completado
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
