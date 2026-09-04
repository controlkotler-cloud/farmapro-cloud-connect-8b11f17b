import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Saldo de créditos de imagen de IAFarma, consultable SIN generar nada.
 *
 * Hasta ahora el saldo solo se conocía como efecto secundario de generar una
 * imagen (`useImageGeneration` lo devolvía en la respuesta), así que desde el
 * perfil era invisible: el usuario no sabía cuántos créditos le quedaban ni
 * podía decidir si comprar. La RPC `image_credit_status` resuelve la cuenta de
 * facturación (el titular en los planes de Equipo) y devuelve el estado entero.
 */
export interface ImageCreditStatus {
  /** Cuota mensual del plan. */
  monthLimit: number;
  monthUsed: number;
  /** Lo que queda de la cuota mensual (sin contar packs). */
  monthlyLeft: number;
  dayLimit: number;
  dayUsed: number;
  /** Créditos comprados en packs. No caducan. */
  packBalance: number;
  /** Cuota mensual restante + packs. El tope diario NO se descuenta aqui. */
  remaining: number;
  /** true si la bolsa es del titular y la comparte todo el equipo. */
  shared: boolean;
  period: string | null;
}

const toStatus = (raw: Record<string, unknown>): ImageCreditStatus => ({
  monthLimit: Number(raw.month_limit ?? 0),
  monthUsed: Number(raw.month_used ?? 0),
  monthlyLeft: Number(raw.monthly_left ?? 0),
  dayLimit: Number(raw.day_limit ?? 0),
  dayUsed: Number(raw.day_used ?? 0),
  packBalance: Number(raw.pack_balance ?? 0),
  remaining: Number(raw.remaining ?? 0),
  shared: Boolean(raw.shared),
  period: (raw.period as string | null) ?? null,
});

export const useImageCredits = (enabled = true) => {
  const [status, setStatus] = useState<ImageCreditStatus | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('image_credit_status');
    if (rpcError || !data) {
      setError(true);
      setStatus(null);
    } else {
      setError(false);
      setStatus(toStatus(data as Record<string, unknown>));
    }
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
};
