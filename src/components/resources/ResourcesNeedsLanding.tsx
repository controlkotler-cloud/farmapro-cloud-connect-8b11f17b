import { X } from 'lucide-react';
import { RESOURCE_NEEDS } from '@/lib/resourceNeeds';

interface ResourcesNeedsLandingProps {
  selectedNeed: string | null;
  onSelectNeed: (needId: string | null) => void;
}

export const ResourcesNeedsLanding = ({ selectedNeed, onSelectNeed }: ResourcesNeedsLandingProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">¿Qué necesitas?</h2>
        {selectedNeed && (
          <button
            type="button"
            onClick={() => onSelectNeed(null)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Ver todos los recursos
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {RESOURCE_NEEDS.map((need) => {
          const isActive = selectedNeed === need.id;
          return (
            <button
              key={need.id}
              type="button"
              onClick={() => onSelectNeed(isActive ? null : need.id)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                isActive ? 'border-brand-dark bg-brand-soft' : 'border-border bg-white hover:bg-accent'
              }`}
            >
              <div
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${
                  isActive ? 'bg-brand-dark' : 'bg-muted'
                }`}
              >
                <need.Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <p className="text-sm font-bold leading-tight text-foreground">{need.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
