import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessLockedCardProps {
  /** Título del bloqueo. */
  title?: string;
  /** Texto explicativo. */
  description?: string;
  /** Texto del botón que lleva a Precios. */
  ctaLabel?: string;
}

/**
 * Tarjeta de bloqueo reutilizable para el control de acceso del plan gratis.
 * Muestra el motivo y una llamada a la acción que lleva a la página de Precios.
 */
export const AccessLockedCard = ({
  title = 'Tu acceso gratuito ha caducado',
  description = 'Hazte Plus para desbloquear todos los cursos, recursos e IAFarma sin límites.',
  ctaLabel = 'Hazte Plus',
}: AccessLockedCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl bg-ciruela-soft p-10 text-center max-w-xl mx-auto">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-ciruela text-primary-foreground mx-auto mb-5">
        <Lock className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Button
        onClick={() => navigate('/precios')}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
        size="lg"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {ctaLabel}
      </Button>
    </div>
  );
};
