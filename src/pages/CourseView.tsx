
import { useEffect, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useCourseData } from '@/hooks/useCourseData';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useCourseActions } from '@/components/course/CourseActions';
import { useCourseNavigation } from '@/components/course/CourseNavigation';
import { useQuiz } from '@/hooks/useQuiz';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { AccessLockedCard } from '@/components/access/AccessLockedCard';
import { CourseHeader } from '@/components/course/CourseHeader';
import { ModuleContent } from '@/components/course/ModuleContent';
import { CourseViewLoading } from '@/components/course/CourseViewLoading';
import { CourseProgressBar } from '@/components/course/CourseProgressBar';
import { CourseModulesSidebar } from '@/components/course/CourseModulesSidebar';
import { CourseCompletionStatus } from '@/components/course/CourseCompletionStatus';

const CourseView = () => {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const moduleContentRef = useRef<HTMLDivElement>(null);
  const { isLocked } = useEntitlements();

  const { course, enrollment, loading: courseLoading, hasQuiz } = useCourseData(courseSlug);

  const {
    isModuleCompleted,
    markModuleAsCompleted,
    getCompletionPercentage,
    loading: progressLoading
  } = useModuleProgress(course?.id || '');

  const { getBestAttempt } = useQuiz(course?.id);

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
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentModuleIndex]);

  if (courseLoading || progressLoading) {
    return <CourseViewLoading />;
  }

  if (!course) {
    return <Navigate to="/formacion" replace />;
  }

  // Control de acceso del plan gratis: si el periodo de prueba ha caducado
  // (free_locked), el usuario puede ver la ficha/catálogo pero NO el contenido
  // del curso. Mostramos bloqueo + CTA a Precios. Los planes de pago y la
  // prueba en vigor pasan de largo (su tope se controla al inscribirse).
  if (isLocked) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/formacion')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Formación
        </Button>
        <AccessLockedCard
          title="Tu acceso gratuito ha caducado"
          description="Ya puedes ver todo el catálogo, pero para entrar en los cursos necesitas el plan Plus. Desbloquéalo y sigue formándote sin límites."
        />
      </div>
    );
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
          hasQuiz={hasQuiz}
          bestQuizAttempt={getBestAttempt}
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
            <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Todavía no hay módulos publicados para este curso. Vuelve pronto.
              </p>
            </div>
          )}

          <CourseCompletionStatus
            isEnrolled={isEnrolled}
            allModulesCompleted={allModulesCompleted}
            isCompleted={isCompleted}
            hasQuiz={hasQuiz}
            courseSlug={courseSlug}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseView;
