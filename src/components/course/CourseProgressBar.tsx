
import { Progress } from '@/components/ui/progress';

interface CourseProgressBarProps {
  moduleProgress: number;
  completedModulesCount: number;
  totalModules: number;
}

export const CourseProgressBar = ({ 
  moduleProgress, 
  completedModulesCount, 
  totalModules 
}: CourseProgressBarProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Progreso del curso</span>
        <span className="text-sm text-gray-600">{moduleProgress}%</span>
      </div>
      <Progress value={moduleProgress} className="w-full" />
      <div className="mt-2 text-xs text-gray-500">
        Módulos completados: {completedModulesCount} de {totalModules}
      </div>
    </div>
  );
};
