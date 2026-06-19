import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getAccessState,
  FREE_LIMITS,
  type AccessState,
} from '@/lib/plans';

/**
 * Estado de permisos del usuario (v1, en cliente).
 *
 * Derivado del perfil cargado por `useAuth`:
 *  - `subscription_role` decide si es de pago/admin.
 *  - `created_at` decide si el plan gratis sigue en periodo de prueba (≤30 días)
 *    o ya está bloqueado (>30 días).
 *
 * Devuelve el estado calculado por `getAccessState` y banderas cómodas, además
 * de la ruta de la página de Precios (`pricingPath`) para las llamadas a la
 * acción. El `navigate` se hace en cada componente (esto es un hook, no debe
 * navegar por sí mismo).
 */
export interface Entitlements {
  /** Estado bruto: 'paid' | 'free_trial' | 'free_locked'. */
  state: AccessState;
  /** Plan de pago o admin: acceso total. */
  isPaid: boolean;
  /** Plan gratis dentro de los primeros 30 días: acceso con límites. */
  isTrial: boolean;
  /** Plan gratis pasados 30 días: lo ve todo pero bloqueado. */
  isLocked: boolean;
  /** Límites del plan gratis (cursos, recursos, IA…). */
  limits: typeof FREE_LIMITS;
  /** Ruta de la página de Precios, para usar con navigate() en los componentes. */
  pricingPath: string;
}

const PRICING_PATH = '/precios';

export const useEntitlements = (): Entitlements => {
  const { profile } = useAuth();

  return useMemo(() => {
    const state = getAccessState(profile?.subscription_role, profile?.created_at);
    return {
      state,
      isPaid: state === 'paid',
      isTrial: state === 'free_trial',
      isLocked: state === 'free_locked',
      limits: FREE_LIMITS,
      pricingPath: PRICING_PATH,
    };
  }, [profile?.subscription_role, profile?.created_at]);
};
