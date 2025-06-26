
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { planConfig } from '@/components/profile/config/PlanConfig';

interface BillingTabProps {
  profile: any;
  isAdmin: boolean;
}

export const BillingTab = ({ profile, isAdmin }: BillingTabProps) => {
  const [managementLoading, setManagementLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const getCurrentPlan = () => {
    if (isAdmin) return 'admin';
    return profile?.subscription_role || 'freemium';
  };

  const currentPlan = getCurrentPlan();
  const config = planConfig[currentPlan as keyof typeof planConfig] || planConfig.freemium;

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

  const handleViewInvoices = async () => {
    if (currentPlan === 'freemium') {
      toast.error('Necesitas tener una suscripción activa para ver el historial de facturas');
      return;
    }

    setInvoiceLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      window.open(data.url, '_blank');
      
      toast.success('Abriendo historial de facturas');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('No se pudo abrir el historial de facturas');
    } finally {
      setInvoiceLoading(false);
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
                  <span className="text-sm text-gray-600">Estado actual:</span>
                  <Badge variant={currentPlan === 'admin' ? 'destructive' : profile?.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {currentPlan === 'admin' ? 'Administrador' :
                     profile?.subscription_status === 'active' ? 'Activo' : 
                     profile?.subscription_status === 'trialing' ? 'Periodo de prueba' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plan:</span>
                  <span className="text-sm font-medium">{config.name}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Próxima Facturación</h4>
              <p className="text-sm text-gray-600">
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
            <div className={`${currentPlan === 'admin' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4 mb-4`}>
              <p className={`${currentPlan === 'admin' ? 'text-red-800' : 'text-yellow-800'} text-sm`}>
                <strong>{currentPlan === 'admin' ? 'Cuenta de Administrador:' : 'Plan Gratuito:'}</strong> 
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
                className="flex items-center gap-2 w-full"
              >
                <Settings className="h-4 w-4" />
                {managementLoading ? 'Abriendo...' : 'Gestionar Método de Pago'}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleViewInvoices}
                disabled={invoiceLoading}
              >
                <FileText className="h-4 w-4 mr-2" />
                {invoiceLoading ? 'Abriendo...' : 'Ver Historial de Facturas'}
              </Button>
            </div>
          )}

          {currentPlan !== 'admin' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Gestión de pagos:</strong> Ambos botones te llevarán al portal seguro de Stripe donde podrás 
                gestionar tu método de pago, ver y descargar facturas, y administrar tu suscripción.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
