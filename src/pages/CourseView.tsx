import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CourseHeader } from '@/components/course/CourseHeader';
import { ModuleContent } from '@/components/course/ModuleContent';
import { CourseViewLoading } from '@/components/course/CourseViewLoading';
import { CourseProgressBar } from '@/components/course/CourseProgressBar';
import { CourseModulesSidebar } from '@/components/course/CourseModulesSidebar';
import { CourseCompletionStatus } from '@/components/course/CourseCompletionStatus';
import type { Course, CourseEnrollment, CourseModule } from '@/types/course';

const CourseView = () => {
  const { courseSlug } = useParams();
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const moduleContentRef = useRef<HTMLDivElement>(null);

  const {
    isModuleCompleted,
    markModuleAsCompleted,
    getCompletionPercentage,
    loading: progressLoading
  } = useModuleProgress(course?.id || '');

  useEffect(() => {
    if (courseSlug) {
      loadCourseData();
    }
  }, [courseSlug]);

  useEffect(() => {
    if (moduleContentRef.current) {
      moduleContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentModuleIndex]);

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

  const handlePreviousModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
    }
  };

  const handleNextModule = () => {
    const modules = course?.course_modules || [];
    const currentModule = modules[currentModuleIndex];
    
    if (!isModuleCompleted(currentModule.id)) {
      return;
    }
    
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  };

  const handleFinishCourse = () => {
    window.location.href = `/curso/${courseSlug}/quiz`;
  };

  const isNextModuleUnlocked = () => {
    const modules = course?.course_modules || [];
    const currentModule = modules[currentModuleIndex];
    return isModuleCompleted(currentModule.id);
  };

  const handleModuleSelect = (index: number) => {
    setCurrentModuleIndex(index);
  };

  if (loading || progressLoading) {
    return <CourseViewLoading />;
  }

  if (!course) {
    return <Navigate to="/formacion" replace />;
  }

  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.completed_at !== null;
  const modules = course.course_modules || [];
  const currentModule = modules[currentModuleIndex];
  const moduleProgress = getCompletionPercentage(modules.length);
  const allModulesCompleted = modules.every(m => isModuleCompleted(m.id));
  const completedModulesCount = Array.from(new Set(modules.map(m => m.id).filter(id => isModuleCompleted(id)))).length;

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => window.history.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Formación
      </Button>

      <CourseHeader course={course} isEnrolled={isEnrolled} isCompleted={isCompleted} />

      {isEnrolled && (
        <CourseProgressBar 
          moduleProgress={moduleProgress}
          completedModulesCount={completedModulesCount}
          totalModules={modules.length}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CourseModulesSidebar
          modules={modules}
          currentModuleIndex={currentModuleIndex}
          isModuleCompleted={isModuleCompleted}
          onModuleSelect={handleModuleSelect}
        />

        <div className="lg:col-span-2" ref={moduleContentRef}>
          {currentModule ? (
            <ModuleContent 
              module={currentModule} 
              moduleIndex={currentModuleIndex}
              totalModules={modules.length}
              isCompleted={isModuleCompleted(currentModule.id)}
              onPrevious={handlePreviousModule}
              onNext={handleNextModule}
              onComplete={() => handleCompleteModule(currentModule.id)}
              onFinishCourse={handleFinishCourse}
              canGoNext={currentModuleIndex < modules.length - 1}
              canGoPrevious={currentModuleIndex > 0}
              isNextModuleUnlocked={isNextModuleUnlocked()}
            />
          ) : (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600">No hay módulos disponibles para este curso.</p>
            </div>
          )}

          <CourseCompletionStatus
            isEnrolled={isEnrolled}
            allModulesCompleted={allModulesCompleted}
            isCompleted={isCompleted}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseView;
