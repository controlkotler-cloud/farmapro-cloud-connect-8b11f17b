// =====================================================================
// La Rebotica: configuración y helpers compartidos por la UI pública.
// Fuente: portal-plan-rebotica-maestro.md (§2, §4.2) + memoria de proyecto.
// =====================================================================

/**
 * TODO (S30, backend): activar cuando exista la edge function `open-reward`
 * (sorteo ponderado server-side, decremento atómico de stock, idempotencia).
 * Mientras esté en false, "abrir cajón" muestra un mensaje honesto de
 * "estamos conectando los premios" en vez de simular un premio falso
 * (doctrina spotsTaken: nada demostrablemente falso).
 */
export const REBOTICA_OPEN_REWARD_ENABLED = false;

/** Nº de cajones de la cajonera (spec §2.3 del plan maestro). */
export const REBOTICA_DRAWER_COUNT = 9;

/** Rótulos clásicos de botica: numeración romana, sobria (nunca casino). */
export const REBOTICA_DRAWER_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

/**
 * Próxima apertura de la Rebotica de la quincena (D-day, plan §4.2, jueves
 * 10-09-2026). Es una fecha real planificada, no una promesa de stock: solo
 * anuncia cuándo se abre la mecánica, no cuántos premios hay.
 */
export const REBOTICA_NEXT_OPENING = {
  dateISO: '2026-09-10',
  dateLabel: 'jueves 10 de septiembre',
};

/** Contexto que puede llegar en el enlace del email (patrón voto 1-clic). */
export interface ReboticaContext {
  /** Campaña de origen (`?c=`), informativo. */
  campaign?: string;
  /** Cajón preseleccionado desde el email (`?cajon=`), 1..REBOTICA_DRAWER_COUNT. */
  cajon?: number;
  /** Email de atribución (`?e={{email}}` en Mailrelay). */
  email?: string;
}

const STORAGE_KEY = 'rebotica_context';

/** Lee `?c=&cajon=&e=` de la URL actual (patrón `farmapro.es/rebotica?c={campaña}&cajon={n}&e={email}`). */
export function readReboticaContextFromUrl(search: string): ReboticaContext {
  const params = new URLSearchParams(search);
  const ctx: ReboticaContext = {};

  const campaign = params.get('c')?.trim();
  if (campaign) ctx.campaign = campaign.slice(0, 80);

  const cajonRaw = params.get('cajon');
  const cajon = cajonRaw ? parseInt(cajonRaw, 10) : NaN;
  if (Number.isInteger(cajon) && cajon >= 1 && cajon <= REBOTICA_DRAWER_COUNT) {
    ctx.cajon = cajon;
  }

  // Nota: si el merge tag no se resolvió (llega literal "{{email}}" o "{email}"),
  // lo descartamos: es mejor no atribuir que atribuir basura.
  const email = params.get('e')?.trim();
  if (email && email.includes('@')) ctx.email = email.slice(0, 255);

  return ctx;
}

/** Guarda el contexto (fusiona con lo que ya hubiera) para sobrevivir a la navegación a /login. */
export function storeReboticaContext(ctx: ReboticaContext) {
  try {
    const existing = loadReboticaContext() ?? {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...ctx }));
  } catch {
    /* almacenamiento no disponible: se ignora, no es crítico */
  }
}

export function loadReboticaContext(): ReboticaContext | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReboticaContext) : null;
  } catch {
    return null;
  }
}
