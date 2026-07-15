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

/**
 * Rótulos clásicos de botica: siglas alfabéticas de cajonera real
 * (retoque de Francesc 13-07, mockup v2 de la landing).
 */
export const REBOTICA_DRAWER_LABELS = [
  'A - C',
  'D - F',
  'G - I',
  'J - L',
  'M - O',
  'P - R',
  'S - T',
  'U - V',
  'W - X',
];

/**
 * Próxima apertura de la Rebotica de la quincena (D-day, plan §4.2, jueves
 * 10-09-2026). Es una fecha real planificada, no una promesa de stock: solo
 * anuncia cuándo se abre la mecánica, no cuántos premios hay.
 */
export const REBOTICA_NEXT_OPENING = {
  dateISO: '2026-09-10',
  dateLabel: 'jueves 10 de septiembre',
};

/** Hora de apertura de cada cajón de quincena (hora peninsular). */
export const REBOTICA_OPENING_TIME_LABEL = '08:00';

/**
 * Fecha-hora objetivo de la próxima apertura para la cuenta atrás de la
 * landing. Septiembre en España peninsular = CEST (+02:00); si alguna
 * apertura cayera en horario de invierno, ajustar el offset.
 */
export function getNextOpeningDate(): Date {
  return new Date(`${REBOTICA_NEXT_OPENING.dateISO}T${REBOTICA_OPENING_TIME_LABEL}:00+02:00`);
}

/** Partner de la quincena (patrocinio = presencia pura: logo ENLAZADO a su web). */
export interface ReboticaPartner {
  name: string;
  logoUrl: string;
  /** Web del partner; llevar SIEMPRE UTM para el informe de campaña. */
  url: string;
}

/**
 * Partner de la campaña actual. El D-day (cajón nº 1) va SIN partner a
 * propósito: 100% farmapro, primera impresión sin sabor comercial (plan §5).
 * Cuando haya campaña patrocinada real (quincena 2+), esto se alimentará de
 * `rebotica_campaigns.partner_id`; mientras sea null, la landing oculta los
 * 3 huecos de partner (hero, strip de cuenta atrás y tarjeta del pie).
 */
export const REBOTICA_CURRENT_PARTNER: ReboticaPartner | null = null;

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
