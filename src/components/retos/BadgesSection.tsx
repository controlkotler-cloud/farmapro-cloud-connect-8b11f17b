import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBadges, BadgeWithStatus } from '@/hooks/useBadges';
import { BadgeMedal } from '@/components/retos/BadgeMedal';
import { Award } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'formacion', label: 'Formación' },
  { value: 'comunidad', label: 'Comunidad' },
  { value: 'constancia', label: 'Constancia' },
  { value: 'especial', label: 'Especial' },
];


const BadgeCard = ({ badge }: { badge: BadgeWithStatus }) => {
  const earnedStyle =
    '0 2px 8px rgba(0,0,0,.04), 0 0 0 1.5px hsl(var(--brand)), 0 10px 30px -10px rgba(136,200,53,.55)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`relative overflow-hidden rounded-[0.625rem] transition-all ${
          badge.earned ? 'ring-1 ring-brand' : ''
        }`}
        style={badge.earned ? { boxShadow: earnedStyle } : undefined}
      >
        <CardContent className="p-4 text-center space-y-3">
          <div className="flex justify-center">
            <BadgeMedal icon={badge.icon} category={badge.category} earned={badge.earned} />
          </div>
          <p
            className={`text-sm ${
              badge.earned ? 'font-extrabold text-foreground' : 'font-semibold text-muted-foreground'
            }`}
          >
            {badge.name}
          </p>
          {badge.earned ? (
            <p className="text-xs text-muted-foreground">
              Conseguida el {new Date(badge.earned_at!).toLocaleDateString('es-ES')}
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{badge.description}</p>
              <div className="h-1.5 overflow-hidden rounded-full border border-border bg-secondary">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.max(badge.progress, 4)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {badge.currentValue}/{badge.requirement_value}
              </p>
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
          <div className="rounded-lg bg-miel-soft p-2">
            <Award className="h-6 w-6 text-miel" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Mis insignias</h2>
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
            <div key={i} className="animate-pulse bg-muted h-36 rounded-lg" />
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
