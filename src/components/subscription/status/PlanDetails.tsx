
import { Badge } from '@/components/ui/badge';
import { planConfig, PlanType } from './PlanConfig';

interface PlanDetailsProps {
  currentPlan: PlanType;
  subscriptionStatus?: string;
  trialEndsAt?: string;
}

export const PlanDetails = ({ currentPlan, subscriptionStatus, trialEndsAt }: PlanDetailsProps) => {
  const config = planConfig[currentPlan];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Detalles del Plan
      </h3>
      <div className="space-y-2">
        <p className="text-gray-600">
          <span className="font-medium">Plan actual:</span> {config.name}
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Estado:</span>{' '}
          <Badge variant={subscriptionStatus === 'active' ? 'default' : 'secondary'}>
            {subscriptionStatus === 'active' ? 'Activo' : 
             subscriptionStatus === 'trialing' ? 'Periodo de prueba' : 'Inactivo'}
          </Badge>
        </p>
        {trialEndsAt && subscriptionStatus === 'trialing' && (
          <p className="text-gray-600">
            <span className="font-medium">Prueba termina:</span>{' '}
            {formatDate(trialEndsAt)}
          </p>
        )}
      </div>
    </div>
  );
};
