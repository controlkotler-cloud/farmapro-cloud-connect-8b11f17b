
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { lanzarDescarga, urlFirmada } from '@/lib/descargas';
import type { DownloadableResource } from '@/types/course';

interface ModuleResourcesSectionProps {
  resources: DownloadableResource[];
}

/**
 * Bloque "Recursos descargables" de un módulo. Cuando el módulo trae el
 * `resource_id`, la descarga se registra en `resource_downloads` como en
 * /recursos para que cuente en retos e insignias. No aplica el tope del plan
 * gratis a propósito: el usuario ya está dentro de la píldora y el descargable
 * forma parte de la lección (decisión 09-09-2026).
 *
 * Desde el 16-09-2026 el fichero NO se sirve por enlace directo. Antes era
 * `<a href={resource.url} download>` contra `public/recursos/`, es decir el
 * mismo agujero que se cerró en /recursos: el CDN entrega el fichero sin que
 * React, la sesión ni RLS lleguen a existir. Ahora se firma contra el bucket
 * privado en el momento del clic. Los `url` del JSONB de los cursos siguen
 * siendo `/recursos/<fichero>` y NO hay que migrarlos: `refDeStorage` los
 * traduce al bucket. La ruta /curso/:slug está bajo ProtectedRoute, así que
 * aquí siempre hay sesión y la firma no puede fallar por falta de cuenta.
 */
export const ModuleResourcesSection = ({ resources }: ModuleResourcesSectionProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [bajando, setBajando] = useState<string | null>(null);

  const registerDownload = (resource: DownloadableResource) => {
    if (!profile?.id || !resource.resource_id) return;
    supabase
      .from('resource_downloads')
      .insert([{ user_id: profile.id, resource_id: resource.resource_id, downloaded_at: new Date().toISOString() }])
      .then(({ error }) => { if (error) console.error('Error registrando descarga:', error); });
    import('@/utils/challengeUtils')
      .then(({ updateChallengeProgress }) => updateChallengeProgress(profile.id, 'resource_downloaded', 1))
      .catch((e) => console.error('Error progreso reto:', e));
  };

  const descargar = async (resource: DownloadableResource) => {
    setBajando(resource.url);
    const win = window.open('', '_blank');
    const ok = await lanzarDescarga(() => urlFirmada(resource.url), win);
    setBajando(null);
    if (ok) {
      registerDownload(resource);
    } else {
      toast({
        title: 'No se ha podido preparar la descarga',
        description: 'Vuelve a intentarlo en unos segundos.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-soft rounded-lg">
          <Download className="h-5 w-5 text-brand-dark" />
        </div>
        <h4 className="text-lg font-semibold text-foreground">
          Recursos descargables
        </h4>
      </div>
      <div className="bg-brand-soft rounded-lg p-6 border border-brand/20">
        <div className="grid gap-4">
          {resources.map((resource, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-brand/20 shadow-sm hover:shadow-lift transition-shadow">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="flex-shrink-0 p-2 bg-brand-soft rounded-lg">
                    <Download className="h-5 w-5 text-brand-dark" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {resource.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">Formato:</span>
                      <Badge variant="outline" className="text-xs uppercase">
                        {resource.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 flex items-center gap-2"
                  disabled={bajando === resource.url}
                  onClick={() => void descargar(resource)}
                >
                  <Download className="h-4 w-4" />
                  {bajando === resource.url ? 'Preparando...' : 'Descargar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
