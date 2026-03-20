
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { planConfig, PlanType } from './PlanConfig';

interface SubscriptionHeaderProps {
  currentPlan: PlanType;
}

export const SubscriptionHeader = ({ currentPlan }: SubscriptionHeaderProps) => {
  const config = planConfig[currentPlan];
  const Icon = config.icon;

  return (
    <CardHeader className={`${config.bgColor} border-b`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl text-gray-900">
              Mi Suscripción
            </CardTitle>
            <CardDescription className="text-gray-600">
              Gestiona tu plan y facturación
            </CardDescription>
          </div>
        </div>
        <Badge className={`${config.bgColor} ${config.textColor} text-lg px-4 py-2`}>
          {config.name}
        </Badge>
      </div>
    </CardHeader>
  );
};
