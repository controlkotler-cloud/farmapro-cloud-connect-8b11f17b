import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, GraduationCap, Briefcase, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionPlansProps {
  variant?: 'default' | 'marketing' | 'compact';
  currentPlan?: string;
}

export const SubscriptionPlans = ({ variant = 'default', currentPlan = 'freemium' }: SubscriptionPlansProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'freemium') return; // Ya es el plan actual
    
    setLoading(planId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          plan: planId
        }
      });
      
      if (error) throw error;
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Error al procesar la suscripción. Contacta con soporte.');
    } finally {
      setLoading(null);
    }
  };

  const isMarketing = variant === 'marketing';
  const isCompact = variant === 'compact';

  return (
    <div className="space-y-8">
      {!isCompact && !isMarketing && (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Planes de Suscripción</h1>
          <p className="text-gray-600">Elige el plan que mejor se adapte a tu perfil profesional</p>
        </div>
      )}

      <div className={`grid grid-cols-1 ${isCompact ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} gap-6`}>
        {/* Plan Freemium */}
        <Card className={`relative ${currentPlan === 'freemium' ? 'border-2 border-green-500' : 'border-gray-200'} ${isMarketing ? 'hover:shadow-lg transition-shadow' : ''}`}>
          {currentPlan === 'freemium' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-green-600 text-white">Plan Actual</Badge>
            </div>
          )}
          
          <CardHeader className="text-center">
            <div className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Star className={`${isCompact ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />
            </div>
            <CardTitle className={`${isCompact ? 'text-xl' : 'text-2xl'}`}>Freemium</CardTitle>
            <div className="mt-4">
              <div className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-bold`}>Gratis</div>
              <div className="text-sm text-gray-600">7 días de prueba</div>
            </div>
          </CardHeader>
          
          <CardContent>
            <ul className={`space-y-3 mb-6 ${isCompact ? 'space-y-2' : 'space-y-3'}`}>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className={`${isCompact ? 'text-xs' : 'text-sm'}`}>Acceso a 1 curso</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className={`${isCompact ? 'text-xs' : 'text-sm'}`}>Máximo 2 descargas</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className={`${isCompact ? 'text-xs' : 'text-sm'}`}>Ver comunidad (solo lectura)</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className={`${isCompact ? 'text-xs' : 'text-sm'}`}>Retos básicos</span>
              </li>
            </ul>
            
            <Button 
              className="w-full"
              variant="outline"
              disabled={true}
            >
              Plan Actual
            </Button>
          </CardContent>
        </Card>

        {/* Plan Estudiante */}
        <Card className={`relative border-gray-200 ${isMarketing ? 'hover:shadow-lg transition-shadow' : ''}`}>
          {!isCompact && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-orange-600 text-white">Validación Pendiente</Badge>
            </div>
          )}
          
          <CardHeader className="text-center">
            <div className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <GraduationCap className={`${isCompact ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />
            </div>
            <CardTitle className={`${isCompact ? 'text-xl' : 'text-2xl'}`}>Estudiante</CardTitle>
            <div className="mt-4">
              <span className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-bold`}>5€</span>
              <span className="text-gray-600">/mes</span>
            </div>
          </CardHeader>
          
          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">1 curso al mes</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">2 descargas al mes</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Acceso a bolsa de trabajo</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Farmacias en venta</span>
              </li>
              <li className="text-xs text-gray-600 mt-4">
                Verificación de matrícula requerida
              </li>
            </ul>
            
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => toast.info('Por favor, sube tu documentación de estudiante para acceder a este plan')}
            >
              Subir Nueva Matrícula
            </Button>
          </CardContent>
        </Card>

        {/* Plan Profesional - Más Popular */}
        <Card className={`relative border-2 border-blue-500 shadow-lg ${isMarketing ? 'hover:shadow-xl transition-shadow scale-105' : ''}`}>
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-600 text-white">Más Popular</Badge>
          </div>
          
          <CardHeader className="text-center">
            <div className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Briefcase className={`${isCompact ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />
            </div>
            <CardTitle className={`${isCompact ? 'text-xl' : 'text-2xl'}`}>Profesional</CardTitle>
            <div className="mt-4">
              <span className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-bold`}>29€</span>
              <span className="text-gray-600">/mes</span>
            </div>
          </CardHeader>
          
          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Acceso completo a formación</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Descargas ilimitadas</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Comunidad completa</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Retos avanzados</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Eventos exclusivos</span>
              </li>
            </ul>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => handleSelectPlan('profesional')}
              disabled={loading === 'profesional'}
            >
              {loading === 'profesional' ? 'Procesando...' : 'Elegir Profesional'}
            </Button>
          </CardContent>
        </Card>

        {/* Plan Premium */}
        <Card className={`relative border-gray-200 ${isMarketing ? 'hover:shadow-lg transition-shadow' : ''}`}>
          <CardHeader className="text-center">
            <div className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Crown className={`${isCompact ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />
            </div>
            <CardTitle className={`${isCompact ? 'text-xl' : 'text-2xl'}`}>Premium</CardTitle>
            <div className="mt-4">
              <span className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-bold`}>39€</span>
              <span className="text-gray-600">/mes</span>
            </div>
          </CardHeader>
          
          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Todo lo anterior</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Promociones exclusivas</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Publicar ofertas de empleo</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Vender tu farmacia</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Formaciones premium</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                <span className="text-sm">Soporte prioritario</span>
              </li>
            </ul>
            
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => handleSelectPlan('premium')}
              disabled={loading === 'premium'}
            >
              {loading === 'premium' ? 'Procesando...' : 'Elegir Premium'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};