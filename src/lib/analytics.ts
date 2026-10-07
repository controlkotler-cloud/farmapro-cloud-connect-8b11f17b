// =====================================================================
// Medición del portal farmapro: GA4 + píxel de Meta + atribución UTM.
//
// REGLAS (plan de lanzamiento, adendas B y C):
//  - Nada se carga sin consentimiento del banner de cookies
//    (GA4 requiere "analytics"; píxel de Meta requiere "marketing").
//  - La atribución UTM es primera parte (localStorage propio + columna en el
//    registro), no depende de terceros y no usa cookies de seguimiento.
//  - IDs: rellenar las dos constantes de ANALYTICS_CONFIG. Mientras estén
//    vacías, todo queda desactivado sin romper nada.
// =====================================================================

import { PLANS, type PlanId } from '@/lib/plans';

export const ANALYTICS_CONFIG = {
  /** ID del píxel de Meta (Events Manager → Orígenes de datos). Ej: '123456789012345'. */
  metaPixelId: '',
  /** ID de medición de GA4 (Administrar → Flujos de datos). Ej: 'G-XXXXXXXXXX'. */
  ga4MeasurementId: 'G-968HG3ZZC0',
};

interface ConsentPrefs {
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_KEY = 'farmapro_cookie_consent';
const PREFERENCES_KEY = 'farmapro_cookie_preferences';
const UTM_FIRST_KEY = 'farmapro_utm_first';
const UTM_LAST_KEY = 'farmapro_utm_last';

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
/** Identificadores de clic de anuncios (Google Ads, Meta, TikTok). */
const CLICK_ID_PARAMS = ['gclid', 'fbclid', 'ttclid'] as const;
const CHECKOUT_PENDING_KEY = 'farmapro_checkout_pending';
const PURCHASES_SENT_KEY = 'farmapro_purchases_sent';

export interface StoredUtms {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  landing_page?: string;
  captured_at?: string;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

let ga4Loaded = false;
let pixelLoaded = false;

/** Lee el consentimiento vigente del banner de cookies (mismas claves que useCookieConsent). */
export const readConsent = (): ConsentPrefs => {
  try {
    if (localStorage.getItem(CONSENT_KEY) !== 'true') return { analytics: false, marketing: false };
    const prefs = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}');
    return { analytics: prefs.analytics === true, marketing: prefs.marketing === true };
  } catch {
    return { analytics: false, marketing: false };
  }
};

const loadScript = (src: string) => {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
};

const loadGa4 = () => {
  if (ga4Loaded || !ANALYTICS_CONFIG.ga4MeasurementId) return;
  ga4Loaded = true;
  window.dataLayer = window.dataLayer || [];
  // OJO: gtag.js solo reconoce como comando el objeto `arguments`. Empujar un
  // array normal (rest params) no envía nada, sin error ni aviso. Verificado
  // en vivo el 03-09-2026 contra la propiedad real.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  // Consent Mode: se declara antes que nada. Solo llegamos aquí con
  // consentimiento de análisis concedido.
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  });
  window.gtag('js', new Date());
  window.gtag('config', ANALYTICS_CONFIG.ga4MeasurementId, { anonymize_ip: true });
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.ga4MeasurementId}`);
};

const loadMetaPixel = () => {
  if (pixelLoaded || !ANALYTICS_CONFIG.metaPixelId) return;
  pixelLoaded = true;
  // Stub estándar de fbq (equivalente al snippet oficial, sin eval).
  const fbq: any = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  if (!window.fbq) {
    window.fbq = fbq;
    window._fbq = fbq;
  }
  window.fbq!('init', ANALYTICS_CONFIG.metaPixelId);
  window.fbq!('track', 'PageView');
  loadScript('https://connect.facebook.net/en_US/fbevents.js');
};

/**
 * Aplica el consentimiento: carga lo permitido y revoca lo retirado.
 * Llamar al arrancar la app y cada vez que el usuario guarde preferencias.
 */
export const applyConsent = (prefs?: ConsentPrefs) => {
  const consent = prefs ?? readConsent();
  if (consent.analytics) {
    loadGa4();
  } else if (ga4Loaded && window.gtag) {
    window.gtag('consent', 'update', { analytics_storage: 'denied' });
  }
  if (consent.marketing) {
    loadMetaPixel();
  } else if (pixelLoaded && window.fbq) {
    window.fbq('consent', 'revoke');
  }
};

const REFERRAL_KEY = 'fp_inv';
const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Guarda el código de invitación si la URL trae ?inv=XXX (4-12 alfanuméricos). */
export const captureReferralFromParams = (params: URLSearchParams) => {
  try {
    const inv = params.get('inv')?.trim();
    if (inv && /^[A-Za-z0-9]{4,12}$/.test(inv)) {
      localStorage.setItem(
        REFERRAL_KEY,
        JSON.stringify({ code: inv.toUpperCase(), ts: Date.now() }),
      );
    }
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
};

/** Código de invitación vigente (menos de 30 días) o null. */
export const getReferralCode = (): string | null => {
  try {
    const raw = localStorage.getItem(REFERRAL_KEY);
    if (!raw) return null;
    const { code, ts } = JSON.parse(raw) as { code?: string; ts?: number };
    if (!code || typeof ts !== 'number' || Date.now() - ts > REFERRAL_TTL_MS) return null;
    return code;
  } catch {
    return null;
  }
};

/**
 * Captura los UTM y los identificadores de clic (gclid, fbclid, ttclid) de la
 * URL actual. Primera visita → farmapro_utm_first (no se sobreescribe:
 * atribución first-touch); cada visita con parámetros actualiza
 * farmapro_utm_last. Es medición de primera parte: no depende del
 * consentimiento de cookies de terceros.
 */
export const captureUtms = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const utms: StoredUtms = {};
    let hasAny = false;
    for (const key of [...UTM_PARAMS, ...CLICK_ID_PARAMS]) {
      const value = params.get(key)?.trim();
      if (value) {
        utms[key] = value.slice(0, key.endsWith('clid') ? 300 : 150);
        hasAny = true;
      }
    }
    // Los enlaces internos de farmapro.es llevan ?ref=<punto> en vez de UTM
    // (para no contar en GA4 como campaña el tráfico entre nuestros dominios).
    // Sin utm_source propio, el ref se guarda como origen farmapro-web y el
    // punto del enlace como medio. Con UTM explícitos (campañas, Radiografía)
    // no se toca nada.
    const ref = params.get('ref')?.trim();
    if (ref && !utms.utm_source && /^[\w-]{1,60}$/.test(ref)) {
      utms.utm_source = 'farmapro-web';
      if (!utms.utm_medium) utms.utm_medium = ref;
      hasAny = true;
    }
    // Invitación de otra farmacia (?inv=CODIGO): gana la última, caduca a los 30 días.
    captureReferralFromParams(params);
    if (!hasAny) return;
    utms.landing_page = window.location.pathname;
    utms.captured_at = new Date().toISOString();
    if (!localStorage.getItem(UTM_FIRST_KEY)) {
      localStorage.setItem(UTM_FIRST_KEY, JSON.stringify(utms));
    }
    localStorage.setItem(UTM_LAST_KEY, JSON.stringify(utms));
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
};

/**
 * UTMs guardados para adjuntar al registro (first-touch; si no hay, last-touch).
 * Los identificadores de clic se toman del primer contacto y, si éste no
 * traía ninguno, del último: el clic de anuncio que importa para atribuir
 * es el que trajo al usuario, aunque no fuera su primera visita.
 */
export const getStoredUtms = (): StoredUtms | null => {
  try {
    const raw = (key: string): StoredUtms | null => {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as StoredUtms) : null;
    };
    const first = raw(UTM_FIRST_KEY);
    const last = raw(UTM_LAST_KEY);
    const base = first ?? last;
    if (!base) return null;
    const merged: StoredUtms = { ...base };
    for (const key of CLICK_ID_PARAMS) {
      if (!merged[key] && last?.[key]) merged[key] = last[key];
    }
    return merged;
  } catch {
    return null;
  }
};

/** Página vista en navegación SPA (GA4 + Meta). */
export const trackPageView = (path: string) => {
  if (ga4Loaded && window.gtag && ANALYTICS_CONFIG.ga4MeasurementId) {
    window.gtag('event', 'page_view', { page_path: path });
  }
  if (pixelLoaded && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

/**
 * Evento GA4. Sin consentimiento de análisis no se envía nada. Si el
 * consentimiento ya estaba dado pero GA aún no ha arrancado (evento disparado
 * antes del efecto de arranque de CookieManager), se arranca aquí:
 * loadGa4 es idempotente y gtag encola en dataLayer.
 */
export const trackEvent = (name: string, params?: Record<string, unknown>) => {
  if (!ANALYTICS_CONFIG.ga4MeasurementId) return;
  if (!ga4Loaded) {
    if (!readConsent().analytics) return;
    loadGa4();
  }
  window.gtag?.('event', name, params ?? {});
};

/** Valor de un parámetro de evento: GA4 corta a 100 caracteres. */
const cap = (v?: string) => (v ? v.slice(0, 100) : undefined);

/** Registro completado: el evento de conversión del lanzamiento. */
export const trackRegistration = (method = 'email') => {
  const u = getStoredUtms();
  trackEvent('sign_up', {
    method,
    first_utm_source: cap(u?.utm_source),
    first_utm_medium: cap(u?.utm_medium),
    first_utm_campaign: cap(u?.utm_campaign),
    first_utm_term: cap(u?.utm_term),
    first_utm_content: cap(u?.utm_content),
    first_landing_page: cap(u?.landing_page),
    ...(getReferralCode() ? { referral: 1 } : {}),
  });
  if (pixelLoaded && window.fbq) {
    window.fbq('track', 'CompleteRegistration');
  }
};

// ---------------------------------------------------------------------
// Embudo de pago: begin_checkout → purchase (suscripciones Plus / Equipo).
// El importe real lo decide el servidor (precio fundador o regular); aquí se
// usa el precio de PLANS que corresponde, con IVA incluido igual que Precios.
// ---------------------------------------------------------------------

export type CheckoutCycle = 'monthly' | 'yearly';

interface PendingCheckout {
  plan: PlanId;
  cycle: CheckoutCycle;
  value: number;
  founder: boolean;
  trial: boolean;
  ts: number;
}

const planValue = (plan: PlanId, cycle: CheckoutCycle, founder: boolean): number => {
  const p = PLANS.find((x) => x.id === plan);
  if (!p) return 0;
  if (cycle === 'yearly') return founder ? p.priceYearlyLaunch ?? p.priceMonthly * 10 : p.priceMonthly * 10;
  return founder ? p.priceMonthlyLaunch ?? p.priceMonthly : p.priceMonthly;
};

const planItem = (plan: PlanId, cycle: CheckoutCycle, value: number) => {
  const p = PLANS.find((x) => x.id === plan);
  return {
    item_id: `${plan}_${cycle}`,
    item_name: p?.name ?? plan,
    item_category: 'suscripcion',
    item_variant: cycle,
    price: value,
    quantity: 1,
  };
};

/**
 * El usuario abre el checkout de Stripe de un plan (alta nueva). Guarda el
 * contexto para poder informar `purchase` al volver (la URL de retorno solo
 * trae el id de sesión). `trial` = acceso concedido: hoy no se cobra nada.
 */
export const trackBeginCheckout = (opts: {
  plan: PlanId;
  cycle: CheckoutCycle;
  founder: boolean;
  trial?: boolean;
}) => {
  const value = planValue(opts.plan, opts.cycle, opts.founder);
  const pending: PendingCheckout = {
    plan: opts.plan,
    cycle: opts.cycle,
    value,
    founder: opts.founder,
    trial: opts.trial === true,
    ts: Date.now(),
  };
  try {
    localStorage.setItem(CHECKOUT_PENDING_KEY, JSON.stringify(pending));
  } catch {
    /* almacenamiento no disponible: el purchase saldrá sin plan */
  }
  trackEvent('begin_checkout', {
    currency: 'EUR',
    value,
    items: [planItem(opts.plan, opts.cycle, value)],
    // El navegador va a salir hacia Stripe justo después: sendBeacon.
    transport_type: 'beacon',
  });
};

/**
 * Vuelta de Stripe con éxito (?checkout=success&session_id=...). Informa
 * `purchase` una sola vez por sesión de Stripe (se recuerda en localStorage,
 * así que recargar o volver atrás no lo duplica). Si el alta fue con acceso
 * concedido (hoy no se cobra), informa `start_trial` y NO `purchase`, para
 * que los ingresos de GA4 no cuenten dinero que aún no se ha cobrado.
 */
export const trackPurchaseReturn = (sessionId: string | null) => {
  if (!sessionId) return;
  try {
    const sent: string[] = JSON.parse(localStorage.getItem(PURCHASES_SENT_KEY) ?? '[]');
    if (sent.includes(sessionId)) return;
    localStorage.setItem(PURCHASES_SENT_KEY, JSON.stringify([...sent, sessionId].slice(-20)));
  } catch {
    /* sin almacenamiento no se puede deduplicar: se informa igualmente */
  }

  let pending: PendingCheckout | null = null;
  try {
    const raw = localStorage.getItem(CHECKOUT_PENDING_KEY);
    pending = raw ? (JSON.parse(raw) as PendingCheckout) : null;
    localStorage.removeItem(CHECKOUT_PENDING_KEY);
  } catch {
    pending = null;
  }

  const base = { transaction_id: sessionId, currency: 'EUR' };
  if (!pending) {
    // Sin contexto (almacenamiento borrado, otro navegador): se cuenta la
    // conversión sin plan ni importe.
    trackEvent('purchase', base);
    return;
  }
  trackEvent(pending.trial ? 'start_trial' : 'purchase', {
    ...base,
    value: pending.value,
    items: [planItem(pending.plan, pending.cycle, pending.value)],
  });
};
