
import { CheckCircle } from 'lucide-react';

interface ModuleCompletionWarningProps {
  isLastModule: boolean;
  isCompleted: boolean;
}

export const ModuleCompletionWarning = ({ isLastModule, isCompleted }: ModuleCompletionWarningProps) => {
  if (isLastModule || isCompleted) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <CheckCircle className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <p className="font-medium text-amber-800">⚠️ Completa este módulo para continuar</p>
          <p className="text-sm text-amber-600">Debes completar este módulo antes de avanzar al siguiente</p>
        </div>
      </div>
    </div>
  );
};
