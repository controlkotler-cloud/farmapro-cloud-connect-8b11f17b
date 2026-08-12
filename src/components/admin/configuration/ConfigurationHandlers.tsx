
import { useSystemSettings } from '@/hooks/useSystemSettings';

export const useConfigurationHandlers = () => {
  const { updateCategorySettings } = useSystemSettings();

  const handleVisibilitySave = async (config: any) => {
    await updateCategorySettings('section_visibility', {
      empleo_visible: config.empleo_visible,
      farmacias_visible: config.farmacias_visible
    });
  };

  return {
    handleVisibilitySave
  };
};
