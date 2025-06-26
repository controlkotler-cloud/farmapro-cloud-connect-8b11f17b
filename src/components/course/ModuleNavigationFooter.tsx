
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  Trophy
} from 'lucide-react';

interface ModuleNavigationFooterProps {
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

export const ModuleNavigationFooter = ({
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
}: ModuleNavigationFooterProps) => {
  const isFirstModule = moduleIndex === 0;
  const isLastModule = moduleIndex === totalModules - 1;

  return (
    <div className="border-t bg-gray-50 p-6">
      <div className="flex justify-between items-center">
        {/* Botón Anterior - Solo si no es el primer módulo */}
        <div className="flex-1">
          {!isFirstModule ? (
            <Button 
              onClick={onPrevious}
              variant="outline"
              disabled={!canGoPrevious}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
          ) : (
            <div></div>
          )}
        </div>

        {/* Botón Completar módulo - Siempre presente */}
        <div className="flex items-center gap-3">
          {!isCompleted ? (
            <Button 
              onClick={onComplete}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Completar módulo
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="h-4 w-4" />
              Módulo completado
            </div>
          )}
        </div>

        {/* Botón Siguiente/Finalizar - Solo si no es el último módulo O si es el último módulo */}
        <div className="flex-1 flex justify-end">
          {!isLastModule ? (
            <Button 
              onClick={onNext}
              variant="outline"
              disabled={!canGoNext || !isNextModuleUnlocked}
              className="flex items-center gap-2"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : isCompleted ? (
            <Button 
              onClick={onFinishCourse}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Finalizar
            </Button>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
};
