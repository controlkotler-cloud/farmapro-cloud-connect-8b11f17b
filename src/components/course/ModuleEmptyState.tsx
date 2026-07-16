
import { Clock } from 'lucide-react';

export const ModuleEmptyState = () => {
  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/40 py-12 text-center">
      <div className="mx-auto mb-4 w-fit rounded-full bg-muted p-4">
        <Clock className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-base text-muted-foreground">
        El contenido de este módulo estará disponible próximamente.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">Mantente atento a las actualizaciones.</p>
    </div>
  );
};
