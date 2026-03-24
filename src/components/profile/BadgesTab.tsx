import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBadges, BadgeWithStatus } from '@/hooks/useBadges';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Award, Target, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'formacion', label: 'Formación' },
  { value: 'comunidad', label: 'Comunidad' },
  { value: 'constancia', label: 'Constancia' },
  { value: 'especial', label: 'Especial' },
];

const ProfileBadgeCard = ({ badge }: { badge: BadgeWithStatus }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    <Card className={`transition-all ${
      badge.earned
        ? 'ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-md'
        : 'opacity-50 grayscale-[40%]'
    }`}>
      <CardContent className="p-4 text-center space-y-2">
        <div className={`text-3xl ${badge.earned ? '' : 'opacity-40'}`}>{badge.icon}</div>
        <p className="font-semibold text-sm">{badge.name}</p>
        {badge.earned ? (
          <p className="text-xs text-muted-foreground">
            Obtenido el {new Date(badge.earned_at!).toLocaleDateString('es-ES')}
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{badge.description}</p>
            {badge.requirement_type !== 'manual' && (
              <>
                <Progress value={badge.progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{badge.currentValue}/{badge.requirement_value}</p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

interface CompletedChallenge {
  id: string;
  completed_at: string;
  points_earned: number;
  challenge: {
    title: string;
    description: string | null;
  } | null;
}

const ChallengeHistory = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<CompletedChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from('user_challenge_progress')
        .select('id, completed_at, points_earned, challenge:challenges(title, description)')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(20);
      setChallenges((data as any) || []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-xl" />;
  if (challenges.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Historial de Retos Completados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {challenges.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.challenge?.title || 'Reto'}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.completed_at).toLocaleDateString('es-ES')}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">+{c.points_earned} pts</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const BadgesTab = () => {
  const { badges, loading, categoryFilter, setCategoryFilter, earnedCount, totalCount } = useBadges();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Mis Insignias
              <span className="text-sm font-normal text-muted-foreground">
                ({earnedCount} de {totalCount})
              </span>
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <Badge
                  key={cat.value}
                  variant={categoryFilter === cat.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setCategoryFilter(cat.value)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-muted h-32 rounded-xl" />
              ))}
            </div>
          ) : badges.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay insignias en esta categoría</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map(badge => (
                <ProfileBadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ChallengeHistory />
    </div>
  );
};
