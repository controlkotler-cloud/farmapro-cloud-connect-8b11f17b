import { Link } from 'react-router-dom';
import { FileText, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TextQuotaStatus } from '@/hooks/useTextQuota';
import type { ImageCreditStatus } from '@/hooks/useImageCredits';

interface QuotaBarProps {
  text: TextQuotaStatus | null;
  image: ImageCreditStatus | null;
  /** true para plan Gratis (prueba): se enseña el tope y el CTA a Plus. */
  isFree: boolean;
}

/**
 * Contador siempre visible de lo que queda en IAFarma este mes: textos e
 * imágenes. Antes solo se conocía tras generar (y con el cupo agotado, la única
 * señal era un error rojo). Los planes de pago tienen un tope mensual muy alto
 * en textos, así que ahí se muestra solo lo usado.
 */
export const QuotaBar = ({ text, image, isFree }: QuotaBarProps) => {
  if (!text && !image) return null;

  const textsExhausted = !!text && !text.allowed;
  const imagesExhausted = !!image && image.remaining <= 0;

  return (
    <div
      className="rounded-lg ring-1 ring-border bg-card px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2"
      aria-label="Uso de IAFarma este mes"
    >
      {text && (
        <Chip
          icon={<FileText className="h-4 w-4" />}
          label="Textos"
          used={text.monthUsed}
          limit={isFree ? text.monthLimit : null}
          exhausted={textsExhausted}
          hint={textsExhausted && text.reason === 'day' ? 'tope de hoy alcanzado' : undefined}
        />
      )}
      {image && (
        <Chip
          icon={<ImageIcon className="h-4 w-4" />}
          label="Imágenes"
          used={image.monthUsed}
          limit={image.monthLimit}
          extra={image.packBalance > 0 ? `+${image.packBalance} de packs` : undefined}
          exhausted={imagesExhausted}
        />
      )}
      {isFree && (
        <Button
          asChild
          size="sm"
          variant={textsExhausted ? 'default' : 'outline'}
          className={textsExhausted ? 'ml-auto' : 'ml-auto border-ciruela text-ciruela hover:bg-ciruela-soft'}
        >
          <Link to="/precios">Ver planes</Link>
        </Button>
      )}
    </div>
  );
};

interface ChipProps {
  icon: React.ReactNode;
  label: string;
  used: number;
  /** null = sin tope que mostrar (planes de pago en textos). */
  limit: number | null;
  extra?: string;
  hint?: string;
  exhausted: boolean;
}

const Chip = ({ icon, label, used, limit, extra, hint, exhausted }: ChipProps) => {
  const pct = limit ? Math.min(100, Math.round((used / Math.max(limit, 1)) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <span className={exhausted ? 'text-destructive' : 'text-ciruela'}>{icon}</span>
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium text-foreground">{label}</span>
          <span className={`tabular-nums ${exhausted ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
            {limit !== null ? `${used} de ${limit} este mes` : `${used} este mes`}
            {extra ? ` · ${extra}` : ''}
            {hint ? ` · ${hint}` : ''}
          </span>
        </div>
        {limit !== null && (
          <div className="mt-1 h-1.5 w-full rounded-full bg-secondary overflow-hidden" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit}>
            <div className={`h-full rounded-full ${exhausted ? 'bg-destructive' : 'bg-ciruela'}`} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </div>
  );
};
