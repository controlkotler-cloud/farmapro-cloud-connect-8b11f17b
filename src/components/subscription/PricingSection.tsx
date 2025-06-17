
import { Check, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    id: 'premium',
    name: 'Premium Farmacia',
    price: '39€/mes',
    description: 'Para equipos que buscan excelencia',
    features: [
      'Acceso para hasta 3 miembros del equipo',
      'Todo el contenido del portal',
      'Descarga ilimitada de recursos',
      'Soporte prioritario',
      'Webinars exclusivos en directo',
      '15% descuento en servicios farmapro'
    ],
    highlighted: true,
    color: 'bg-gradient-to-br from-blue-600 to-green-600'
  },
  {
    id: 'professional',
    name: 'Individual Profesional',
    price: '19€/mes',
    description: 'Para profesionales ambiciosos',
    features: [
      'Acceso para 1 usuario',
      'Todo el contenido del portal',
      'Descarga ilimitada de recursos',
      'Soporte estándar',
      'Acceso a webinars grabados',
      '10% descuento en servicios farmapro'
    ],
    highlighted: false,
    color: 'bg-gradient-to-br from-gray-600 to-gray-700'
  },
  {
    id: 'student',
    name: 'Estudiante',
    price: '5€/mes',
    description: 'Para el futuro de la farmacia',
    features: [
      'Acceso para estudiantes de farmacia',
      'Contenido adaptado a formación',
      'Recursos para desarrollo profesional',
      'Comunidad de estudiantes y mentores',
      'Preparación para el mundo laboral',
      'Upgrade con descuento al graduarse'
    ],
    highlighted: false,
    color: 'bg-gradient-to-br from-green-600 to-blue-600'
  }
];

export const PricingSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Planes Diseñados para Cada Perfil Profesional</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ofrecemos diferentes opciones de suscripción para adaptarnos a las necesidades específicas de cada profesional farmacéutico. Todos los planes incluyen acceso completo al Portal farmapro.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative hover:shadow-xl transition-shadow ${plan.highlighted ? 'ring-2 ring-blue-600' : ''}`}>
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">Más Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${plan.color} flex items-center justify-center`}>
                  <Star className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-blue-600">{plan.price}</div>
                <CardDescription className="text-base">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${plan.highlighted ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-800'} text-white`}>
                  ELEGIR ESTE PLAN
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">30 días de prueba gratuita sin compromiso - Cancelación sencilla en cualquier momento</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
