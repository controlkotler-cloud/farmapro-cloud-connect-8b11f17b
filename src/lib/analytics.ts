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

export const ANALYTICS_CONFIG = {
  /** ID del píxel de Meta (Events Manager → Orígenes de datos). Ej: '123456789012345'. */
  metaPixelId: '',
  /** ID de medición de GA4 (Administrar → Flujos de datos). Ej: 'G-XXXXXXXXXX'. */
  ga4MeasurementId: '',
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

export interface StoredUtms {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
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
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  // Consent Mode: solo llegamos aquí con consentimiento de análisis concedido.
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  });
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

/**
 * Captura los UTM de la URL actual. Primera visita → farmapro_utm_first
 * (no se sobreescribe: atribución first-touch); cada visita con UTMs
 * actualiza farmapro_utm_last. Es medición de primera parte: no depende
 * del consentimiento de cookies de terceros.
 */
export const captureUtms = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const utms: StoredUtms = {};
    let hasAny = false;
    for (const key of UTM_PARAMS) {
      const value = params.get(key)?.trim();
      if (value) {
        utms[key] = value.slice(0, 150);
        hasAny = true;
      }
    }
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

/** UTMs guardados para adjuntar al registro (first-touch; si no hay, last-touch). */
export const getStoredUtms = (): StoredUtms | null => {
  try {
    const raw = localStorage.getItem(UTM_FIRST_KEY) ?? localStorage.getItem(UTM_LAST_KEY);
    return raw ? (JSON.parse(raw) as StoredUtms) : null;
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

/** Registro completado: el evento de conversión del lanzamiento. */
export const trackRegistration = () => {
  if (ga4Loaded && window.gtag) {
    window.gtag('event', 'sign_up', { method: 'email' });
  }
  if (pixelLoaded && window.fbq) {
    window.fbq('track', 'CompleteRegistration');
  }
};

/** Evento genérico (GA4). */
export const trackEvent = (name: string, params?: Record<string, unknown>) => {
  if (ga4Loaded && window.gtag) {
    window.gtag('event', name, params ?? {});
  }
};
