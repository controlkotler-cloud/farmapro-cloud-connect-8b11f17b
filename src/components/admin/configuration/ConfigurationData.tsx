
import { useSystemSettings } from '@/hooks/useSystemSettings';

export const useConfigurationData = () => {
  const { getSettingsByCategory, isLoading } = useSystemSettings();

  const getEmailTemplatesConfig = () => {
    const emailTemplatesData = getSettingsByCategory('email_templates');
    
    return {
      password_reset: emailTemplatesData?.password_reset || {
        subject: "Restablecer tu contraseña de farmapro",
        content: "Hola {{user_name}},\n\nHas solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:\n\n{{reset_link}}\n\nSi no solicitaste este cambio, puedes ignorar este email.\n\nSaludos,\nEquipo {{company_name}}",
        variables: ["{{user_name}}", "{{reset_link}}", "{{company_name}}"]
      },
      welcome: emailTemplatesData?.welcome || {
        subject: "¡Bienvenido a farmapro!",
        content: "¡Hola {{user_name}}!\n\nBienvenido a {{company_name}}. Tu cuenta ha sido creada exitosamente.\n\nPuedes acceder a tu cuenta en: {{login_url}}\n\n¡Comienza a explorar nuestros cursos y recursos!\n\nSaludos,\nEquipo farmapro",
        variables: ["{{user_name}}", "{{company_name}}", "{{login_url}}"]
      },
      course_completion: emailTemplatesData?.course_completion || {
        subject: "¡Felicidades! Has completado {{course_name}}",
        content: "¡Enhorabuena {{user_name}}!\n\nHas completado exitosamente el curso: {{course_name}}\n\nHas ganado {{points_earned}} puntos.\n\nDescarga tu certificado: {{certificate_url}}\n\nSigue aprendiendo con farmapro!\n\nSaludos,\nEquipo farmapro",
        variables: ["{{user_name}}", "{{course_name}}", "{{certificate_url}}", "{{points_earned}}"]
      },
      subscription_renewal: emailTemplatesData?.subscription_renewal || {
        subject: "Renovación de tu suscripción {{plan_name}}",
        content: "Hola {{user_name}},\n\nTu suscripción {{plan_name}} vence el {{renewal_date}}.\n\nRenueva tu suscripción para seguir disfrutando de todos los beneficios: {{renewal_url}}\n\nGracias por confiar en farmapro.\n\nSaludos,\nEquipo farmapro",
        variables: ["{{user_name}}", "{{plan_name}}", "{{renewal_date}}", "{{renewal_url}}"]
      },
      verification: emailTemplatesData?.verification || {
        subject: "Verifica tu email en farmapro",
        content: "Hola {{user_name}},\n\nPor favor verifica tu dirección de email haciendo clic en el siguiente enlace:\n\n{{verification_link}}\n\nGracias por unirte a {{company_name}}.\n\nSaludos,\nEquipo farmapro",
        variables: ["{{user_name}}", "{{verification_link}}", "{{company_name}}"]
      }
    };
  };

  const getPlatformConfig = () => ({
    company_info: getSettingsByCategory('platform')?.company_info || {},
    email_config: getSettingsByCategory('platform')?.email_config || {},
    notifications_config: getSettingsByCategory('platform')?.notifications_config || {}
  });

  const getUserConfig = () => ({
    registration_config: getSettingsByCategory('users')?.registration_config || {},
    subscription_limits: getSettingsByCategory('users')?.subscription_limits || {
      freemium: { courses: 5, resources: 10 },
      estudiante: { courses: 10, resources: 25 },
      profesional: { courses: -1, resources: -1 },
      premium: { courses: -1, resources: -1 }
    },
    points_config: getSettingsByCategory('users')?.points_config || {}
  });

  const getTechnicalConfig = () => ({
    file_config: getSettingsByCategory('technical')?.file_config || {},
    security_config: getSettingsByCategory('technical')?.security_config || {},
    integrations: getSettingsByCategory('technical')?.integrations || {}
  });

  const getAnalyticsConfig = () => ({
    google_analytics: getSettingsByCategory('analytics')?.google_analytics || {},
    reports_config: getSettingsByCategory('analytics')?.reports_config || {}
  });

  const getRegionalConfig = () => ({
    localization: getSettingsByCategory('regional')?.localization || {},
    legal_config: getSettingsByCategory('regional')?.legal_config || {}
  });

  return {
    isLoading,
    getEmailTemplatesConfig,
    getPlatformConfig,
    getUserConfig,
    getTechnicalConfig,
    getAnalyticsConfig,
    getRegionalConfig
  };
};
