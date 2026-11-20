import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Interruptor del alta guiada de IAFarma: `system_settings`
 * (category 'iafarma', key 'alta_guiada_activa'). Mientras carga, si falla o
 * si la fila no existe, está apagado (el generador funciona como hoy).
 */
export const useAltaGuiadaActiva = (): { activa: boolean; isLoading: boolean } => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['system-settings', 'alta_guiada_activa', user?.id ?? null],
    staleTime: 60_000,
    queryFn: async (): Promise<boolean> => {
      const { data: row, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('category', 'iafarma')
        .eq('key', 'alta_guiada_activa')
        .maybeSingle();
      if (error) return false;
      return row?.value === true || row?.value === 'true';
    },
  });
  return { activa: data ?? false, isLoading };
};
