
import { ConfigurationTabs } from '@/components/admin/configuration/ConfigurationTabs';
import { ConfigurationLoading } from '@/components/admin/configuration/ConfigurationLoading';
import { useConfigurationData } from '@/components/admin/configuration/ConfigurationData';
import { useConfigurationHandlers } from '@/components/admin/configuration/ConfigurationHandlers';

const AdminConfiguracion = () => {
  const {
    isLoading,
    getEmailTemplatesConfig,
    getPlatformConfig,
    getUserConfig,
    getTechnicalConfig,
    getAnalyticsConfig,
    getRegionalConfig
  } = useConfigurationData();

  const {
    handlePlatformSave,
    handleUserSave,
    handleTechnicalSave,
    handleAnalyticsSave,
    handleRegionalSave,
    handleEmailTemplatesSave
  } = useConfigurationHandlers();

  if (isLoading) {
    return <ConfigurationLoading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración General</h1>
        <p className="text-gray-600">Ajustes del portal y configuraciones del sistema farmapro</p>
      </div>

      <ConfigurationTabs
        platformConfig={getPlatformConfig()}
        userConfig={getUserConfig()}
        technicalConfig={getTechnicalConfig()}
        analyticsConfig={getAnalyticsConfig()}
        regionalConfig={getRegionalConfig()}
        emailConfig={getEmailTemplatesConfig()}
        onPlatformSave={handlePlatformSave}
        onUserSave={handleUserSave}
        onTechnicalSave={handleTechnicalSave}
        onAnalyticsSave={handleAnalyticsSave}
        onRegionalSave={handleRegionalSave}
        onEmailTemplatesSave={handleEmailTemplatesSave}
      />
    </div>
  );
};

export default AdminConfiguracion;
