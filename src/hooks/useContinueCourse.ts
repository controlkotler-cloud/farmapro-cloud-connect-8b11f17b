import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ContinueCourse {
  title: string;
  slug: string;
  progress: number;
}

/**
 * Curso en marcha del usuario (matrícula sin completar más reciente), para el
 * bloque "Continúa por donde lo dejaste" del catálogo de Formación. A
 * diferencia de useDashboardHighlights, no hace fallback a "curso más
 * reciente" cuando no hay nada en progreso: aquí no mostrar nada es correcto.
 */
export const useContinueCourse = () => {
  const { user } = useAuth();
  const [course, setCourse] = useState<ContinueCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    supabase
      .from('course_enrollments')
      .select('progress, courses(title, slug)')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error loading continue course:', error);
          setCourse(null);
        } else {
          const enrollment = data?.[0] as
            | { progress: number; courses: { title: string; slug: string } | null }
            | undefined;
          setCourse(
            enrollment?.courses
              ? { title: enrollment.courses.title, slug: enrollment.courses.slug, progress: enrollment.progress ?? 0 }
              : null,
          );
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { course, loading };
};
