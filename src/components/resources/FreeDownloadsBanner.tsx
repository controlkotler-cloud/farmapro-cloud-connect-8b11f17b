import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FreeDownloadsBannerProps {
  used: number;
  limit: number;
  onSeePlans: () => void;
}

/**
 * Contador de descargas del plan Gratis, siempre visible en Recursos para el
 * usuario en prueba. Antes el tope solo se descubría al chocar con él
 * (feedback Francesc 08-09-2026): ahora se ve cuántas quedan y cómo ampliarlo.
 */
export const FreeDownloadsBanner = ({ used, limit, onSeePlans }: FreeDownloadsBannerProps) => {
  const clamped = Math.min(used, limit);
  const left = Math.max(limit - used, 0);
  const exhausted = left === 0;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg border px-4 py-3 ${
        exhausted ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/40'
      }`}
      role="status"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Download className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground tabular-nums">
            {exhausted
              ? `Has usado tus ${limit} descargas del plan Gratis`
              : `Descargas del plan Gratis: ${clamped} de ${limit} usadas`}
          </p>
          <p className="text-xs text-muted-foreground">
            {exhausted
              ? 'Los recursos que ya tienes puedes volver a bajarlos. Con Plus, todos sin límite.'
              : `Te ${left === 1 ? 'queda' : 'quedan'} ${left}. Con Plus descargas todos los recursos sin límite.`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block" aria-hidden="true">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(clamped / limit) * 100}%` }} />
        </div>
        <Button size="sm" variant={exhausted ? 'default' : 'outline'} className="rounded-full" onClick={onSeePlans}>
          Ver planes
        </Button>
      </div>
    </div>
  );
};
