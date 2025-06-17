
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Subscription = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'plans') {
      setActiveTab('plans');
    }
  }, [searchParams]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Suscripción</h1>
        <p className="text-gray-600">Gestiona tu plan y explora nuestras opciones de suscripción</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="status">Mi Suscripción</TabsTrigger>
          <TabsTrigger value="plans">Cambiar Plan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-6">
          <SubscriptionStatus />
        </TabsContent>
        
        <TabsContent value="plans" className="space-y-6">
          <SubscriptionPlans />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Subscription;
