import { useSystemSettings } from '@/hooks/useSystemSettings';

export const useSectionVisibility = () => {
  const { getSettingsByCategory, isLoading } = useSystemSettings();

  const getVisibilityConfig = () => {
    const visibilitySettings = getSettingsByCategory('section_visibility');
    
    return {
      empleo_visible: visibilitySettings.empleo_visible ?? false,
      farmacias_visible: visibilitySettings.farmacias_visible ?? false,
    };
  };

  const isEmpleoVisible = () => {
    const config = getVisibilityConfig();
    return config.empleo_visible;
  };

  const isFarmaciasVisible = () => {
    const config = getVisibilityConfig();
    return config.farmacias_visible;
  };

  return {
    isLoading,
    getVisibilityConfig,
    isEmpleoVisible,
    isFarmaciasVisible,
  };
};