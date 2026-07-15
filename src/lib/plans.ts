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

/**
 * Configuración del lanzamiento. El precio de lanzamiento rige hasta cubrir las
 * primeras `spots` plazas: ése es el ÚNICO cierre. La fecha NO cierra nada.
 *  - startISO: inicio del lanzamiento (referencia interna).
 *  - windowDays: objetivo interno de captación (NO visible, NO cierra nada; si
 *    pasan los días y aún no hay 100, se continúa hasta llegar a 100).
 *  - spots: plazas a precio de lanzamiento (100).
 *  - spotsTaken: plazas YA ocupadas. Mientras no esté Stripe, súbelo a mano (o
 *    conéctalo al recuento real de altas). Cuando spotsTaken >= spots, se cierra
 *    y rige el precio normal.
 *    OJO legal: el "quedan X plazas" debería reflejar la realidad (o al menos no
 *    contradecirla) para no incurrir en publicidad engañosa.
 */
export const LAUNCH = {
  startISO: '2026-07-01T09:00:00+02:00',
  windowDays: 15,
  spots: LAUNCH_SPOTS,
  /**
   * Plazas YA ocupadas por altas de pago REALES. Empieza en 0 y se actualiza a
   * mano (o se conecta al recuento real cuando esté Stripe). SOLO cuentan pagos
   * reales: inflarlo sería publicidad engañosa (Ley 3/1991).
   */
  spotsTaken: 0,
  /**
   * El contador público no se muestra hasta alcanzar este número de plazas
   * ocupadas reales: un contador casi vacío el primer día resta, no suma.
   * Fases: < showCounterFrom → solo "100 plazas fundador", sin cifra;
   * >= showCounterFrom → "X de 100 plazas ocupadas"; quedan <=15 → "quedan X".
   */
  showCounterFrom: 20,
};

export interface LaunchStatus {
  /** ¿Sigue vigente el precio de lanzamiento? Depende SOLO de que queden plazas. */
  active: boolean;
  /** Plazas ocupadas (altas de pago reales). */
  spotsTaken: number;
  /** Plazas que quedan a precio de lanzamiento. */
  spotsLeft: number;
  /** true cuando quedan pocas (<=15): dispara el aviso "últimas plazas". */
  almostGone: boolean;
  /** true cuando ya hay altas reales suficientes para enseñar el contador. */
  showCounter: boolean;
}

/** Estado del lanzamiento: se cierra al cubrir las primeras `spots` plazas. */
export function getLaunchStatus(): LaunchStatus {
  const spotsLeft = Math.max(0, LAUNCH.spots - LAUNCH.spotsTaken);
  return {
    active: spotsLeft > 0,
    spotsTaken: LAUNCH.spotsTaken,
    spotsLeft,
    almostGone: spotsLeft > 0 && spotsLeft <= 15,
    showCounter: LAUNCH.spotsTaken >= LAUNCH.showCounterFrom,
  };
}

export const PLANS: Plan[] = [
  {
    id: 'gratis',
    name: 'Gratis',
    priceMonthly: 0,
    seats: 1,
    tagline: 'Pruébalo sin tarjeta',
    cta: 'Empezar gratis',
    features: [
      'Acceso hasta 2 cursos y 3 recursos',
      'Leer la comunidad',
      '2 textos y 1 crédito de imagen con IAFarma',
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
    cta: 'Hazte Plus',
    features: [
      'Todo el contenido: cursos y recursos sin límite',
      'Comunidad completa + retos y ranking',
      'IAFarma texto ILIMITADO',
      '1 crédito de imagen IAFarma al mes (+ packs de recarga)',
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
    cta: 'Activar Equipo',
    features: [
      'Todo lo de Plus para hasta 10 personas',
      'Una sola cuota para toda la farmacia',
      'Gestiona las plazas de tu equipo',
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

/**
 * Palanca de la recarga a 1 clic de packs de imágenes. Ponla a true cuando la
 * tanda de Stripe (prompt Lovable nº 2) conecte create-checkout con los packs
 * (body { pack: credits }). Mientras esté a false, la UI muestra los packs pero
 * el botón informa de que la recarga instantánea llega con el pago online.
 */
export const PACKS_CHECKOUT_READY = false;

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

/** Nombre visible de cada rol (roles antiguos incluidos hasta migrar todo a Stripe). */
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  equipo: 'Equipo',
  plus: 'Plus',
  premium: 'Premium',
  profesional: 'Profesional',
  estudiante: 'Estudiante',
  freemium: 'Gratis',
};

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
