import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Course, CourseEnrollment, CourseCategory, CourseModule, DownloadableResource } from '@/types/course';

export const useCourses = () => {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadCourses();
  }, [selectedCategory]);

  useEffect(() => {
    if (profile?.id) {
      loadEnrollments();
    }
  }, [profile]);

  const loadCourses = async () => {
    setLoading(true);
    let query = supabase.from('courses').select('*').order('created_at', { ascending: false });
    
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory as CourseCategory);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading courses:', error);
    } else if (data) {
      // Transformar los datos recibidos para convertir course_modules de Json a CourseModule[]
      const transformedCourses: Course[] = data.map(course => ({
        ...course,
        // Si course_modules es null o undefined, establecer como array vacío
        course_modules: course.course_modules ? 
          (Array.isArray(course.course_modules) ? 
            course.course_modules as unknown as CourseModule[] : 
            // Si es un string JSON, intentar parsearlo
            typeof course.course_modules === 'string' ? 
              JSON.parse(course.course_modules) : 
              []
          ) : []
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

  const enrollInCourse = async (courseSlug: string) => {
    if (!profile?.id) return;

    // Buscar el curso por slug
    const course = courses.find(c => c.slug === courseSlug);
    if (!course) return;

    const existingEnrollment = enrollments.find(enrollment => enrollment.course_id === course.id);

    if (existingEnrollment) {
      window.location.href = `/curso/${courseSlug}`;
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
        const { error: pointsError } = await supabase.rpc('add_user_points', {
          user_id: profile.id,
          points: 50
        } as any);
        if (pointsError) {
          console.error('Error adding points:', pointsError);
        }
      } catch (error) {
        console.error('Error calling add_user_points:', error);
      }
      
      await loadEnrollments();
      window.location.href = `/curso/${courseSlug}`;
    }
  };

  const canAccessCourse = (course: Course) => {
    if (!course.is_premium) return true;
    return profile?.subscription_role && profile.subscription_role !== 'freemium';
  };

  return {
    courses,
    enrollments,
    loading,
    selectedCategory,
    setSelectedCategory,
    enrollInCourse,
    canAccessCourse
  };
};
