
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { PlatformSettings } from '@/components/admin/settings/PlatformSettings';
import { UserSettings } from '@/components/admin/settings/UserSettings';
import { TechnicalSettings } from '@/components/admin/settings/TechnicalSettings';
import { AnalyticsSettings } from '@/components/admin/settings/AnalyticsSettings';
import { RegionalSettings } from '@/components/admin/settings/RegionalSettings';
import { Building2, Users, Settings, BarChart3, Globe } from 'lucide-react';

const AdminConfiguracion = () => {
  const { 
    getSettingsByCategory, 
    updateCategorySettings, 
    isLoading 
  } = useSystemSettings();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración General</h1>
          <p className="text-gray-600">Ajustes del portal y configuraciones del sistema</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const handlePlatformSave = async (config: any) => {
    await updateCategorySettings('platform', {
      company_info: config.company_info,
      email_config: config.email_config,
      notifications_config: config.notifications_config
    });
  };

  const handleUserSave = async (config: any) => {
    await updateCategorySettings('users', {
      registration_config: config.registration_config,
      subscription_limits: config.subscription_limits,
      points_config: config.points_config
    });
  };

  const handleTechnicalSave = async (config: any) => {
    await updateCategorySettings('technical', {
      file_config: config.file_config,
      security_config: config.security_config,
      integrations: config.integrations
    });
  };

  const handleAnalyticsSave = async (config: any) => {
    await updateCategorySettings('analytics', {
      google_analytics: config.google_analytics,
      reports_config: config.reports_config
    });
  };

  const handleRegionalSave = async (config: any) => {
    await updateCategorySettings('regional', {
      localization: config.localization,
      legal_config: config.legal_config
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración General</h1>
        <p className="text-gray-600">Ajustes del portal y configuraciones del sistema farmapro</p>
      </div>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="platform" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Plataforma</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Técnica</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Análisis</span>
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Regional</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-6">
          <PlatformSettings
            config={{
              company_info: getSettingsByCategory('platform')?.company_info || {},
              email_config: getSettingsByCategory('platform')?.email_config || {},
              notifications_config: getSettingsByCategory('platform')?.notifications_config || {}
            }}
            onSave={handlePlatformSave}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserSettings
            config={{
              registration_config: getSettingsByCategory('users')?.registration_config || {},
              subscription_limits: getSettingsByCategory('users')?.subscription_limits || {},
              points_config: getSettingsByCategory('users')?.points_config || {}
            }}
            onSave={handleUserSave}
          />
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <TechnicalSettings
            config={{
              file_config: getSettingsByCategory('technical')?.file_config || {},
              security_config: getSettingsByCategory('technical')?.security_config || {},
              integrations: getSettingsByCategory('technical')?.integrations || {}
            }}
            onSave={handleTechnicalSave}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsSettings
            config={{
              google_analytics: getSettingsByCategory('analytics')?.google_analytics || {},
              reports_config: getSettingsByCategory('analytics')?.reports_config || {}
            }}
            onSave={handleAnalyticsSave}
          />
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <RegionalSettings
            config={{
              localization: getSettingsByCategory('regional')?.localization || {},
              legal_config: getSettingsByCategory('regional')?.legal_config || {}
            }}
            onSave={handleRegionalSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminConfiguracion;
