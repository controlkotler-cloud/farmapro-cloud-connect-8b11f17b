
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, GraduationCap, Briefcase, Sparkles, Settings, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const planConfig = {
  freemium: {
    name: 'Freemium',
    icon: Sparkles,
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
  estudiante: {
    name: 'Estudiante',
    icon: GraduationCap,
    color: 'from-green-400 to-blue-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  profesional: {
    name: 'Profesional',
    icon: Briefcase,
    color: 'from-blue-500 to-purple-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  premium: {
    name: 'Premium',
    icon: Crown,
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
};

export const SubscriptionStatus = () => {
  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const { profile, signOut } = useAuth();

  const currentPlan = profile?.subscription_role || 'freemium';
  const config = planConfig[currentPlan as keyof typeof planConfig];
  const Icon = config.icon;

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      // Open customer portal in a new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Abriendo portal de cliente",
        description: "Se ha abierto una nueva pestaña para gestionar tu suscripción",
      });
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "No se pudo abrir el portal de gestión. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscriptionStatus = async () => {
    setRefreshLoading(true);
    try {
      const { error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      toast({
        title: "Estado actualizado",
        description: "Tu estado de suscripción ha sido actualizado",
      });
      
      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado. Inténtalo de nuevo.",
        variant: "destructive",
      });
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden">
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
        
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Plan Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Badge variant={profile?.subscription_status === 'active' ? 'default' : 'secondary'}>
                      {profile?.subscription_status === 'active' ? 'Activo' : 
                       profile?.subscription_status === 'trialing' ? 'Periodo de prueba' : 'Inactivo'}
                    </Badge>
                  </p>
                  {profile?.trial_ends_at && profile.subscription_status === 'trialing' && (
                    <p className="text-gray-600">
                      <span className="font-medium">Prueba termina:</span>{' '}
                      {formatDate(profile.trial_ends_at)}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Información de Usuario
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {profile?.email}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Nombre:</span> {profile?.full_name || 'No especificado'}
                  </p>
                  {profile?.pharmacy_name && (
                    <p className="text-gray-600">
                      <span className="font-medium">Farmacia:</span> {profile.pharmacy_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
              <Button 
                onClick={handleManageSubscription}
                disabled={loading || currentPlan === 'freemium'}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {loading ? 'Abriendo...' : 'Gestionar Suscripción'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={refreshSubscriptionStatus}
                disabled={refreshLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshLoading ? 'animate-spin' : ''}`} />
                {refreshLoading ? 'Actualizando...' : 'Actualizar Estado'}
              </Button>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>¿Necesitas ayuda?</strong> Usa el botón "Gestionar Suscripción" para cambiar tu plan, 
                actualizar el método de pago, descargar facturas o cancelar tu suscripción a través del portal seguro de Stripe.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
