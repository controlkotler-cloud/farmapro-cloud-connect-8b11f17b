import { useEntitlements } from '@/hooks/useEntitlements';
import { AccessLockedCard } from '@/components/access/AccessLockedCard';
import { CreativeHeader } from '@/components/creative/CreativeHeader';
import { CreativeWorkspace } from '@/components/creative/CreativeWorkspace';

export default function AsistenteCreativo() {
  const { isLocked } = useEntitlements();

  // Control de acceso del plan gratis: solo se bloquea cuando el periodo de
  // prueba ha caducado (free_locked). La prueba en vigor y los planes de pago
  // pueden usar IAFarma; los topes exactos de IA se afinan luego en servidor
  // con Stripe (aquí basta con bloquear el estado caducado).
  if (isLocked) {
    return (
      <div className="space-y-8">
        <CreativeHeader />
        <AccessLockedCard
          title="Tu acceso gratuito ha caducado"
          description="Hazte Plus para seguir creando contenido con IAFarma: 7 tipos de pieza optimizados para farmacia y adaptados a la normativa."
          ctaLabel="Hazte Plus"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CreativeHeader />
      <CreativeWorkspace />
    </div>
  );
}
