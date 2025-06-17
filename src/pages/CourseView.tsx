import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle, BookOpen } from 'lucide-react';
import { CourseHeader } from '@/components/course/CourseHeader';
import { ModuleCard } from '@/components/course/ModuleCard';
import { ModuleContent } from '@/components/course/ModuleContent';
import type { Course, CourseEnrollment, CourseModule } from '@/types/course';

const CourseView = () => {
  const { courseId } = useParams();
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const moduleContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  useEffect(() => {
    if (moduleContentRef.current) {
      moduleContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentModuleIndex]);

  const loadCourseData = async () => {
    if (!courseId) return;

    try {
      // Cargar datos del curso
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('Error loading course:', courseError);
        setLoading(false);
        return;
      }

      if (courseData) {
        // Transformar course_modules de Json a CourseModule[]
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
      }

      // Cargar inscripción si el usuario está autenticado
      if (profile?.id) {
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('course_id', courseId)
          .eq('user_id', profile.id)
          .maybeSingle();

        if (enrollmentError) {
          console.error('Error loading enrollment:', enrollmentError);
        } else {
          setEnrollment(enrollmentData);
        }
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async () => {
    if (!profile?.id || !courseId) return;

    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ 
          completed_at: new Date().toISOString(),
          progress: 100 
        })
        .eq('course_id', courseId)
        .eq('user_id', profile.id);

      if (error) {
        console.error('Error marking course as completed:', error);
        return;
      }

      // Añadir puntos por completar curso
      try {
        const { error: pointsError } = await supabase.rpc('add_user_points', {
          user_id: profile.id,
          points: 100
        } as any);
        if (pointsError) {
          console.error('Error adding points:', pointsError);
        }
      } catch (error) {
        console.error('Error calling add_user_points:', error);
      }

      // Recargar datos
      await loadCourseData();
    } catch (error) {
      console.error('Error marking course as completed:', error);
    }
  };

  const goToQuiz = () => {
    window.location.href = `/curso/${courseId}/quiz`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Cargando curso...</div>
      </div>
    );
  }

  if (!course) {
    return <Navigate to="/formacion" replace />;
  }

  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.completed_at !== null;
  const progress = enrollment?.progress || 0;
  const modules = course.course_modules || [];
  const currentModule = modules[currentModuleIndex];

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Button 
        variant="ghost" 
        onClick={() => window.history.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Formación
      </Button>

      {/* Course Header */}
      <CourseHeader course={course} isEnrolled={isEnrolled} isCompleted={isCompleted} />

      {/* Progress Bar */}
      {isEnrolled && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progreso del curso</span>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold">Módulos del curso</h3>
          {modules.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              index={index}
              isActive={index === currentModuleIndex}
              onClick={() => setCurrentModuleIndex(index)}
            />
          ))}
        </div>

        {/* Module Content */}
        <div className="lg:col-span-2" ref={moduleContentRef}>
          {currentModule ? (
            <ModuleContent module={currentModule} moduleIndex={currentModuleIndex} />
          ) : (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600">No hay módulos disponibles para este curso.</p>
            </div>
          )}

          {/* Action Buttons */}
          {isEnrolled && (
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              {/* Quiz Button - available after completing all modules */}
              {currentModuleIndex === modules.length - 1 && (
                <Button onClick={goToQuiz} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Realizar Quiz Final
                </Button>
              )}

              {/* Complete Course Button - available after quiz */}
              {!isCompleted && currentModuleIndex === modules.length - 1 && (
                <Button onClick={markAsCompleted} size="lg" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Marcar como completado
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseView;
