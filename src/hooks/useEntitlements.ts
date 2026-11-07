import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useModoGratis } from '@/hooks/useModoGratis';
import {
  getAccessState,
  getTrialDaysLeft,
  FREE_LIMITS,
  type AccessState,
  type ModoGratis,
} from '@/lib/plans';

/**
 * Estado de permisos del usuario (v1, en cliente).
 *
 * Derivado del perfil cargado por `useAuth`:
 *  - `subscription_role` decide si es de pago/admin.
 *  - `created_at` (+30 días) y `trial_ends_at` (concesión o ampliación) deciden
 *    si el plan gratis sigue en periodo de prueba o ya está bloqueado.
 *
 * Devuelve el estado calculado por `getAccessState` y banderas cómodas, además
 * de la ruta de la página de Precios (`pricingPath`) para las llamadas a la
 * acción. El `navigate` se hace en cada componente (esto es un hook, no debe
 * navegar por sí mismo).
 */
export interface Entitlements {
  /** Estado bruto: 'paid' | 'free_trial' | 'gratis' | 'free_locked'. */
  state: AccessState;
  /** Plan de pago o admin: acceso total. */
  isPaid: boolean;
  /** Plan gratis dentro de los primeros 30 días: acceso con límites. */
  isTrial: boolean;
  /** Prueba terminada con modo 'muro' (el de siempre): bloqueado. */
  isLocked: boolean;
  /** Cuenta gratis permanente (prueba terminada con modo 'permanente'). */
  isGratis: boolean;
  /** Prueba terminada, sea cual sea el modo (muro o gratis permanente). */
  isRestricted: boolean;
  /** Modo del interruptor `subscription.modo_gratis`. */
  modo: ModoGratis;
  /** Días de prueba que quedan (solo en 'free_trial'; null en el resto). */
  trialDaysLeft: number | null;
  /** Límites del plan gratis (cursos, recursos, IA…). */
  limits: typeof FREE_LIMITS;
  /** Ruta de la página de Precios, para usar con navigate() en los componentes. */
  pricingPath: string;
}

const PRICING_PATH = '/precios';

export const useEntitlements = (): Entitlements => {
  const { profile } = useAuth();
  const { modo } = useModoGratis();

  return useMemo(() => {
    const state = getAccessState(profile?.subscription_role, profile?.created_at, profile?.trial_ends_at, modo);
    return {
      state,
      isPaid: state === 'paid',
      isTrial: state === 'free_trial',
      isLocked: state === 'free_locked',
      isGratis: state === 'gratis',
      isRestricted: state === 'free_locked' || state === 'gratis',
      modo,
      trialDaysLeft: state === 'free_trial' ? getTrialDaysLeft(profile?.created_at, profile?.trial_ends_at) : null,
      limits: FREE_LIMITS,
      pricingPath: PRICING_PATH,
    };
  }, [profile?.subscription_role, profile?.created_at, profile?.trial_ends_at, modo]);
};
