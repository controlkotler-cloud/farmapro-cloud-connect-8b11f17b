import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, GraduationCap, Briefcase, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlansProps {
  variant?: 'default' | 'marketing' | 'compact';
  currentPlan?: string;
  userRole?: string;
  hideFreemium?: boolean;
}

export function SubscriptionPlans({ 
  variant = 'default', 
  currentPlan, 
  userRole = 'freemium',
  hideFreemium = false 
}: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // Determine which plans to show based on user role
  const getVisiblePlans = () => {
    const allPlans = ['freemium', 'estudiante', 'profesional', 'premium'];
    
    if (userRole === 'premium') {
      return []; // Premium users only see team plan (handled elsewhere)
    }
    
    if (userRole === 'profesional') {
      return ['premium']; // Professional users only see premium
    }
    
    if (userRole === 'estudiante') {
      return ['profesional', 'premium']; // Student users can upgrade to professional or premium
    }
    
    // Freemium users see all plans except freemium if hideFreemium is true
    if (hideFreemium) {
      return ['estudiante', 'profesional', 'premium'];
    }
    
    return allPlans;
  };

  const visiblePlans = getVisiblePlans();

  const handleSelectPlan = async (planType: string) => {
    if (planType === currentPlan) return;
    
    setLoading(planType);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: planType }
      });
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Error al procesar la suscripción. Contacta con soporte.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // If no plans are visible, show a message or team plan info
  if (visiblePlans.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Ya tienes el plan más alto disponible. Considera el Plan de Equipo para añadir miembros.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${
      visiblePlans.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
      visiblePlans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' :
      visiblePlans.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    }`}>
      {/* Freemium Plan */}
      {visiblePlans.includes('freemium') && (
        <Card className={`relative overflow-hidden ${currentPlan === 'freemium' ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl">Freemium</CardTitle>
            <CardDescription>
              <span className="text-2xl font-bold">Gratis</span>
            </CardDescription>
            {currentPlan === 'freemium' && (
              <Badge variant="secondary" className="mx-auto">Plan Actual</Badge>
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Acceso a 1 curso</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Máximo 2 descargas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Ver comunidad (solo lectura)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Retos básicos</span>
              </li>
            </ul>
            <Button 
              variant="outline" 
              className="w-full" 
              disabled={currentPlan === 'freemium'}
            >
              {currentPlan === 'freemium' ? 'Plan Actual' : 'Empezar Gratis'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Student Plan */}
      {visiblePlans.includes('estudiante') && (
        <Card className={`relative overflow-hidden ${currentPlan === 'estudiante' ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl">Estudiante</CardTitle>
            <CardDescription>
              <span className="text-2xl font-bold">5€</span>
              <span className="text-muted-foreground">/mes</span>
            </CardDescription>
            {currentPlan === 'estudiante' && (
              <Badge variant="secondary" className="mx-auto">Plan Actual</Badge>
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">1 curso al mes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">2 descargas al mes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Acceso a bolsa de trabajo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Farmacias en venta</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Verificación de matrícula requerida</span>
              </li>
            </ul>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => toast({
                title: "Plan Estudiante",
                description: "Por favor, sube tu documentación de estudiante para acceder a este plan",
              })}
              disabled={currentPlan === 'estudiante'}
            >
              {currentPlan === 'estudiante' ? 'Plan Actual' : 'Subir Documentación de Estudiante'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Professional Plan */}
      {visiblePlans.includes('profesional') && (
        <Card className={`relative overflow-hidden border-primary ${currentPlan === 'profesional' ? 'ring-2 ring-primary' : ''}`}>
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 text-sm font-medium">
            Más Popular
          </div>
          <CardHeader className="text-center pt-12">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl">Profesional</CardTitle>
            <CardDescription>
              <span className="text-2xl font-bold">29€</span>
              <span className="text-muted-foreground">/mes</span>
            </CardDescription>
            {currentPlan === 'profesional' && (
              <Badge variant="secondary" className="mx-auto">Plan Actual</Badge>
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Acceso completo a formación</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Descargas ilimitadas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Comunidad completa</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Retos avanzados</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Eventos exclusivos</span>
              </li>
            </ul>
            <Button 
              className="w-full" 
              onClick={() => handleSelectPlan('profesional')}
              disabled={loading === 'profesional' || currentPlan === 'profesional'}
            >
              {loading === 'profesional' ? 'Procesando...' : (currentPlan === 'profesional' ? 'Plan Actual' : 'Seleccionar Plan')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Premium Plan */}
      {visiblePlans.includes('premium') && (
        <Card className={`relative overflow-hidden ${currentPlan === 'premium' ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl">Premium</CardTitle>
            <CardDescription>
              <span className="text-2xl font-bold">39€</span>
              <span className="text-muted-foreground">/mes</span>
            </CardDescription>
            {currentPlan === 'premium' && (
              <Badge variant="secondary" className="mx-auto">Plan Actual</Badge>
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Todo lo anterior</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Promociones exclusivas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Publicar ofertas de empleo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Formaciones premium</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Soporte prioritario</span>
              </li>
            </ul>
            <Button 
              className="w-full" 
              onClick={() => handleSelectPlan('premium')}
              disabled={loading === 'premium' || currentPlan === 'premium'}
            >
              {loading === 'premium' ? 'Procesando...' : (currentPlan === 'premium' ? 'Plan Actual' : 'Seleccionar Plan')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}