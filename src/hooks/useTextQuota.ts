import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Cupo de textos de IAFarma, consultable SIN generar nada.
 *
 * Hasta el 08-09-2026 el cliente solo conocía los textos que le quedaban por
 * la cabecera `x-iafarma-texts-remaining` de la propia generación: al entrar
 * en IAFarma no había contador y, con el cupo agotado, la única señal era un
 * error rojo al pulsar Generar (lo vio Francesc con una cuenta free). La RPC
 * `check_text_quota` es la misma que usa la edge `ai-creative-assistant`, así
 * que lo que se muestra aquí es exactamente lo que se aplicará al generar.
 */
export interface TextQuotaStatus {
  allowed: boolean;
  /** 'day' | 'month' cuando no se permite; null si hay cupo. */
  reason: 'day' | 'month' | null;
  dayUsed: number;
  dayLimit: number;
  monthUsed: number;
  monthLimit: number;
  /** Textos que quedan este mes (sin descontar el tope diario). */
  monthlyLeft: number;
}

const toStatus = (raw: Record<string, unknown>): TextQuotaStatus => {
  const monthUsed = Number(raw.month_used ?? 0);
  const monthLimit = Number(raw.month_limit ?? 0);
  return {
    allowed: Boolean(raw.allowed),
    reason: (raw.reason as 'day' | 'month' | null) ?? null,
    dayUsed: Number(raw.day_used ?? 0),
    dayLimit: Number(raw.day_limit ?? 0),
    monthUsed,
    monthLimit,
    monthlyLeft: Math.max(monthLimit - monthUsed, 0),
  };
};

export const useTextQuota = (enabled = true) => {
  const [status, setStatus] = useState<TextQuotaStatus | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('check_text_quota');
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
