import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Users, ArrowRight, HelpCircle } from 'lucide-react';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { TeamPlanCard } from '@/components/subscription/TeamPlanCard';
import { useAuth } from '@/hooks/useAuth';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Planes() {
  const { profile } = useAuth();
  const currentPlan = profile?.subscription_role || 'freemium';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700 py-24">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Elige el plan perfecto para tu desarrollo como farmacéutico
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Accede a formación continua, recursos especializados, una comunidad activa y oportunidades de empleo. 
            Todo lo que necesitas para hacer crecer tu carrera profesional.
          </p>
          <div className="flex items-center justify-center gap-6 text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Formación certificada</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Recursos especializados</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Comunidad profesional</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Bolsa de trabajo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Planes Individuales */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Planes Individuales</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Desde acceso gratuito hasta planes completos con todas las funcionalidades premium
            </p>
          </div>
          
          <SubscriptionPlans 
            variant="marketing" 
            currentPlan={currentPlan}
          />
        </div>

        {/* Plan Team - Destacado */}
        <div className="mb-16">
          <Card className="relative overflow-hidden border-2 border-gradient-to-r from-amber-400 to-orange-500 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50"></div>
            <div className="relative">
              <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm px-3 py-1">
                    Gestión Centralizada
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Plan para tu Equipo</CardTitle>
                <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Perfecto para farmacias que quieren gestionar las suscripciones de todo su equipo de forma centralizada. 
                  Incluye descuentos por volumen y facturación unificada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold text-gray-900">Beneficios del Plan Team:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span>Descuentos progresivos por número de miembros</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span>Gestión centralizada desde un panel de control</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span>Facturación unificada para toda la farmacia</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span>Invitaciones automáticas por email</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span>Acceso Premium para todos los miembros</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <TeamPlanCard />
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h2>
            <p className="text-gray-600">Resuelve tus dudas sobre nuestros planes de suscripción</p>
          </div>
          
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="billing">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-blue-600" />
                      ¿La facturación es mensual o anual?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pl-8">
                    Todos nuestros planes se facturan mensualmente. Puedes cancelar en cualquier momento sin compromisos de permanencia.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cancel">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-blue-600" />
                      ¿Puedo cancelar mi suscripción en cualquier momento?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pl-8">
                    Sí, puedes cancelar tu suscripción desde el portal del cliente de Stripe. El acceso premium se mantiene hasta el final del período de facturación actual.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="student">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-blue-600" />
                      ¿Cómo funciona la validación para el plan Estudiante?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pl-8">
                    Debes subir tu matrícula o certificado de estudios actual. Nuestro equipo revisará la documentación en un plazo máximo de 24 horas hábiles.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="difference">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-blue-600" />
                      ¿Cuál es la diferencia entre Profesional y Premium?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pl-8">
                    El plan Profesional incluye acceso completo a formación, recursos y comunidad. El Premium añade funcionalidades de negocio como publicar ofertas de empleo, vender farmacias y acceso a promociones exclusivas.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}