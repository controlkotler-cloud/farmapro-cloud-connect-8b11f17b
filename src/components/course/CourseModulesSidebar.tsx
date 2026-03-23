
import type { CourseModule } from '@/types/course';
import { ModuleCard } from './ModuleCard';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import type { QuizAttempt } from '@/types/quiz';

interface CourseModulesSidebarProps {
  modules: CourseModule[];
  currentModuleIndex: number;
  isModuleCompleted: (moduleId: string) => boolean;
  onModuleSelect: (index: number) => void;
  bestQuizAttempt?: QuizAttempt | null;
  hasQuiz?: boolean;
}

export const CourseModulesSidebar = ({
  modules,
  currentModuleIndex,
  isModuleCompleted,
  onModuleSelect,
  bestQuizAttempt,
  hasQuiz
}: CourseModulesSidebarProps) => {
  return (
    <div className="lg:col-span-1 space-y-4">
      <h3 className="text-lg font-semibold">📚 Módulos del curso</h3>
      {modules.map((module, index) => {
        const isLocked = index > 0 && !isModuleCompleted(modules[index - 1].id);
        return (
          <ModuleCard
            key={module.id}
            module={module}
            index={index}
            isActive={index === currentModuleIndex}
            isCompleted={isModuleCompleted(module.id)}
            isLocked={isLocked}
            onClick={() => {
              if (!isLocked) {
                onModuleSelect(index);
              }
            }}
          />
        );
      })}

      {/* Quiz badge in sidebar */}
      {hasQuiz && (
        <div className="border rounded-lg p-3 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">📝 Evaluación</span>
            {bestQuizAttempt ? (
              <Badge
                variant={bestQuizAttempt.passed ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                {bestQuizAttempt.passed ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {Math.round(bestQuizAttempt.percentage)}%
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Pendiente</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
