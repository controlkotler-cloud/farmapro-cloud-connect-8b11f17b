import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBadges, BadgeWithStatus } from '@/hooks/useBadges';
import { Progress } from '@/components/ui/progress';
import { Award } from 'lucide-react';
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

export const BadgesTab = () => {
  const { badges, loading, categoryFilter, setCategoryFilter, earnedCount, totalCount } = useBadges();

  return (
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
  );
};
