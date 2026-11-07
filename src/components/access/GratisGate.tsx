import type { ReactNode } from 'react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { AccessLockedCard } from '@/components/access/AccessLockedCard';
import { GRATIS_CANDADO } from '@/lib/cuentaGratis';

interface GratisGateProps {
  /** Texto del candado (uno de GRATIS_CANDADO). */
  description: string;
  children: ReactNode;
}

/**
 * Cuenta gratis permanente: sustituye la pantalla por el candado "Esto está en
 * Plus". Con cualquier otro estado (prueba, pago, muro) deja pasar a la página
 * sin tocarla, así que el modo muro se comporta exactamente como antes.
 */
export const GratisGate = ({ description, children }: GratisGateProps) => {
  const { isGratis } = useEntitlements();
  if (!isGratis) return <>{children}</>;
  return (
    <div className="py-8">
      <AccessLockedCard
        title={GRATIS_CANDADO.titulo}
        description={description}
        ctaLabel={GRATIS_CANDADO.cta}
      />
    </div>
  );
};
