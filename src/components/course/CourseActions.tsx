
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { supabase } from '@/integrations/supabase/client';
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
    
    if (course && enrollment) {
      const totalModules = course.course_modules?.length || 0;
      const newProgress = getCompletionPercentage(totalModules);
      
      try {
        await supabase
          .from('course_enrollments')
          .update({ progress: newProgress })
          .eq('course_id', course.id)
          .eq('user_id', profile?.id);
      } catch (error) {
        console.error('Error updating course progress:', error);
      }
    }
  };

  const handleFinishCourse = async () => {
    if (hasQuiz) {
      window.location.href = `/curso/${courseSlug}/quiz`;
    } else {
      // Mark course as completed
      if (course && enrollment && profile?.id) {
        try {
          await supabase
            .from('course_enrollments')
            .update({ 
              completed_at: new Date().toISOString(),
              progress: 100 
            })
            .eq('course_id', course.id)
            .eq('user_id', profile.id);
          
          // Update challenge progress for course completion
          const { updateChallengeProgress } = await import('@/utils/challengeUtils');
          await updateChallengeProgress(profile.id, 'course_completed', 1);
          
          // Redirect to courses page
          window.location.href = '/formacion';
        } catch (error) {
          console.error('Error completing course:', error);
        }
      }
    }
  };

  return {
    handleCompleteModule,
    handleFinishCourse
  };
};
