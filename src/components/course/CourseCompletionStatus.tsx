
import { Award, ClipboardCheck, PartyPopper } from 'lucide-react';
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
        <div className="flex flex-col items-center gap-3 bg-brand-soft border border-brand/20 rounded-lg p-6">
          <ClipboardCheck className="h-8 w-8 text-brand-dark" />
          <div className="text-center">
            <p className="font-semibold text-brand-dark">
              ¡Has completado todos los módulos!
            </p>
            <p className="text-sm text-brand-dark/80 mt-1">
              Realiza la evaluación para obtener tu certificado
            </p>
          </div>
          <Link to={`/curso/${courseSlug}/quiz`}>
            <Button
              size="lg"
              className="mt-2 rounded-full px-8 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Realizar evaluación
            </Button>
          </Link>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-3 bg-brand-soft border border-brand/20 rounded-lg p-4 justify-center">
          <Award className="h-6 w-6 text-brand-dark" />
          <div>
            <p className="font-semibold text-brand-dark flex items-center gap-1.5"><PartyPopper className="h-4 w-4" /> ¡Curso completado!</p>
            <p className="text-sm text-brand-dark/80">Has finalizado exitosamente este curso</p>
          </div>
        </div>
      )}
    </div>
  );
};
