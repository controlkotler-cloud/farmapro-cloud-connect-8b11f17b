import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Users, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  icon: any;
  popular?: boolean;
  priceId?: string;
}

const plans: Plan[] = [
  {
    id: 'estudiante',
    name: 'Estudiante',
    price: 19,
    period: 'mes',
    description: 'Ideal para estudiantes de farmacia',
    icon: Star,
    features: [
      'Acceso a 10 cursos',
      'Descarga de 25 recursos',
      'Participación en foros',
      'Certificados de cursos',
      'Soporte por email'
    ]
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 29,
    period: 'mes',
    description: 'Para farmacéuticos profesionales',
    icon: CheckCircle,
    popular: true,
    features: [
      'Acceso ilimitado a cursos',
      'Descarga ilimitada de recursos',
      'Participación en foros premium',
      'Certificados oficiales',
      'Webinars exclusivos',
      'Soporte prioritario'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 39,
    period: 'mes',
    description: 'Acceso completo y beneficios exclusivos',
    icon: Crown,
    features: [
      'Todo lo incluido en Profesional',
      'Acceso a eventos exclusivos',
      'Descuentos en formación presencial',
      'Networking premium',
      'Consultoría personalizada',
      'Acceso anticipado a novedades'
    ]
  },
  {
    id: 'team',
    name: 'Team',
    price: 199,
    period: 'mes',
    description: 'Para equipos de farmacia (hasta 10 miembros)',
    icon: Users,
    features: [
      'Hasta 10 usuarios incluidos',
      'Plan Profesional para todos',
      'Panel de gestión de equipo',
      'Reportes de progreso grupal',
      'Facturación centralizada',
      'Soporte dedicado'
    ]
  }
];

export const SubscriptionPlans = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    setLoading(plan.id);
    
    try {
      if (plan.id === 'team') {
        // Usar la función específica para equipos
        const { data, error } = await supabase.functions.invoke('create-team-checkout', {
          body: { memberCount: 10 }
        });
        
        if (error) throw error;
        
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        // Para planes individuales, crear checkout regular
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { 
            planType: plan.id,
            returnUrl: window.location.origin + '/perfil?tab=plan'
          }
        });
        
        if (error) throw error;
        
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Error al procesar la suscripción. Contacta con soporte.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => {
        const PlanIcon = plan.icon;
        
        return (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-2 border-blue-500 shadow-lg' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">Más Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <PlanIcon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-sm">
                {plan.description}
              </CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">{plan.price}€</span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full"
                onClick={() => handleSelectPlan(plan)}
                disabled={loading === plan.id}
                variant={plan.popular ? "default" : "outline"}
              >
                {loading === plan.id ? 'Procesando...' : 'Seleccionar Plan'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};