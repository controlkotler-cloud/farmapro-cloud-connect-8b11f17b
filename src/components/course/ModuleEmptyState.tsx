
import { Clock } from 'lucide-react';

export const ModuleEmptyState = () => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
      <div className="p-4 bg-gray-100 rounded-full mx-auto mb-4 w-fit">
        <Clock className="h-8 w-8 text-gray-500" />
      </div>
      <p className="text-gray-500 text-lg">⏳ El contenido de este módulo estará disponible próximamente.</p>
      <p className="text-gray-400 text-sm mt-2">Mantente atento a las actualizaciones</p>
    </div>
  );
};
