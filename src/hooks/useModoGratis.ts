import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseModoGratis, type ModoGratis } from '@/lib/plans';

/**
 * Interruptor de la cuenta gratis permanente: `system_settings`
 * (category 'subscription', key 'modo_gratis') = 'permanente' | 'muro'.
 * Se lee igual que `validation_mode` (tabla system_settings, categoría
 * 'subscription'; la policy de SELECT para autenticados ya existe). Mientras
 * carga, si falla, o si la fila no existe, el modo es 'muro' (todo como hoy).
 * Se comparte caché con react-query: una sola consulta para toda la app.
 */
export const useModoGratis = (): { modo: ModoGratis; isLoading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ['system-settings', 'modo_gratis'],
    staleTime: 60_000,
    queryFn: async (): Promise<ModoGratis> => {
      const { data: row, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('category', 'subscription')
        .eq('key', 'modo_gratis')
        .maybeSingle();
      if (error) return 'muro';
      return parseModoGratis(row?.value);
    },
  });
  return { modo: data ?? 'muro', isLoading };
};
