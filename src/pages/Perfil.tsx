
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, User, CreditCard, Bell, Shield, Users, Award } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { PersonalInfoTab } from '@/components/profile/PersonalInfoTab';
import { PlanTab } from '@/components/profile/PlanTab';
import { BillingTab } from '@/components/profile/BillingTab';
import { SecurityTab } from '@/components/profile/SecurityTab';
import { NotificationsTab } from '@/components/profile/NotificationsTab';
import { TeamManagementTab } from '@/components/profile/TeamManagementTab';
import { BadgesTab } from '@/components/profile/BadgesTab';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';

export default function Perfil() {
  const { profile, user, isAdmin } = useAuth();
  const { isTeamOwner, loading: teamLoading } = useTeamManagement();
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState('personal');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Show loading state if profile is not loaded yet
  if (!profile && !user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabOptions = [
    { value: 'personal', label: 'Personal', icon: User },
    { value: 'plan', label: 'Plan', icon: Crown },
    ...(isTeamOwner && !teamLoading ? [{ value: 'team', label: 'Equipo', icon: Users }] : []),
    { value: 'badges', label: 'Insignias', icon: Award },
    { value: 'billing', label: 'Facturación', icon: CreditCard },
    { value: 'security', label: 'Seguridad', icon: Shield },
    { value: 'notifications', label: 'Notificaciones', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">Gestiona tu información personal y configuración de cuenta</p>
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
            <TabsList className={`grid w-full ${isTeamOwner ? 'grid-cols-6' : 'grid-cols-5'}`}>
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

          {isTeamOwner && (
            <TabsContent value="team" className="space-y-6">
              <TeamManagementTab />
            </TabsContent>
          )}

          <TabsContent value="billing" className="space-y-6">
            <BillingTab profile={profile} isAdmin={isAdmin} />
          </TabsContent>

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
                await supabase
                  .from('profiles')
                  .update({ has_completed_onboarding: false } as any)
                  .eq('id', user.id);
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
