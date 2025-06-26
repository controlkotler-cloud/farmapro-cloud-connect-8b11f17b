
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Course, CourseEnrollment, CourseModule } from '@/types/course';

export const useCourseData = (courseSlug?: string) => {
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasQuiz, setHasQuiz] = useState(false);

  const loadCourseData = async () => {
    if (!courseSlug) return;

    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', courseSlug)
        .single();

      if (courseError) {
        console.error('Error loading course:', courseError);
        setLoading(false);
        return;
      }

      if (courseData) {
        const transformedCourse: Course = {
          ...courseData,
          course_modules: courseData.course_modules ? 
            (Array.isArray(courseData.course_modules) ? 
              courseData.course_modules as unknown as CourseModule[] : 
              typeof courseData.course_modules === 'string' ? 
                JSON.parse(courseData.course_modules) : 
                []
            ) : []
        };
        setCourse(transformedCourse);

        // Verificar si existe un quiz para este curso
        const { data: quizData } = await supabase
          .from('course_quizzes')
          .select('id')
          .eq('course_id', transformedCourse.id)
          .eq('is_active', true)
          .single();

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
