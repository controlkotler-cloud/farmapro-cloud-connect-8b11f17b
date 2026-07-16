
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, User, CreditCard, Bell, Shield, Award } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { PersonalInfoTab } from '@/components/profile/PersonalInfoTab';
import { PlanTab } from '@/components/profile/PlanTab';
import { BillingTab } from '@/components/profile/BillingTab';
import { SecurityTab } from '@/components/profile/SecurityTab';
import { NotificationsTab } from '@/components/profile/NotificationsTab';
import { BadgesTab } from '@/components/profile/BadgesTab';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';

export default function Perfil() {
  const { profile, user, isAdmin, reloadProfile } = useAuth();
  const { isTeamOwner, isTeamMember, loading: teamLoading } = useTeamManagement();
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState('personal');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Show loading state if profile is not loaded yet
  if (!profile && !user) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl animate-pulse space-y-6">
          <div className="h-10 w-64 rounded bg-muted" />
          <div className="h-96 rounded bg-muted" />
        </div>
      </div>
    );
  }

  // Miembro de equipo sin suscripción propia: la facturación la lleva el titular.
  const hideBilling = isTeamMember && !isTeamOwner && !profile?.stripe_customer_id;

  const tabOptions = [
    { value: 'personal', label: 'Personal', icon: User },
    { value: 'plan', label: 'Plan', icon: Crown },
    { value: 'badges', label: 'Insignias', icon: Award },
    ...(hideBilling ? [] : [{ value: 'billing', label: 'Facturación', icon: CreditCard }]),
    { value: 'security', label: 'Seguridad', icon: Shield },
    { value: 'notifications', label: 'Notificaciones', icon: Bell },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3 md:mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
            <User className="h-6 w-6 text-brand-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
              Mi perfil
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tu información personal y la configuración de tu cuenta
            </p>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 md:space-y-6">
          {isMobile ? (
            <div className="w-full">
              <Select value={selectedTab} onValueChange={setSelectedTab}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(() => {
                      const currentTab = tabOptions.find(tab => tab.value === selectedTab);
                      if (currentTab) {
                        const IconComponent = currentTab.icon;
                        return (
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {currentTab.label}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tabOptions.map((tab) => (
                    <SelectItem key={tab.value} value={tab.value}>
                      <div className="flex items-center gap-2">
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <TabsList className={`grid w-full`} style={{ gridTemplateColumns: `repeat(${tabOptions.length}, minmax(0, 1fr))` }}>
              {tabOptions.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          <TabsContent value="personal" className="space-y-6">
            <PersonalInfoTab profile={profile} user={user} />
          </TabsContent>

          <TabsContent value="plan" className="space-y-6">
            <PlanTab profile={profile} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="badges" className="space-y-6">
            <BadgesTab />
          </TabsContent>

          {!hideBilling && (
            <TabsContent value="billing" className="space-y-6">
              <BillingTab profile={profile} isAdmin={isAdmin} />
            </TabsContent>
          )}

          <TabsContent value="security" className="space-y-6">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationsTab />
          </TabsContent>
        </Tabs>

        {/* Repetir tour */}
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              if (user) {
                const { error } = await supabase
                  .from('profiles')
                  .update({ has_completed_onboarding: false } as any)
                  .eq('id', user.id);
                if (error) {
                  toast.error('No se pudo reiniciar el tour.');
                  return;
                }
                await reloadProfile();
                toast.success('Tour reiniciado. Vuelve al Dashboard para verlo.');
              }
            }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Repetir tour de bienvenida
          </button>
        </div>
      </div>
    </div>
  );
}
