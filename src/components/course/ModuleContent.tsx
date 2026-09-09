
 import { useEffect, useRef } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
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
  const cardRef = useRef<HTMLDivElement>(null);
  const isLastModule = moduleIndex === totalModules - 1;
  const hasContent = module.content || module.video_url || (module.downloadable_resources && module.downloadable_resources.length > 0);

  // Al cambiar de módulo, subir al principio de la tarjeta. Antes el contenido
  // iba dentro de un ScrollArea de 60vh con scroll propio: en un portátil el
  // vídeo 16:9 no cabía entero y salía cortado por abajo (prueba de Francesc,
  // 09-09-2026). Ahora la tarjeta crece con su contenido y hace scroll la página.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const top = card.getBoundingClientRect().top + window.scrollY - 96;
    if (window.scrollY > top) window.scrollTo({ top: Math.max(top, 0), left: 0, behavior: 'auto' });
  }, [module.id]);

  return (
    <Card ref={cardRef}>
      <ModuleContentHeader 
        module={module}
        moduleIndex={moduleIndex}
        totalModules={totalModules}
        isCompleted={isCompleted}
      />

      <CardContent className="p-0">
        <div key={module.id} className="p-6">
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
        </div>

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
