
import { useSystemSettings } from '@/hooks/useSystemSettings';

export const useConfigurationHandlers = () => {
  const { updateCategorySettings } = useSystemSettings();

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

  return {
    handlePlatformSave,
    handleUserSave,
    handleTechnicalSave,
    handleAnalyticsSave,
    handleRegionalSave,
    handleEmailTemplatesSave
  };
};
