
import { useEffect } from 'react';
import { SectionVisibilitySettings } from '@/components/admin/settings/SectionVisibilitySettings';
import { ConfigurationLoading } from '@/components/admin/configuration/ConfigurationLoading';
import { useConfigurationData } from '@/components/admin/configuration/ConfigurationData';
import { useConfigurationHandlers } from '@/components/admin/configuration/ConfigurationHandlers';

const AdminConfiguracion = () => {
  const { isLoading, getVisibilityConfig } = useConfigurationData();
  const { handleVisibilitySave } = useConfigurationHandlers();

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return <ConfigurationLoading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">Configuración General</h1>
        <p className="text-muted-foreground">Qué secciones son visibles para los usuarios del portal</p>
      </div>

      <SectionVisibilitySettings
        config={getVisibilityConfig()}
        onSave={handleVisibilitySave}
      />
    </div>
  );
};

export default AdminConfiguracion;
