import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Settings, BarChart3, Globe, Mail, CreditCard } from 'lucide-react';
import { PlatformSettings } from '@/components/admin/settings/PlatformSettings';
import { UserSettings } from '@/components/admin/settings/UserSettings';
import { TechnicalSettings } from '@/components/admin/settings/TechnicalSettings';
import { AnalyticsSettings } from '@/components/admin/settings/AnalyticsSettings';
import { RegionalSettings } from '@/components/admin/settings/RegionalSettings';
import { EmailTemplates } from '@/components/admin/settings/EmailTemplates';
import { SubscriptionSettings } from '@/components/admin/settings/SubscriptionSettings';

interface ConfigurationTabsProps {
  platformConfig: any;
  userConfig: any;
  technicalConfig: any;
  analyticsConfig: any;
  regionalConfig: any;
  emailConfig: any;
  onPlatformSave: (config: any) => Promise<void>;
  onUserSave: (config: any) => Promise<void>;
  onTechnicalSave: (config: any) => Promise<void>;
  onAnalyticsSave: (config: any) => Promise<void>;
  onRegionalSave: (config: any) => Promise<void>;
  onEmailTemplatesSave: (config: any) => Promise<void>;
}

export const ConfigurationTabs = ({
  platformConfig,
  userConfig,
  technicalConfig,
  analyticsConfig,
  regionalConfig,
  emailConfig,
  onPlatformSave,
  onUserSave,
  onTechnicalSave,
  onAnalyticsSave,
  onRegionalSave,
  onEmailTemplatesSave
}: ConfigurationTabsProps) => {
  return (
    <Tabs defaultValue="platform" className="space-y-6">
      <TabsList className="grid w-full grid-cols-7">
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
        <TabsTrigger value="email" className="flex items-center space-x-2">
          <Mail className="h-4 w-4" />
          <span className="hidden sm:inline">Emails</span>
        </TabsTrigger>
        <TabsTrigger value="subscription" className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Planes</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="platform" className="space-y-6">
        <PlatformSettings
          config={platformConfig}
          onSave={onPlatformSave}
        />
      </TabsContent>

      <TabsContent value="users" className="space-y-6">
        <UserSettings
          config={userConfig}
          onSave={onUserSave}
        />
      </TabsContent>

      <TabsContent value="technical" className="space-y-6">
        <TechnicalSettings
          config={technicalConfig}
          onSave={onTechnicalSave}
        />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <AnalyticsSettings
          config={analyticsConfig}
          onSave={onAnalyticsSave}
        />
      </TabsContent>

      <TabsContent value="regional" className="space-y-6">
        <RegionalSettings
          config={regionalConfig}
          onSave={onRegionalSave}
        />
      </TabsContent>

      <TabsContent value="email" className="space-y-6">
        <EmailTemplates
          config={emailConfig}
          onSave={onEmailTemplatesSave}
        />
      </TabsContent>

      <TabsContent value="subscription" className="space-y-6">
        <SubscriptionSettings />
      </TabsContent>
    </Tabs>
  );
};