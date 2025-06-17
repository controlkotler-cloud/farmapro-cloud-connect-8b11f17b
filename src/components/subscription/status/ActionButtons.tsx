
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PlanType } from './PlanConfig';

interface ActionButtonsProps {
  currentPlan: PlanType;
}

export const ActionButtons = ({ currentPlan }: ActionButtonsProps) => {
  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

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

  return (
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
  );
};
