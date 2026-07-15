import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateStreak } from '@/utils/streakUtils';

export interface HighlightCourse {
  title: string;
  slug: string;
  /** 0-100 si hay matrícula en curso; null si es sugerencia nueva */
  progress: number | null;
}

export interface HighlightChallenge {
  name: string;
  currentCount: number;
  targetCount: number;
  pointsReward: number;
}

export interface HighlightThread {
  id: string;
  title: string;
  repliesCount: number;
}

export interface HighlightResource {
  id: string;
  title: string;
  format: string | null;
}

export interface HighlightEvent {
  title: string;
  startDate: string;
  isOnline: boolean;
  location: string | null;
}

export interface DashboardHighlights {
  course: HighlightCourse | null;
  challenge: HighlightChallenge | null;
  threads: HighlightThread[];
  resources: HighlightResource[];
  nextEvent: HighlightEvent | null;
  streak: number;
  loading: boolean;
}

/**
 * Datos reales para las tarjetas del dashboard: curso en marcha (o el más
 * reciente si no hay ninguno), reto activo con progreso del usuario, foro
 * vivo, recursos nuevos, próximo evento y racha de días.
 */
export const useDashboardHighlights = (): DashboardHighlights => {
  const { user } = useAuth();
  const [data, setData] = useState<Omit<DashboardHighlights, 'loading'>>({
    course: null,
    challenge: null,
    threads: [],
    resources: [],
    nextEvent: null,
    streak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const [enrollmentRes, threadsRes, resourcesRes, eventRes, challengesRes, streakCount] =
        await Promise.all([
          supabase
            .from('course_enrollments')
            .select('progress, courses(title, slug)')
            .eq('user_id', user.id)
            .eq('is_completed', false)
            .order('enrolled_at', { ascending: false })
            .limit(1),
          supabase
            .from('forum_threads')
            .select('id, title, replies_count')
            .order('last_reply_at', { ascending: false, nullsFirst: false })
            .limit(3),
          supabase
            .from('resources')
            .select('id, title, format')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('events')
            .select('title, start_date, is_online, location')
            .eq('is_published', true)
            .gte('start_date', new Date().toISOString())
            .order('start_date', { ascending: true })
            .limit(1),
          supabase
            .from('challenges')
            .select('id, name, title, points_reward, points, target_count')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(5),
          calculateStreak(user.id).catch(() => 0),
        ]);

      // Curso: matrícula en marcha o, si no hay, el curso publicado más reciente
      let course: HighlightCourse | null = null;
      const enrollment = enrollmentRes.data?.[0] as
        | { progress: number; courses: { title: string; slug: string } | null }
        | undefined;
      if (enrollment?.courses) {
        course = {
          title: enrollment.courses.title,
          slug: enrollment.courses.slug,
          progress: enrollment.progress ?? 0,
        };
      } else {
        const { data: newest } = await supabase
          .from('courses')
          .select('title, slug')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(1);
        if (newest?.[0]) {
          course = { title: newest[0].title, slug: newest[0].slug, progress: null };
        }
      }

      // Reto: el primer activo sin completar por el usuario (con su progreso)
      let challenge: HighlightChallenge | null = null;
      const activeChallenges = challengesRes.data ?? [];
      if (activeChallenges.length > 0) {
        const { data: progressRows } = await supabase
          .from('user_challenge_progress')
          .select('challenge_id, current_count, completed_at')
          .eq('user_id', user.id)
          .in('challenge_id', activeChallenges.map((c) => c.id));
        const progressById = new Map(
          (progressRows ?? []).map((p) => [p.challenge_id, p]),
        );
        const pending =
          activeChallenges.find((c) => !progressById.get(c.id)?.completed_at) ??
          activeChallenges[0];
        challenge = {
          name: pending.name || pending.title,
          currentCount: progressById.get(pending.id)?.current_count ?? 0,
          targetCount: pending.target_count ?? 1,
          pointsReward: pending.points_reward ?? pending.points ?? 0,
        };
      }

      if (cancelled) return;
      setData({
        course,
        challenge,
        threads: (threadsRes.data ?? []).map((t) => ({
          id: t.id,
          title: t.title,
          repliesCount: t.replies_count ?? 0,
        })),
        resources: (resourcesRes.data ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          format: r.format,
        })),
        nextEvent: eventRes.data?.[0]
          ? {
              title: eventRes.data[0].title,
              startDate: eventRes.data[0].start_date,
              isOnline: eventRes.data[0].is_online,
              location: eventRes.data[0].location,
            }
          : null,
        streak: streakCount,
      });
      setLoading(false);
    };

    load().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { ...data, loading };
};
