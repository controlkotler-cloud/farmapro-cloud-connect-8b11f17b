// =====================================================================
// La Rebotica: configuración y helpers compartidos por la UI pública.
// Fuente: portal-plan-rebotica-maestro.md (§2, §4.2) + memoria de proyecto.
// =====================================================================

/**
 * `open-reward` ya existe (sorteo ponderado server-side, decremento atómico
 * de stock, idempotencia por UNIQUE(user_id,campaign_id)) — activado 16-07.
 */
export const REBOTICA_OPEN_REWARD_ENABLED = true;

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
 * Próxima apertura de la Rebotica del mes (D-day, plan §4.2, jueves
 * 10-09-2026). Es una fecha real planificada, no una promesa de stock: solo
 * anuncia cuándo se abre la mecánica, no cuántos premios hay.
 */
export const REBOTICA_NEXT_OPENING = {
  dateISO: '2026-09-10',
  dateLabel: 'jueves 10 de septiembre',
};

/**
 * Hora (Europe/Madrid) a la que abre el cajón. `rebotica_campaigns.quincena_inicio`
 * es un campo de FECHA, sin hora, así que el instante real de apertura se compone
 * siempre con esta constante. Se cambia aquí y en ningún sitio más.
 */
export const HORA_APERTURA_CAJON = 8;

/** Hora de apertura de cada cajón mensual (hora peninsular). */
export const REBOTICA_OPENING_TIME_LABEL = `${String(HORA_APERTURA_CAJON).padStart(2, '0')}:00`;

/** Combina una fecha de campaña (YYYY-MM-DD) con la hora de apertura del cajón. */
export function composeOpeningInstant(dateISO: string): Date {
  return new Date(`${dateISO}T${String(HORA_APERTURA_CAJON).padStart(2, '0')}:00:00+02:00`);
}

/** "2026-11-30" → "30 de noviembre" (hora peninsular). */
export function formatFechaLarga(dateISO: string): string {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' }).format(
    new Date(`${dateISO}T12:00:00+02:00`),
  );
}

/**
 * Cuenta atrás en castellano natural: "Faltan 7 días y 4 horas" y, cuando queda
 * menos de un día, "Faltan 7 horas y 12 minutos". Devuelve null si ya pasó.
 */
export function formatCuentaAtras(target: Date, now: Date = new Date()): string | null {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return null;

  const totalMinutos = Math.floor(ms / 60_000);
  const dias = Math.floor(totalMinutos / 1440);
  const horas = Math.floor((totalMinutos % 1440) / 60);
  const minutos = totalMinutos % 60;

  const plural = (n: number, singular: string, prural: string) =>
    `${n} ${n === 1 ? singular : prural}`;

  if (dias > 0) {
    const resto = horas > 0 ? ` y ${plural(horas, 'hora', 'horas')}` : '';
    return `Faltan ${plural(dias, 'día', 'días')}${resto}`;
  }
  if (horas > 0) {
    const resto = minutos > 0 ? ` y ${plural(minutos, 'minuto', 'minutos')}` : '';
    return `Faltan ${plural(horas, 'hora', 'horas')}${resto}`;
  }
  return `Falta${minutos === 1 ? '' : 'n'} ${plural(minutos, 'minuto', 'minutos')}`;
}

/**
 * Fecha-hora objetivo de la próxima apertura para la cuenta atrás de la
 * landing. Septiembre en España peninsular = CEST (+02:00); si alguna
 * apertura cayera en horario de invierno, ajustar el offset.
 */
export function getNextOpeningDate(): Date {
  return composeOpeningInstant(REBOTICA_NEXT_OPENING.dateISO);
}

/** Partner del mes (patrocinio = presencia pura: logo ENLAZADO a su web). */
export interface ReboticaPartner {
  name: string;
  logoUrl: string;
  /** Web del partner; llevar SIEMPRE UTM para el informe de campaña. */
  url: string;
}

/**
 * Partner de la campaña actual. El D-day (cajón nº 1) va SIN partner a
 * propósito: 100% farmapro, primera impresión sin sabor comercial (plan §5).
 * Cuando haya campaña patrocinada real (mes 2+), esto se alimentará de
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
  /** Email de atribución (`?e={{email}}` en el enlace del correo). */
  email?: string;
}

const STORAGE_KEY = 'rebotica_context';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `c` solo vale si tiene forma de uuid: `open-reward` lo usa como clave primaria
 * de `rebotica_campaigns`, así que un nombre ("dday") rompía la apertura con un
 * 400/404 y, peor, se persistía en localStorage (fix 08-09-2026). Sin `c` la edge
 * resuelve sola la campaña activa por fecha, que es lo correcto.
 */
function sanitizeCampaign(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  return UUID_RE.test(v) ? v : undefined;
}

/** Lee `?c=&cajon=&e=` de la URL actual. `c` es OPCIONAL y debe ser el uuid de la campaña; cualquier otro valor se ignora. */
export function readReboticaContextFromUrl(search: string): ReboticaContext {
  const params = new URLSearchParams(search);
  const ctx: ReboticaContext = {};

  const campaign = sanitizeCampaign(params.get('c'));
  if (campaign) ctx.campaign = campaign;

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
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReboticaContext;
    // Un `campaign` no-uuid guardado antes del fix seguiría rompiendo cada apertura.
    const campaign = sanitizeCampaign(parsed.campaign);
    if (campaign) parsed.campaign = campaign;
    else delete parsed.campaign;
    return parsed;
  } catch {
    return null;
  }
}
