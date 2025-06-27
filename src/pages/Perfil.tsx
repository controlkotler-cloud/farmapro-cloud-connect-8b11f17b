
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, User, CreditCard, Bell, Shield, Users } from 'lucide-react';
import { PersonalInfoTab } from '@/components/profile/PersonalInfoTab';
import { PlanTab } from '@/components/profile/PlanTab';
import { BillingTab } from '@/components/profile/BillingTab';
import { SecurityTab } from '@/components/profile/SecurityTab';
import { NotificationsTab } from '@/components/profile/NotificationsTab';
import { TeamManagementTab } from '@/components/profile/TeamManagementTab';
import { useTeamManagement } from '@/hooks/useTeamManagement';

export default function Perfil() {
  const { profile, user, isAdmin } = useAuth();
  const { isTeamOwner, loading: teamLoading } = useTeamManagement();

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">Gestiona tu información personal y configuración de cuenta</p>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className={`grid w-full ${isTeamOwner ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Plan
            </TabsTrigger>
            {isTeamOwner && !teamLoading && (
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Equipo
              </TabsTrigger>
            )}
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Facturación
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
          </TabsList>

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
      </div>
    </div>
  );
}
