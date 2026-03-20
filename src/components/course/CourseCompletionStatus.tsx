
import { Award } from 'lucide-react';

interface CourseCompletionStatusProps {
  isEnrolled: boolean;
  allModulesCompleted: boolean;
  isCompleted: boolean;
}

export const CourseCompletionStatus = ({
  isEnrolled,
  allModulesCompleted,
  isCompleted
}: CourseCompletionStatusProps) => {
  if (!isEnrolled || !allModulesCompleted) return null;

  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
      {isCompleted && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
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
