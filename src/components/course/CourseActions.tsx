
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Course, CourseEnrollment, CourseModule } from '@/types/course';

interface CourseActionsProps {
  course: Course;
  enrollment: CourseEnrollment | null;
  hasQuiz: boolean;
  courseSlug: string;
  isModuleCompleted: (moduleId: string) => boolean;
  markModuleAsCompleted: (moduleId: string) => Promise<void>;
  getCompletionPercentage: (totalModules: number) => number;
}

export const useCourseActions = ({
  course,
  enrollment,
  hasQuiz,
  courseSlug,
  isModuleCompleted,
  markModuleAsCompleted,
  getCompletionPercentage
}: CourseActionsProps) => {
  const { profile } = useAuth();

  const handleCompleteModule = async (moduleId: string) => {
    await markModuleAsCompleted(moduleId);
    
    // Upsert y no update: si el usuario entró por enlace directo y aún no hay
    // inscripción, se crea aquí con el progreso (UNIQUE user_id+course_id).
    if (course && profile?.id) {
      const totalModules = course.course_modules?.length || 0;
      const newProgress = getCompletionPercentage(totalModules);

      const { error } = await supabase
        .from('course_enrollments')
        .upsert(
          { user_id: profile.id, course_id: course.id, progress: newProgress },
          { onConflict: 'user_id,course_id' },
        );
      if (error) console.error('Error updating course progress:', error);
    }
  };

  const handleFinishCourse = async () => {
    if (hasQuiz) {
      window.location.href = `/curso/${courseSlug}/quiz`;
    } else {
      // Marcar el curso como completado. Antes exigía `enrollment` y, si el
      // usuario había entrado por enlace directo (sin inscripción), el botón
      // Finalizar no hacía NADA (fallo visto 08-09-2026). Ahora: upsert, y
      // si falla se avisa en vez de callar.
      if (!course || !profile?.id) return;
      try {
        const { error } = await supabase
          .from('course_enrollments')
          .upsert(
            {
              user_id: profile.id,
              course_id: course.id,
              completed_at: new Date().toISOString(),
              // is_completed es lo que leen recompute_user_points (+50 puntos) y
              // "Continuar curso" del panel; solo con completed_at el curso
              // seguía contando como pendiente y sin sus puntos.
              is_completed: true,
              progress: 100,
            },
            { onConflict: 'user_id,course_id' },
          );
        if (error) throw error;

        // Update challenge progress for course completion
        const { updateChallengeProgress } = await import('@/utils/challengeUtils');
        await updateChallengeProgress(profile.id, 'course_completed', 1);

        // Redirect to courses page
        window.location.href = '/formacion';
      } catch (error) {
        console.error('Error completing course:', error);
        toast({
          title: 'No se ha podido guardar el curso como finalizado',
          description: 'Vuelve a intentarlo en unos segundos. Si sigue fallando, escríbenos.',
          variant: 'destructive',
        });
      }
    }
  };

  return {
    handleCompleteModule,
    handleFinishCourse
  };
};
