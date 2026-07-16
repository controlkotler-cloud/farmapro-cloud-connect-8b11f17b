
import { Card, CardContent } from '@/components/ui/card';

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
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Progreso del curso</span>
          <span className="text-sm text-muted-foreground">{moduleProgress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-border bg-secondary">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${Math.max(moduleProgress, 4)}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Módulos completados: {completedModulesCount} de {totalModules}
        </div>
      </CardContent>
    </Card>
  );
};
