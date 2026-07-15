import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBadges } from '@/hooks/useBadges';
import { useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const RecentBadges = () => {
  const { recentBadges, earnedCount, loading } = useBadges();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-miel" />
            Insignias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-miel" />
            {earnedCount === 0 ? 'Insignias' : 'Últimas Insignias'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnedCount === 0 ? (
            <div className="text-sm text-muted-foreground">
              <p className="mb-3">
                Aún no has desbloqueado insignias. Completa cursos y retos para conseguir las primeras.
              </p>
              <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate('/formacion')}>
                Empezar un curso
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-4 mb-3">
                {recentBadges.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.15, type: 'spring' }}
                    className="text-center"
                  >
                    <div className="text-3xl mb-1">{badge.icon}</div>
                    <p className="text-xs font-medium">{badge.name}</p>
                  </motion.div>
                ))}
              </div>
              <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate('/retos')}>
                Ver todas mis insignias
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
