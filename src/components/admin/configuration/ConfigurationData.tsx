
import { useSystemSettings } from '@/hooks/useSystemSettings';

export const useConfigurationData = () => {
  const { getSettingsByCategory, isLoading } = useSystemSettings();

  const getVisibilityConfig = () => {
    const visibilitySettings = getSettingsByCategory('section_visibility');

    return {
      empleo_visible: visibilitySettings.empleo_visible ?? false,
      farmacias_visible: visibilitySettings.farmacias_visible ?? false,
    };
  };

  return {
    isLoading,
    getVisibilityConfig
  };
};
