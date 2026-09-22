import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEntitlements } from '@/hooks/useEntitlements';

/** A partir de cuántos días restantes se muestra la cuenta atrás (secuencia días 20-30). */
const SHOW_FROM_DAYS_LEFT = 10;

/**
 * Cuenta atrás del plan gratis. Se pinta en el layout del panel cuando quedan
 * 10 días o menos de prueba y desaparece sola al pasar a un plan de pago (el
 * bloqueo del día 31 ya no llega aquí: AppRoutes reenvía a /precios).
 */
export const TrialCountdownBanner = () => {
  const { isTrial, trialDaysLeft, pricingPath } = useEntitlements();
  if (!isTrial || trialDaysLeft === null || trialDaysLeft > SHOW_FROM_DAYS_LEFT) return null;

  const dias = trialDaysLeft;
  const quedan =
    dias <= 0 ? 'Hoy es el último día de tu prueba' : dias === 1 ? 'Te queda 1 día de prueba' : `Te quedan ${dias} días de prueba`;

  return (
    <div
      role="status"
      className="mb-4 flex flex-col gap-2 rounded-lg border border-brand-soft bg-brand-soft px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-brand-dark">
        <span className="font-semibold">{quedan}.</span>{' '}
        Después tu cuenta sigue, pero el contenido queda bloqueado. Sin permanencia y sin cobros automáticos.
      </p>
      <Button asChild size="sm" className="shrink-0">
        <Link to={pricingPath}>Ver los planes</Link>
      </Button>
    </div>
  );
};
