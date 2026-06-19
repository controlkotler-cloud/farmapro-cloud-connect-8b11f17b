import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'farmapro_iafarma_defaults';

export interface IAFarmaDefaults {
  farmacia: string;
  localidad: string;
  tono: string;
}

const EMPTY_DEFAULTS: IAFarmaDefaults = {
  farmacia: '',
  localidad: '',
  tono: '',
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
    };
  } catch {
    return { ...EMPTY_DEFAULTS };
  }
};

/**
 * Datos de la farmacia que IAFarma usa como predeterminados en cada generación.
 * Persisten entre sesiones en localStorage (clave 'farmapro_iafarma_defaults').
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
