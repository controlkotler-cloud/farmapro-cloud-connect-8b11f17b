
import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CourseQuiz from '@/components/course/CourseQuiz';

const CourseQuizView = () => {
  const { courseId } = useParams();
  const [quizCompleted, setQuizCompleted] = useState(false);

  if (!courseId) {
    return <Navigate to="/formacion" replace />;
  }

  const handleQuizComplete = (passed: boolean, score: number) => {
    setQuizCompleted(true);
    console.log(`Quiz completed: ${passed ? 'PASSED' : 'FAILED'} with score ${score}%`);
  };

  // Map course IDs to titles
  const courseTitles: Record<string, string> = {
    'dafo': 'DAFO para tu Farmacia',
    'marketing': 'Marketing Digital para Farmacias',
    'liderazgo': 'Liderazgo en el Ámbito Farmacéutico',
    'atencion_cliente': 'Atención al Cliente de Excelencia',
    'tecnologia': 'Tecnología farmapro para Farmacias'
  };

  const courseTitle = courseTitles[courseId] || 'Curso';

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => window.history.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al Curso
      </Button>

      <CourseQuiz 
        courseId={courseId}
        courseTitle={courseTitle}
        onComplete={handleQuizComplete}
      />
    </div>
  );
};

export default CourseQuizView;
