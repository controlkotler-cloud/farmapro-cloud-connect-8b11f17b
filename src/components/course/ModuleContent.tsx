
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CourseModule } from '@/types/course';
import { ModuleContentHeader } from './ModuleContentHeader';
import { ModuleVideoSection } from './ModuleVideoSection';
import { ModuleContentSection } from './ModuleContentSection';
import { ModuleResourcesSection } from './ModuleResourcesSection';
import { ModuleEmptyState } from './ModuleEmptyState';
import { ModuleNavigationFooter } from './ModuleNavigationFooter';
import { ModuleCompletionWarning } from './ModuleCompletionWarning';

interface ModuleContentProps {
  module: CourseModule;
  moduleIndex: number;
  totalModules: number;
  isCompleted: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  onFinishCourse: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isNextModuleUnlocked: boolean;
}

export const ModuleContent = ({ 
  module, 
  moduleIndex, 
  totalModules,
  isCompleted,
  onPrevious,
  onNext,
  onComplete,
  onFinishCourse,
  canGoNext,
  canGoPrevious,
  isNextModuleUnlocked
}: ModuleContentProps) => {
  const isLastModule = moduleIndex === totalModules - 1;
  const hasContent = module.content || module.video_url || (module.downloadable_resources && module.downloadable_resources.length > 0);

  return (
    <Card className="h-full">
      <ModuleContentHeader 
        module={module}
        moduleIndex={moduleIndex}
        totalModules={totalModules}
        isCompleted={isCompleted}
      />

      <CardContent className="p-0 h-full">
        <ScrollArea className="h-[60vh] p-6">
          <div className="space-y-8">
            {/* Video del módulo si está disponible */}
            {module.video_url && (
              <ModuleVideoSection videoUrl={module.video_url} />
            )}

            {/* Contenido del módulo */}
            {module.content && (
              <ModuleContentSection content={module.content} />
            )}

            {/* Recursos descargables */}
            {module.downloadable_resources && module.downloadable_resources.length > 0 && (
              <ModuleResourcesSection resources={module.downloadable_resources} />
            )}

            {/* Mensaje cuando no hay contenido adicional */}
            {!hasContent && <ModuleEmptyState />}

            {/* Advertencia si el siguiente módulo está bloqueado */}
            <ModuleCompletionWarning 
              isLastModule={isLastModule}
              isCompleted={isCompleted}
            />
          </div>
        </ScrollArea>

        {/* Navegación y completar módulo */}
        <ModuleNavigationFooter
          moduleIndex={moduleIndex}
          totalModules={totalModules}
          isCompleted={isCompleted}
          onPrevious={onPrevious}
          onNext={onNext}
          onComplete={onComplete}
          onFinishCourse={onFinishCourse}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          isNextModuleUnlocked={isNextModuleUnlocked}
        />
      </CardContent>
    </Card>
  );
};
