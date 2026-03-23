
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useBadges, BadgeWithStatus } from '@/hooks/useBadges';
import { Award } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'formacion', label: 'Formación' },
  { value: 'comunidad', label: 'Comunidad' },
  { value: 'constancia', label: 'Constancia' },
  { value: 'especial', label: 'Especial' },
];

const BadgeCard = ({ badge }: { badge: BadgeWithStatus }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative overflow-hidden transition-all ${
        badge.earned
          ? 'ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-lg'
          : 'opacity-60 grayscale-[30%]'
      }`}>
        <CardContent className="p-4 text-center space-y-2">
          <div className={`text-4xl ${badge.earned ? '' : 'opacity-40'}`}>
            {badge.icon}
          </div>
          <p className="font-semibold text-sm">{badge.name}</p>
          {badge.earned ? (
            <p className="text-xs text-muted-foreground">
              {new Date(badge.earned_at!).toLocaleDateString('es-ES')}
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{badge.description}</p>
              {badge.requirement_type !== 'manual' && (
                <>
                  <Progress value={badge.progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {badge.currentValue}/{badge.requirement_value}
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const BadgesSection = () => {
  const { badges, loading, categoryFilter, setCategoryFilter, earnedCount, totalCount } = useBadges();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 shadow-lg">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Mis Insignias</h2>
            <p className="text-sm text-muted-foreground">{earnedCount} de {totalCount} desbloqueadas</p>
          </div>
        </div>
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

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map(badge => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      )}
    </div>
  );
};
