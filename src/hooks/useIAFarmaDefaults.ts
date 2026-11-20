import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'farmapro_iafarma_defaults';

export interface IAFarmaDefaults {
  farmacia: string;
  localidad: string;
  tono: string;
  /** Color corporativo principal (hex, p. ej. #0A6E4E). Vacío = paleta automática variada. */
  colorPrimario: string;
  /** Color corporativo secundario (hex). */
  colorSecundario: string;
  /** URL pública del logo subido (bucket iafarma-logos). */
  logoUrl: string;
  /** Nombre con el que la farmacia firma sus piezas (vacío = el nombre de la farmacia). */
  nombreComercial: string;
  /** Servicios validados, separados por comas. */
  servicios: string;
  /** Marcas validadas, separadas por comas. */
  marcas: string;
}

const EMPTY_DEFAULTS: IAFarmaDefaults = {
  farmacia: '',
  localidad: '',
  tono: '',
  colorPrimario: '',
  colorSecundario: '',
  logoUrl: '',
  nombreComercial: '',
  servicios: '',
  marcas: '',
};

const readFromStorage = (): IAFarmaDefaults => {
  if (typeof window === 'undefined') return { ...EMPTY_DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<IAFarmaDefaults>;
    return {
      farmacia: typeof parsed.farmacia === 'string' ? parsed.farmacia : '',
      localidad: typeof parsed.localidad === 'string' ? parsed.localidad : '',
      tono: typeof parsed.tono === 'string' ? parsed.tono : '',
      colorPrimario: typeof parsed.colorPrimario === 'string' ? parsed.colorPrimario : '',
      colorSecundario: typeof parsed.colorSecundario === 'string' ? parsed.colorSecundario : '',
      logoUrl: typeof parsed.logoUrl === 'string' ? parsed.logoUrl : '',
      nombreComercial: typeof parsed.nombreComercial === 'string' ? parsed.nombreComercial : '',
      servicios: typeof parsed.servicios === 'string' ? parsed.servicios : '',
      marcas: typeof parsed.marcas === 'string' ? parsed.marcas : '',
    };
  } catch {
    return { ...EMPTY_DEFAULTS };
  }
};

/**
 * Datos de la farmacia que IAFarma usa como predeterminados en cada generación.
 * localStorage es la caché local; la copia buena vive en `profiles`
 * (iafarma_tone, iafarma_brand_*, iafarma_logo_url) y sincroniza dispositivos.
 */
export const useIAFarmaDefaults = () => {
  const [defaults, setDefaults] = useState<IAFarmaDefaults>(readFromStorage);

  // Persistir automáticamente cada vez que cambian los datos.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    } catch {
      /* almacenamiento no disponible: se ignora */
    }
  }, [defaults]);

  const updateDefault = useCallback((key: keyof IAFarmaDefaults, value: string) => {
    setDefaults((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveDefaults = useCallback((next: IAFarmaDefaults) => {
    setDefaults(next);
  }, []);

  return { defaults, updateDefault, saveDefaults };
};

/**
 * Texto de paleta corporativa para el backend ('' si no hay colores fijados,
 * en cuyo caso IAFarma varía la paleta automáticamente en cada pieza).
 */
export const brandPaletteOf = (d: IAFarmaDefaults): string => {
  if (!d.colorPrimario) return '';
  return d.colorSecundario
    ? `primary ${d.colorPrimario}, secondary ${d.colorSecundario}`
    : `primary ${d.colorPrimario}`;
};

/** Lista separada por comas → array limpio, sin vacíos ni repetidos. */
export const listaDe = (s: string): string[] =>
  [...new Set(s.split(',').map((x) => x.trim()).filter(Boolean))];

/** Nombre que firma las piezas: el comercial si lo hay; si no, el de la farmacia. */
export const nombreEnPiezas = (d: IAFarmaDefaults): string =>
  d.nombreComercial.trim() || d.farmacia.trim();
