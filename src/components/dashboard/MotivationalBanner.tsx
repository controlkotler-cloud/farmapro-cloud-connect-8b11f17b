
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { calculateStreak } from '@/utils/streakUtils';

export const MotivationalBanner = () => {
  const { profile } = useAuth();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile?.id) pickMessage();
  }, [profile?.id]);

  const pickMessage = async () => {
    if (!profile?.id) return;
    try {
      const dayOfWeek = new Date().getDay();
      const streak = await calculateStreak(profile.id);

      // Check if completed a challenge today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayCompleted } = await supabase
        .from('user_challenge_progress')
        .select('challenges(name), points_earned')
        .eq('user_id', profile.id)
        .gte('completed_at', todayStart.toISOString())
        .limit(1);

      if (todayCompleted && todayCompleted.length > 0 && todayCompleted[0].challenges) {
        const c = todayCompleted[0];
        setMessage(`🎉 ¡Completaste '${(c.challenges as any).name}' hoy! +${c.points_earned} puntos`);
        return;
      }

      if (dayOfWeek === 1) {
        setMessage('🎯 ¡Nuevos retos semanales disponibles! Échales un vistazo');
        return;
      }

      if (streak > 0) {
        setMessage(`🔥 Llevas ${streak} días consecutivos aprendiendo. ¡Sigue así!`);
        return;
      }

      // Check near badge
      const { data: badges } = await supabase
        .from('badges')
        .select('id, name, requirement_value')
        .eq('is_active', true)
        .limit(5);

      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', profile.id);

      if (badges && userBadges) {
        const earnedIds = new Set(userBadges.map(b => b.badge_id));
        const next = badges.find(b => !earnedIds.has(b.id));
        if (next) {
          setMessage(`⭐ Estás cerca de desbloquear '${next.name}'`);
          return;
        }
      }

      setMessage('👋 ¡Hoy es buen día para aprender algo nuevo!');
    } catch {
      setMessage('👋 ¡Hoy es buen día para aprender algo nuevo!');
    }
  };

  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl px-6 py-4 text-sm font-medium text-foreground"
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
};
