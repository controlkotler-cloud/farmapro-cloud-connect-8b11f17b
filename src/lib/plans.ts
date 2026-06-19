// =====================================================================
// Fuente ÚNICA de verdad de planes, precios y límites del portal farmapro.
// La usan la página de Precios y el control de acceso (entitlements).
// Stripe se conecta al final; aquí solo se define el modelo.
// =====================================================================

export type PlanId = 'gratis' | 'plus' | 'equipo';

export interface Plan {
  id: PlanId;
  name: string;
  /** Precio regular mensual (€). Es el que se muestra TACHADO durante el lanzamiento. */
  priceMonthly: number;
  /** Precio de lanzamiento mensual (€) para las primeras plazas, bloqueado de por vida. */
  priceMonthlyLaunch?: number;
  /** Precio anual (€) = 2 meses gratis sobre el precio vigente. */
  priceYearlyLaunch?: number;
  /** Usuarios incluidos. */
  seats: number;
  highlight?: boolean;
  tagline: string;
  features: string[];
  cta: string;
}

/** Plazas con precio de lanzamiento bloqueado de por vida. */
export const LAUNCH_SPOTS = 100;

export const PLANS: Plan[] = [
  {
    id: 'gratis',
    name: 'Gratis',
    priceMonthly: 0,
    seats: 1,
    tagline: 'Pruébalo sin tarjeta',
    cta: 'Empezar gratis',
    features: [
      'Acceso a 1-2 cursos y 2-3 recursos (primeros 30 días)',
      'Leer la comunidad',
      '2 textos y 1 imagen con IAFarma al mes',
      'Ver los eventos del sector',
      'A los 30 días lo ves todo, pero queda bloqueado',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    priceMonthly: 39,
    priceMonthlyLaunch: 19.9,
    priceYearlyLaunch: 199,
    seats: 1,
    highlight: true,
    tagline: 'Para ti, todo incluido',
    cta: 'Reservar plaza',
    features: [
      'TODO el contenido: cursos y recursos sin límite',
      'Comunidad completa + retos y ranking',
      'IAFarma texto ILIMITADO',
      '1 imagen IAFarma/mes (+ packs de recarga)',
      'Eventos exclusivos farmapro',
    ],
  },
  {
    id: 'equipo',
    name: 'Equipo',
    priceMonthly: 79,
    priceMonthlyLaunch: 49,
    priceYearlyLaunch: 490,
    seats: 10,
    tagline: 'Forma a toda tu farmacia',
    cta: 'Reservar plaza',
    features: [
      'Todo lo de Plus para hasta 10 personas',
      'Una sola cuota para toda la farmacia',
      'Panel del titular y seguimiento del equipo',
      'IAFarma texto ilimitado para el equipo',
    ],
  },
];

/** Packs de recarga de imágenes IAFarma (pago único, sobre cualquier plan de pago). */
export const IMAGE_ADDONS = [
  { credits: 20, price: 4.99 },
  { credits: 50, price: 9.99 },
  { credits: 100, price: 16.99 },
];

/** Límites del plan Gratis. */
export const FREE_LIMITS = {
  trialDays: 30,
  courses: 2,
  resources: 3,
  aiTextPerMonth: 2,
  aiImagePerMonth: 1,
};

/**
 * Roles que dan acceso COMPLETO (de pago + admin). Incluye los roles antiguos
 * (premium/profesional) para no romper a suscriptores existentes; 'plus' y
 * 'equipo' se añadirán al enum cuando se conecte Stripe.
 */
export const PAID_ROLES = ['plus', 'equipo', 'premium', 'profesional', 'admin'];

export type AccessState = 'paid' | 'free_trial' | 'free_locked';

/**
 * Estado de acceso del usuario:
 *  - 'paid'        → plan de pago o admin: acceso total.
 *  - 'free_trial'  → gratis dentro de los primeros 30 días: acceso con límites.
 *  - 'free_locked' → gratis pasados 30 días: lo ve todo pero bloqueado.
 */
export function getAccessState(
  role: string | null | undefined,
  createdAt: string | null | undefined,
): AccessState {
  if (role && PAID_ROLES.includes(role)) return 'paid';
  if (!createdAt) return 'free_trial';
  const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return days <= FREE_LIMITS.trialDays ? 'free_trial' : 'free_locked';
}
