
import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CourseQuiz from '@/components/course/CourseQuiz';

const CourseQuizView = () => {
  const { courseSlug } = useParams();
  const [quizCompleted, setQuizCompleted] = useState(false);

  if (!courseSlug) {
    return <Navigate to="/formacion" replace />;
  }

  const handleQuizComplete = (passed: boolean, score: number) => {
    setQuizCompleted(true);
    console.log(`Quiz completed: ${passed ? 'PASSED' : 'FAILED'} with score ${score}%`);
  };

  // Map course slugs to titles (can be loaded from database in future)
  const courseTitles: Record<string, string> = {
    'dafo-para-tu-farmacia': 'DAFO para tu Farmacia',
    'marketing-digital-para-farmacias': 'Marketing Digital para Farmacias',
    'liderazgo-en-el-ambito-farmaceutico': 'Liderazgo en el Ámbito Farmacéutico',
    'atencion-al-cliente-de-excelencia': 'Atención al Cliente de Excelencia',
    'tecnologia-farmapro-para-farmacias': 'Tecnología farmapro para Farmacias'
  };

  const courseTitle = courseTitles[courseSlug] || 'Curso';

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
        courseId={courseSlug}
        courseTitle={courseTitle}
        onComplete={handleQuizComplete}
      />
    </div>
  );
};

export default CourseQuizView;
