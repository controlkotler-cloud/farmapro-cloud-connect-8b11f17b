
import { CheckCircle } from 'lucide-react';

interface ModuleCompletionWarningProps {
  isLastModule: boolean;
  isCompleted: boolean;
}

export const ModuleCompletionWarning = ({ isLastModule, isCompleted }: ModuleCompletionWarningProps) => {
  if (isLastModule || isCompleted) return null;

  return (
    <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-warning/10 rounded-lg">
          <CheckCircle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <p className="font-medium text-foreground">⚠️ Completa este módulo para continuar</p>
          <p className="text-sm text-foreground">Debes completar este módulo antes de avanzar al siguiente</p>
        </div>
      </div>
    </div>
  );
};
