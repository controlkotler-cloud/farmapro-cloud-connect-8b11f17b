
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { PlatformSettings } from '@/components/admin/settings/PlatformSettings';
import { UserSettings } from '@/components/admin/settings/UserSettings';
import { TechnicalSettings } from '@/components/admin/settings/TechnicalSettings';
import { AnalyticsSettings } from '@/components/admin/settings/AnalyticsSettings';
import { RegionalSettings } from '@/components/admin/settings/RegionalSettings';
import { EmailTemplates } from '@/components/admin/settings/EmailTemplates';
import { Building2, Users, Settings, BarChart3, Globe, Mail } from 'lucide-react';

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

  const handleEmailTemplatesSave = async (config: any) => {
    await updateCategorySettings('email_templates', config);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración General</h1>
        <p className="text-gray-600">Ajustes del portal y configuraciones del sistema farmapro</p>
      </div>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
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
              subscription_limits: getSettingsByCategory('users')?.subscription_limits || {
                freemium: { courses: 5, resources: 10 },
                estudiante: { courses: 10, resources: 25 },
                profesional: { courses: -1, resources: -1 },
                premium: { courses: -1, resources: -1 }
              },
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

        <TabsContent value="email" className="space-y-6">
          <EmailTemplates
            config={getSettingsByCategory('email_templates') || {
              password_reset: {
                subject: "Restablecer tu contraseña de farmapro",
                content: "Hola {{user_name}},\n\nHas solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:\n\n{{reset_link}}\n\nSi no solicitaste este cambio, puedes ignorar este email.\n\nSaludos,\nEquipo {{company_name}}",
                variables: ["{{user_name}}", "{{reset_link}}", "{{company_name}}"]
              },
              welcome: {
                subject: "¡Bienvenido a farmapro!",
                content: "¡Hola {{user_name}}!\n\nBienvenido a {{company_name}}. Tu cuenta ha sido creada exitosamente.\n\nPuedes acceder a tu cuenta en: {{login_url}}\n\n¡Comienza a explorar nuestros cursos y recursos!\n\nSaludos,\nEquipo farmapro",
                variables: ["{{user_name}}", "{{company_name}}", "{{login_url}}"]
              },
              course_completion: {
                subject: "¡Felicidades! Has completado {{course_name}}",
                content: "¡Enhorabuena {{user_name}}!\n\nHas completado exitosamente el curso: {{course_name}}\n\nHas ganado {{points_earned}} puntos.\n\nDescarga tu certificado: {{certificate_url}}\n\nSigue aprendiendo con farmapro!\n\nSaludos,\nEquipo farmapro",
                variables: ["{{user_name}}", "{{course_name}}", "{{certificate_url}}", "{{points_earned}}"]
              },
              subscription_renewal: {
                subject: "Renovación de tu suscripción {{plan_name}}",
                content: "Hola {{user_name}},\n\nTu suscripción {{plan_name}} vence el {{renewal_date}}.\n\nRenueva tu suscripción para seguir disfrutando de todos los beneficios: {{renewal_url}}\n\nGracias por confiar en farmapro.\n\nSaludos,\nEquipo farmapro",
                variables: ["{{user_name}}", "{{plan_name}}", "{{renewal_date}}", "{{renewal_url}}"]
              },
              verification: {
                subject: "Verifica tu email en farmapro",
                content: "Hola {{user_name}},\n\nPor favor verifica tu dirección de email haciendo clic en el siguiente enlace:\n\n{{verification_link}}\n\nGracias por unirte a {{company_name}}.\n\nSaludos,\nEquipo farmapro",
                variables: ["{{user_name}}", "{{verification_link}}", "{{company_name}}"]
              }
            }}
            onSave={handleEmailTemplatesSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminConfiguracion;
