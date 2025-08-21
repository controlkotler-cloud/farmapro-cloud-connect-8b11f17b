
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, CheckCircle, Star, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { TeamPlanCard } from '@/components/subscription/TeamPlanCard';
import { planConfig } from '@/components/profile/config/PlanConfig';

interface PlanTabProps {
  profile: any;
  isAdmin: boolean;
}

export const PlanTab = ({ profile, isAdmin }: PlanTabProps) => {
  const [refreshLoading, setRefreshLoading] = useState(false);

  const getCurrentPlan = () => {
    if (isAdmin) return 'admin';
    return profile?.subscription_role || 'freemium';
  };

  const currentPlan = getCurrentPlan();
  const config = planConfig[currentPlan as keyof typeof planConfig] || planConfig.freemium;
  const PlanIcon = config.icon;

  const refreshSubscriptionStatus = async () => {
    if (currentPlan === 'admin') {
      toast.info('Las cuentas de administrador no requieren actualización de suscripción');
      return;
    }

    setRefreshLoading(true);
    try {
      const { error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      toast.success('Estado de suscripción actualizado');
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast.error('No se pudo actualizar el estado');
    } finally {
      setRefreshLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Plan actual */}
      <Card>
        <CardHeader>
          <CardTitle>Tu Plan Actual</CardTitle>
          <CardDescription>
            Detalles de tu suscripción actual y beneficios incluidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`${config.bgColor} rounded-lg p-6 border-2`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center`}>
                  <PlanIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Plan {config.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${config.bgColor} ${config.textColor}`}>
                      {config.name}
                    </Badge>
                    {currentPlan === 'admin' && (
                      <Badge variant="destructive">Sin caducidad</Badge>
                    )}
                    {currentPlan !== 'admin' && profile?.subscription_status === 'active' && (
                      <Badge variant="default">Activo</Badge>
                    )}
                    {currentPlan !== 'admin' && profile?.subscription_status === 'trialing' && (
                      <Badge variant="secondary">Periodo de prueba</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Características incluidas:</h4>
              <ul className="space-y-2">
                {config.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {currentPlan === 'admin' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">
                  <strong>Cuenta de Administrador:</strong> Tienes acceso completo y permanente a todas las funcionalidades de farmapro.
                </p>
              </div>
            )}

            {currentPlan !== 'admin' && profile?.trial_ends_at && profile.subscription_status === 'trialing' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 text-sm">
                  <strong>Periodo de prueba activo</strong> - Termina el {formatDate(profile.trial_ends_at)}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={refreshSubscriptionStatus}
                disabled={refreshLoading || currentPlan === 'admin'}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshLoading ? 'animate-spin' : ''}`} />
                {refreshLoading ? 'Actualizando...' : 'Actualizar Estado'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendación y opciones de planes - Solo mostrar si no es admin */}
      {currentPlan !== 'admin' && (
        <>
          {/* Recomendación */}
          {currentPlan === 'freemium' && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      ¿Listo para dar el siguiente paso?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      El plan <strong>Profesional</strong> es el más equilibrado: acceso completo a formación, recursos ilimitados y comunidad activa.
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/planes" className="flex items-center gap-2">
                      Ver todos los planes
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentPlan === 'estudiante' && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Mejora tu experiencia
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Considera el plan <strong>Profesional</strong> para acceso ilimitado o <strong>Premium</strong> si necesitas funcionalidades de negocio.
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/planes" className="flex items-center gap-2">
                      Comparar planes
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sección de planes con tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Actualizar Suscripción</CardTitle>
              <CardDescription>
                Explora otros planes o gestiona tu equipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="individual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="individual" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Planes Individuales
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Plan de Equipo
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="individual" className="mt-6">
                  <SubscriptionPlans 
                    variant="compact" 
                    currentPlan={currentPlan}
                  />
                  <div className="mt-4 text-center">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/planes" className="flex items-center gap-2">
                        Ver comparativa completa
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="team" className="mt-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Gestiona las suscripciones de tu farmacia
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Facturación centralizada, descuentos por volumen y acceso Premium para todo tu equipo
                      </p>
                    </div>
                    <TeamPlanCard />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
