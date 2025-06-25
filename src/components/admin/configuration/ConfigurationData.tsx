
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

  const getPlatformConfig = () => {
    const platformData = getSettingsByCategory('platform');
    return {
      company_info: platformData?.company_info || {
        name: "farmapro",
        description: "Portal de formación farmacéutica",
        contact_email: "info@farmapro.com"
      },
      email_config: platformData?.email_config || {
        smtp_host: "",
        smtp_port: 587,
        smtp_user: "",
        smtp_password: ""
      },
      notifications_config: platformData?.notifications_config || {
        email_enabled: true,
        push_enabled: false
      }
    };
  };

  const getUserConfig = () => {
    const usersData = getSettingsByCategory('users');
    return {
      registration_config: usersData?.registration_config || {
        email_verification: true,
        manual_moderation: false,
        required_fields: ["full_name", "pharmacy_name"]
      },
      subscription_limits: usersData?.subscription_limits || {
        freemium: { courses: 5, resources: 10 },
        estudiante: { courses: 10, resources: 25 },
        profesional: { courses: -1, resources: -1 },
        premium: { courses: -1, resources: -1 }
      },
      points_config: usersData?.points_config || {
        points_per_course: 10,
        points_per_resource: 5,
        level_threshold: 100
      }
    };
  };

  const getTechnicalConfig = () => {
    const technicalData = getSettingsByCategory('technical');
    return {
      file_config: technicalData?.file_config || {
        max_file_size: 10485760,
        allowed_extensions: ["pdf", "doc", "docx", "jpg", "png"]
      },
      security_config: technicalData?.security_config || {
        session_timeout: 3600,
        password_min_length: 8
      },
      integrations: technicalData?.integrations || {
        google_analytics_id: "",
        stripe_enabled: false
      }
    };
  };

  const getAnalyticsConfig = () => {
    const analyticsData = getSettingsByCategory('analytics');
    return {
      google_analytics: analyticsData?.google_analytics || {
        tracking_id: "",
        enabled: false
      },
      reports_config: analyticsData?.reports_config || {
        retention_days: 90,
        auto_reports: true
      }
    };
  };

  const getRegionalConfig = () => {
    const regionalData = getSettingsByCategory('regional');
    return {
      localization: regionalData?.localization || {
        default_language: "es",
        timezone: "Europe/Madrid",
        currency: "EUR"
      },
      legal_config: regionalData?.legal_config || {
        privacy_policy_url: "",
        terms_of_service_url: "",
        cookie_policy_url: ""
      }
    };
  };

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
