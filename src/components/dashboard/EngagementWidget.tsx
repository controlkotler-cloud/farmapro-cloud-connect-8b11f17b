
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { calculateStreak } from '@/utils/streakUtils';
import { Link } from 'react-router-dom';
import { Flame, Star, Target, BookOpen, Trophy } from 'lucide-react';

interface EngagementItem {
  icon: React.ReactNode;
  text: string;
  link: string;
}

export const EngagementWidget = () => {
  const { profile } = useAuth();
  const [items, setItems] = useState<EngagementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) loadEngagement();
  }, [profile?.id]);

  const loadEngagement = async () => {
    if (!profile?.id) return;
    const result: EngagementItem[] = [];

    try {
      // Streak
      const streak = await calculateStreak(profile.id);
      if (streak > 0) {
        result.push({
          icon: <Flame className="h-4 w-4 text-orange-500" />,
          text: `🔥 Racha actual: ${streak} días — ¡No la pierdas!`,
          link: '/retos',
        });
      }

      // Leaderboard position
      const { data: allPoints } = await supabase
        .from('user_points')
        .select('user_id, total_points')
        .order('total_points', { ascending: false });
      
      if (allPoints) {
        const pos = allPoints.findIndex(p => p.user_id === profile.id) + 1;
        if (pos > 0) {
          result.push({
            icon: <Star className="h-4 w-4 text-yellow-500" />,
            text: `⭐ Estás en el puesto #${pos} del ranking`,
            link: '/retos',
          });
        }
      }

      // Weekly challenge closest to complete
      const today = new Date().toISOString().split('T')[0];
      const { data: weeklyChallenges } = await supabase
        .from('challenges')
        .select('id, name, target_count')
        .eq('is_active', true)
        .filter('is_weekly', 'eq', true)
        .filter('week_start', 'lte', today)
        .filter('week_end', 'gte', today) as any;

      if (weeklyChallenges && weeklyChallenges.length > 0) {
        const challengeIds = weeklyChallenges.map((wc: any) => wc.id);
        const { data: progress } = await supabase
          .from('user_challenge_progress')
          .select('challenge_id, current_count, completed_at')
          .eq('user_id', profile.id)
          .in('challenge_id', challengeIds);

        const progressMap = new Map((progress || []).map(p => [p.challenge_id, p]));
        
        for (const wc of weeklyChallenges as any[]) {
          const p = progressMap.get(wc.id);
          if (!p?.completed_at) {
            const remaining = (wc.target_count || 1) - (p?.current_count || 0);
            if (remaining > 0) {
              result.push({
                icon: <Target className="h-4 w-4 text-primary" />,
                text: `🎯 Te faltan ${remaining} para completar '${wc.name}'`,
                link: '/retos',
              });
              break;
            }
          }
        }
      }

      // Course in progress
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('courses(title)')
        .eq('user_id', profile.id)
        .is('completed_at', null)
        .limit(1);

      if (enrollments && enrollments.length > 0 && enrollments[0].courses) {
        result.push({
          icon: <BookOpen className="h-4 w-4 text-primary" />,
          text: `📚 Tienes 1 curso en progreso — retómalo`,
          link: '/formacion',
        });
      }

      // Next badge
      const { data: allBadges } = await supabase
        .from('badges')
        .select('id, name')
        .eq('is_active', true);

      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', profile.id);

      if (allBadges && userBadges) {
        const earnedIds = new Set(userBadges.map(b => b.badge_id));
        const next = allBadges.find(b => !earnedIds.has(b.id));
        if (next) {
          result.push({
            icon: <Trophy className="h-4 w-4 text-primary" />,
            text: `🏆 Próximo badge: '${next.name}'`,
            link: '/retos',
          });
        }
      }
    } catch (error) {
      console.error('Error loading engagement:', error);
    }

    setItems(result.slice(0, 5));
    setLoading(false);
  };

  if (loading || items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tu actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((item, i) => (
              <Link
                key={i}
                to={item.link}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-sm"
              >
                {item.icon}
                <span>{item.text}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
