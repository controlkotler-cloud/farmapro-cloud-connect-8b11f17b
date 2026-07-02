
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getAccessState, FREE_LIMITS } from '@/lib/plans';
import type { Course, CourseEnrollment, CourseModule } from '@/types/course';

export const useCourses = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargamos todos los cursos publicados una sola vez. El filtrado por
  // categoría, nivel, acceso, búsqueda y orden vive en cliente (la página).
  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (profile?.id) {
      loadEnrollments();
    }
  }, [profile]);

  const loadCourses = async () => {
    setLoading(true);
    // Catálogo: NO se pide course_modules (columna revocada al cliente por seguridad).
    // El contenido se sirve por RPC get_course_modules dentro de la ficha del curso.
    const { data, error } = await supabase
      .from('courses')
      .select('id, slug, title, description, category, difficulty, duration_minutes, duration_hours, thumbnail_url, featured_image_url, is_premium, is_published, is_featured, order_index, students_count, rating, total_lessons, instructor, content, created_at, updated_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading courses:', error);
    } else if (data) {
      const transformedCourses: Course[] = data.map(course => ({
        ...(course as any),
        course_modules: [],
      }));
      setCourses(transformedCourses);
    }
    setLoading(false);
  };

  const loadEnrollments = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('course_enrollments')
      .select('course_id, completed_at, started_at')
      .eq('user_id', profile.id);

    if (error) {
      console.error('Error loading enrollments:', error);
    } else {
      setEnrollments(data || []);
    }
  };

  // Estado de acceso del plan (de pago / prueba gratis / gratis caducado).
  const accessState = getAccessState(profile?.subscription_role, profile?.created_at);

  const enrollInCourse = async (courseSlug: string) => {
    if (!profile?.id) return;

    // Buscar el curso por slug
    const course = courses.find(c => c.slug === courseSlug);
    if (!course) return;

    const existingEnrollment = enrollments.find(enrollment => enrollment.course_id === course.id);

    // Si ya está inscrito, dejamos que el control fino (la propia ficha del
    // curso) decida si puede abrir el contenido; aquí solo navegamos.
    if (existingEnrollment) {
      navigate(`/curso/${courseSlug}`);
      return;
    }

    // Inscripción NUEVA → aplicar control de acceso del plan gratis.
    // Gratis caducado: no puede inscribirse a nada.
    if (accessState === 'free_locked') {
      toast({
        title: 'Tu acceso gratuito ha caducado',
        description: 'Hazte Plus para seguir formándote con todos los cursos.',
        variant: 'destructive',
      });
      navigate('/precios');
      return;
    }

    // Periodo de prueba: tope de cursos. Si ya está en el tope, no permite uno nuevo.
    if (accessState === 'free_trial' && enrollments.length >= FREE_LIMITS.courses) {
      toast({
        title: 'Has alcanzado el límite del plan Gratis',
        description: `El plan Gratis incluye ${FREE_LIMITS.courses} cursos. Hazte Plus para acceder a todo el catálogo.`,
        variant: 'destructive',
      });
      navigate('/precios');
      return;
    }

    const { error } = await supabase
      .from('course_enrollments')
      .insert([{
        user_id: profile.id,
        course_id: course.id,
        started_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error enrolling in course:', error);
    } else {
      try {
        // Update challenge progress for course started
        const { updateChallengeProgress } = await import('@/utils/challengeUtils');
        await updateChallengeProgress(profile.id, 'course_started', 1);
      } catch (error) {
        console.error('Error updating challenge progress:', error);
      }

      await loadEnrollments();
      navigate(`/curso/${courseSlug}`);
    }
  };

  // ¿Puede el usuario acceder a ESTE curso? Combina la lógica premium previa
  // con el control de acceso del plan gratis (paid / prueba / caducado).
  const canAccessCourse = (course: Course) => {
    // De pago o admin: acceso total.
    if (accessState === 'paid') return true;

    // Gratis caducado: no abre el contenido de ningún curso (sí ve el catálogo).
    if (accessState === 'free_locked') return false;

    // A partir de aquí, periodo de prueba gratis.
    // Mantenemos la lógica premium: los cursos premium siguen siendo de pago.
    if (course.is_premium) return false;

    // Si ya está inscrito en este curso, puede seguir accediendo.
    const isEnrolled = enrollments.some(enrollment => enrollment.course_id === course.id);
    if (isEnrolled) return true;

    // Curso nuevo dentro de la prueba: permitido solo si no ha llegado al tope.
    return enrollments.length < FREE_LIMITS.courses;
  };

  return {
    courses,
    enrollments,
    loading,
    enrollInCourse,
    canAccessCourse
  };
};
