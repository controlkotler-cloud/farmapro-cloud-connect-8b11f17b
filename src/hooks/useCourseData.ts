
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Course, CourseEnrollment, CourseModule } from '@/types/course';

interface UseCourseDataOptions {
  /**
   * Si el usuario abre el curso sin estar inscrito (enlace directo desde el
   * panel, el buscador o "continuar"), se inscribe al vuelo. Sin esto,
   * "Finalizar" y el progreso no escribían nada y fallaban en silencio
   * (fallo visto por Francesc 08-09-2026 con una cuenta free en IAFarma).
   */
  autoEnroll?: boolean;
}

export const useCourseData = (courseSlug?: string, options: UseCourseDataOptions = {}) => {
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasQuiz, setHasQuiz] = useState(false);

  const loadCourseData = async () => {
    if (!courseSlug) return;

    try {
      // Ficha del curso (sin course_modules — la columna está revocada al cliente).
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, slug, title, description, category, difficulty, duration_minutes, duration_hours, thumbnail_url, featured_image_url, is_premium, is_published, is_featured, order_index, students_count, rating, total_lessons, instructor, content, cover_concept, cover_icon, created_at, updated_at')
        .eq('slug', courseSlug)
        .single();

      if (courseError) {
        console.error('Error loading course:', courseError);
        setLoading(false);
        return;
      }

      if (courseData) {
        // Contenido protegido: se solicita por RPC que aplica el gating por plan.
        const { data: modulesData, error: modulesError } = await supabase
          .rpc('get_course_modules', { p_course_id: courseData.id });
        if (modulesError) {
          console.error('Error loading course modules:', modulesError);
        }
        const modules: CourseModule[] = Array.isArray(modulesData)
          ? (modulesData as unknown as CourseModule[])
          : typeof modulesData === 'string'
            ? JSON.parse(modulesData)
            : [];

        const transformedCourse: Course = {
          ...(courseData as any),
          course_modules: modules,
        };
        setCourse(transformedCourse);

        // Verificar si existe un quiz para este curso
        const { data: quizData } = await supabase
          .from('course_quizzes')
          .select('id')
          .eq('course_id', transformedCourse.id)
          .eq('is_active', true)
          .maybeSingle();

        setHasQuiz(!!quizData);

        if (profile?.id) {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from('course_enrollments')
            .select('*')
            .eq('course_id', transformedCourse.id)
            .eq('user_id', profile.id)
            .maybeSingle();

          if (enrollmentError) {
            console.error('Error loading enrollment:', enrollmentError);
          } else if (!enrollmentData && options.autoEnroll) {
            // Inscripción al vuelo. UNIQUE(user_id, course_id) en la tabla:
            // si otra pestaña se adelantó, el upsert no duplica.
            const { error: enrollError } = await supabase
              .from('course_enrollments')
              .upsert(
                { user_id: profile.id, course_id: transformedCourse.id, started_at: new Date().toISOString() },
                { onConflict: 'user_id,course_id', ignoreDuplicates: true },
              );
            if (enrollError) {
              console.error('Error auto-enrolling:', enrollError);
            } else {
              const { data: created } = await supabase
                .from('course_enrollments')
                .select('*')
                .eq('course_id', transformedCourse.id)
                .eq('user_id', profile.id)
                .maybeSingle();
              setEnrollment(created);
            }
          } else {
            setEnrollment(enrollmentData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseSlug) {
      loadCourseData();
    }
  }, [courseSlug, profile?.id]);

  return {
    course,
    enrollment,
    loading,
    hasQuiz
  };
};
