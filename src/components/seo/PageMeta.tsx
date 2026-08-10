import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "https://portal.farmapro.es";
const DEFAULT_TITLE = "farmapro - Impulsando la excelencia farmacéutica en España";
const DEFAULT_DESCRIPTION =
  "farmapro - El ecosistema digital que impulsa el potencial de las farmacias en España";

interface RouteMeta {
  title: string;
  description: string;
  /** Rutas transaccionales (reset, invitación) que no deben indexarse */
  noindex?: boolean;
}

// Solo rutas públicas: las protegidas quedan en noindex por defecto (Google
// solo vería el shell de login, no aportan nada al índice).
const PUBLIC_META: Record<string, RouteMeta> = {
  "/rebotica": {
    title: "La Rebotica: recompensas para tu farmacia | farmapro",
    description:
      "Cada quincena, un cajón con premios para profesionales de farmacia: masterclasses, plantillas y sorteos. Elige tu cajón y ábrelo con tu cuenta del portal farmapro.",
  },
  "/rebotica/bases-legales": {
    title: "Bases legales de La Rebotica | portal farmapro",
    description:
      "Bases legales de las campañas de recompensas y sorteos de La Rebotica del portal farmapro.",
  },
  "/precios": {
    title: "Planes y precios | portal farmapro",
    description:
      "Planes del portal farmapro para farmacias: formación, recursos descargables, comunidad y retos. Compara el plan gratuito, Plus y Equipo.",
  },
  "/login": {
    title: "Acceso | portal farmapro",
    description:
      "Accede al portal farmapro: formación, recursos y comunidad para profesionales de farmacia en España.",
  },
  "/contacto-soporte": {
    title: "Contacto y soporte | portal farmapro",
    description:
      "¿Necesitas ayuda con el portal farmapro? Contacta con el equipo de soporte.",
  },
  "/aviso-legal": {
    title: "Aviso legal | portal farmapro",
    description: "Aviso legal del portal farmapro, el ecosistema digital para farmacias de Mkpro.",
  },
  "/politica-privacidad": {
    title: "Política de privacidad | portal farmapro",
    description: "Política de privacidad y tratamiento de datos del portal farmapro.",
  },
  "/politica-cookies": {
    title: "Política de cookies | portal farmapro",
    description: "Política de cookies del portal farmapro.",
  },
  "/reset-password": {
    title: "Restablecer contraseña | portal farmapro",
    description: "Restablece la contraseña de tu cuenta del portal farmapro.",
    noindex: true,
  },
  "/invitation": {
    title: "Invitación de equipo | portal farmapro",
    description: "Acepta la invitación para unirte al equipo de tu farmacia en el portal farmapro.",
    noindex: true,
  },
};

const setMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = document.createElement(selector.startsWith("link") ? "link" : "meta");
    const match = selector.match(/\[(name|property|rel)="([^"]+)"\]/);
    if (match) el.setAttribute(match[1], match[2]);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value));
};

const removeMeta = (selector: string) => {
  document.head.querySelector(selector)?.remove();
};

/**
 * Metas SEO por ruta. Se monta una sola vez dentro del Router (App/AppRoutes)
 * y reacciona a cada cambio de pathname. Sin dependencias externas.
 */
export const PageMeta = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = PUBLIC_META[pathname];
    const title = meta?.title ?? DEFAULT_TITLE;
    const description = meta?.description ?? DEFAULT_DESCRIPTION;
    // Indexable solo si es pública y no está marcada noindex
    const indexable = !!meta && !meta.noindex;

    document.title = title;
    setMeta('meta[name="description"]', { content: description });
    setMeta('meta[property="og:title"]', { content: title });
    setMeta('meta[property="og:description"]', { content: description });
    setMeta('meta[name="twitter:title"]', { content: title });
    setMeta('meta[name="twitter:description"]', { content: description });
    setMeta('meta[property="og:url"]', { content: `${BASE_URL}${pathname}` });

    if (indexable) {
      setMeta('link[rel="canonical"]', { href: `${BASE_URL}${pathname}` });
      removeMeta('meta[name="robots"]');
    } else {
      removeMeta('link[rel="canonical"]');
      setMeta('meta[name="robots"]', { content: "noindex, follow" });
    }
  }, [pathname]);

  return null;
};
