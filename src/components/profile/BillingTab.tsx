
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROLE_LABELS } from '@/lib/plans';

interface BillingTabProps {
  profile: any;
  isAdmin: boolean;
}

export const BillingTab = ({ profile, isAdmin }: BillingTabProps) => {
  const [managementLoading, setManagementLoading] = useState(false);

  const getCurrentPlan = () => {
    if (isAdmin) return 'admin';
    return profile?.subscription_role || 'freemium';
  };

  const currentPlan = getCurrentPlan();
  const planName = ROLE_LABELS[currentPlan] ?? 'Gratis';

  const handleManageSubscription = async () => {
    if (currentPlan === 'freemium') {
      toast.error('Necesitas tener una suscripción activa para acceder al portal de facturación');
      return;
    }

    setManagementLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      window.open(data.url, '_blank');
      
      toast.success('Abriendo portal de cliente');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('No se pudo abrir el portal de gestión');
    } finally {
      setManagementLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de Facturación</CardTitle>
        <CardDescription>
          Gestiona tu información de pago, métodos de pago y historial de facturas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Estado de Cuenta</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado actual:</span>
                  <Badge variant={currentPlan === 'admin' ? 'destructive' : profile?.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {currentPlan === 'admin' ? ROLE_LABELS.admin :
                     profile?.subscription_status === 'active' ? 'Activo' : 
                     profile?.subscription_status === 'trialing' ? 'Periodo de prueba' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan:</span>
                  <span className="text-sm font-medium">{planName}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Próxima Facturación</h4>
              <p className="text-sm text-muted-foreground">
                {currentPlan === 'freemium'
                  ? 'No tienes una suscripción activa' 
                  : currentPlan === 'admin'
                  ? 'Sin facturación - Cuenta administrativa'
                  : 'Tu próxima facturación será procesada automáticamente'
                }
              </p>
            </div>
          </div>

          {(currentPlan === 'freemium' || currentPlan === 'admin') && (
            <div className={`${currentPlan === 'admin' ? 'bg-info/10 border-info/30' : 'bg-warning/10 border-warning/30'} border rounded-lg p-4 mb-4`}>
              <p className={`${currentPlan === 'admin' ? 'text-info' : 'text-warning'} text-sm`}>
                <strong>{currentPlan === 'admin' ? 'Cuenta de administrador:' : 'Plan Gratuito:'}</strong> 
                {currentPlan === 'admin' 
                  ? ' Como administrador, tienes acceso completo al sistema sin necesidad de suscripción ni facturación.'
                  : ' Para acceder a la gestión de pagos y facturas, necesitas suscribirte a uno de nuestros planes de pago. Ve a la pestaña "Plan" para explorar las opciones disponibles.'
                }
              </p>
            </div>
          )}

          {currentPlan !== 'admin' && (
            <div className="space-y-4">
              <Button
                onClick={handleManageSubscription}
                disabled={managementLoading}
                className="flex items-center gap-2 w-full rounded-full"
              >
                <Settings className="h-4 w-4" />
                {managementLoading ? 'Abriendo...' : 'Gestionar o cancelar mi suscripción'}
              </Button>

            </div>
          )}

          {currentPlan !== 'admin' && (
            <div className="bg-info/10 border border-info/30 rounded-lg p-4">
              <p className="text-sm text-info">
                <strong>Qué hay detrás del botón:</strong> el portal seguro de Stripe, donde
                puedes cambiar la tarjeta, actualizar tus datos fiscales o cancelar la
                suscripción cuando quieras. La cancelación se hace efectiva al final del
                periodo que ya tienes pagado; hasta entonces conservas el acceso.
                <br />
                <strong>Tus facturas</strong> te llegan por email cada vez que se cobra la
                suscripción, con tu NIF y tu dirección fiscal.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
