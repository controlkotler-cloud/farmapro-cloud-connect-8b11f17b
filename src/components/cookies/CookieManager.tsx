import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CookieBanner } from './CookieBanner';
import { applyConsent, captureUtms, trackPageView } from '@/lib/analytics';

export const CookieManager = () => {
  const location = useLocation();
  const firstRender = useRef(true);

  // Arranque: capturar UTMs de la URL y cargar la medición que ya tenga consentimiento.
  useEffect(() => {
    captureUtms();
    applyConsent();
  }, []);

  // Navegación SPA: página vista en cada cambio de ruta (la carga inicial ya
  // la registran GA4 y el píxel al inicializarse).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    trackPageView(location.pathname);
  }, [location.pathname]);

  return <CookieBanner />;
};
