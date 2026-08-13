import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getLaunchStatus, type LaunchStatus } from '@/lib/plans';

/**
 * Estado del lanzamiento leyendo el recuento REAL de plazas fundador
 * (vista pública `founder_count`). Si la consulta falla, cae al respaldo de
 * `LAUNCH.spotsTaken`: nunca debe romper la página de Precios.
 */
export function useLaunchStatus(): { launch: LaunchStatus; isLoading: boolean } {
  const [launch, setLaunch] = useState<LaunchStatus>(() => getLaunchStatus());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('founder_count')
          .select('spots_taken')
          .maybeSingle();
        if (cancelled) return;
        if (error || data?.spots_taken == null) {
          setLaunch(getLaunchStatus());
        } else {
          setLaunch(getLaunchStatus(Number(data.spots_taken)));
        }
      } catch {
        if (!cancelled) setLaunch(getLaunchStatus());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { launch, isLoading };
}
