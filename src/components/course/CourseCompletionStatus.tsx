
import { Award, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface CourseCompletionStatusProps {
  isEnrolled: boolean;
  allModulesCompleted: boolean;
  isCompleted: boolean;
  hasQuiz?: boolean;
  courseSlug?: string;
}

export const CourseCompletionStatus = ({
  isEnrolled,
  allModulesCompleted,
  isCompleted,
  hasQuiz,
  courseSlug
}: CourseCompletionStatusProps) => {
  if (!isEnrolled) return null;

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Show evaluation button when all modules done and quiz exists */}
      {allModulesCompleted && hasQuiz && courseSlug && (
        <div className="flex flex-col items-center gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <ClipboardCheck className="h-8 w-8 text-blue-600" />
          <div className="text-center">
            <p className="font-semibold text-blue-800 dark:text-blue-300">
              ¡Has completado todos los módulos!
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Realiza la evaluación para obtener tu certificado
            </p>
          </div>
          <Link to={`/curso/${courseSlug}/quiz`}>
            <Button size="lg" className="mt-2 px-8">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Realizar evaluación
            </Button>
          </Link>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4 justify-center">
          <Award className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">🎉 ¡Curso completado!</p>
            <p className="text-sm text-green-600">Has finalizado exitosamente este curso</p>
          </div>
        </div>
      )}
    </div>
  );
};
