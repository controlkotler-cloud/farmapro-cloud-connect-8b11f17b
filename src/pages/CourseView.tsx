
import { useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useCourseData } from '@/hooks/useCourseData';
import { useCourseActions } from '@/components/course/CourseActions';
import { useCourseNavigation } from '@/components/course/CourseNavigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CourseHeader } from '@/components/course/CourseHeader';
import { ModuleContent } from '@/components/course/ModuleContent';
import { CourseViewLoading } from '@/components/course/CourseViewLoading';
import { CourseProgressBar } from '@/components/course/CourseProgressBar';
import { CourseModulesSidebar } from '@/components/course/CourseModulesSidebar';
import { CourseCompletionStatus } from '@/components/course/CourseCompletionStatus';

const CourseView = () => {
  const { courseSlug } = useParams();
  const moduleContentRef = useRef<HTMLDivElement>(null);

  const { course, enrollment, loading: courseLoading, hasQuiz } = useCourseData(courseSlug);
  
  const {
    isModuleCompleted,
    markModuleAsCompleted,
    getCompletionPercentage,
    loading: progressLoading
  } = useModuleProgress(course?.id || '');

  const { handleCompleteModule, handleFinishCourse } = useCourseActions({
    course,
    enrollment,
    hasQuiz,
    courseSlug: courseSlug || '',
    isModuleCompleted,
    markModuleAsCompleted,
    getCompletionPercentage
  });

  const modules = course?.course_modules || [];
  
  const {
    currentModuleIndex,
    handlePreviousModule,
    handleNextModule,
    isNextModuleUnlocked,
    handleModuleSelect
  } = useCourseNavigation({ modules, isModuleCompleted });

  useEffect(() => {
    // Scroll to top of page when module changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentModuleIndex]);

  if (courseLoading || progressLoading) {
    return <CourseViewLoading />;
  }

  if (!course) {
    return <Navigate to="/formacion" replace />;
  }

  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.completed_at !== null;
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
