import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RespuestaPerfil } from '@/types/iafarmaPerfil';
import type { IAFarmaDefaults } from '@/hooks/useIAFarmaDefaults';

const BUCKET = 'iafarma-logos';

export interface FichaValidada {
  nombre: string;
  localidad: string;
  nombreComercial: string;
  tono: string;
  colorPrimario?: string;
  colorSecundario?: string;
  /** Ruta en el bucket de un logo provisional que hay que fijar. */
  logoPath?: string;
  /** URL del logo actual (provisional o ya guardado). */
  logoUrl?: string;
  /** Logo que la farmacia ha subido en la ficha. */
  logoFile?: File;
  servicios: string[];
  marcas: string[];
  web?: string;
  instagram?: string;
  fuentes: Record<string, unknown>;
}

const EXT_POR_TIPO: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif',
};

const limpiar = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))];

export const useAltaGuiada = () => {
  const { user, reloadProfile } = useAuth();
  const [buscando, setBuscando] = useState(false);

  const buscar = useCallback(
    async (datos: { nombre: string; localidad: string; web?: string; instagram?: string }): Promise<RespuestaPerfil> => {
      setBuscando(true);
      try {
        const { data, error } = await supabase.functions.invoke('iafarma-perfil', { body: datos });
        if (error) throw error;
        return data as RespuestaPerfil;
      } finally {
        setBuscando(false);
      }
    },
    [],
  );

  /** Sube el logo a `{uid}/logo.{ext}` (ruta fija, upsert) y devuelve su URL pública. */
  const fijarLogo = useCallback(async (uid: string, blob: Blob, tipo: string): Promise<string> => {
    const ext = EXT_POR_TIPO[tipo] ?? 'png';
    const path = `${uid}/logo.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: tipo });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  }, []);

  const guardar = useCallback(
    async (ficha: FichaValidada): Promise<IAFarmaDefaults> => {
      if (!user) throw new Error('Sin sesión');

      let logoUrl: string | null = ficha.logoUrl || null;
      if (ficha.logoFile) {
        logoUrl = await fijarLogo(user.id, ficha.logoFile, ficha.logoFile.type);
      } else if (ficha.logoPath?.includes('/provisional-') && ficha.logoUrl) {
        // La provisional se queda en el bucket: el cliente no tiene permiso de borrado.
        const res = await fetch(ficha.logoUrl);
        if (!res.ok) throw new Error('No se pudo copiar el logo');
        const blob = await res.blob();
        // Solo imágenes rasterizadas: un SVG en un bucket público puede llevar scripts.
        if (EXT_POR_TIPO[blob.type]) logoUrl = await fijarLogo(user.id, blob, blob.type);
        else logoUrl = null;
      }

      const nombreComercial = ficha.nombreComercial.trim() || ficha.nombre.trim();
      const { error } = await supabase
        .from('profiles')
        .update({
          pharmacy_name: ficha.nombre.trim() || null,
          pharmacy_city: ficha.localidad.trim() || null,
          iafarma_tone: ficha.tono || null,
          iafarma_brand_primary: ficha.colorPrimario || null,
          iafarma_brand_secondary: ficha.colorPrimario ? ficha.colorSecundario || null : null,
          iafarma_logo_url: logoUrl,
          iafarma_nombre_comercial: nombreComercial || null,
          iafarma_servicios: limpiar(ficha.servicios),
          iafarma_marcas: limpiar(ficha.marcas),
          iafarma_web: ficha.web?.trim() || null,
          iafarma_instagram: ficha.instagram?.trim() || null,
          iafarma_perfil_fuentes: ficha.fuentes as never,
          iafarma_perfil_validado_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;

      await reloadProfile();

      // Lo que el generador usa desde ya (el que llama lo guarda con saveDefaults).
      return {
        farmacia: ficha.nombre.trim(),
        localidad: ficha.localidad.trim(),
        tono: ficha.tono,
        colorPrimario: ficha.colorPrimario || '',
        colorSecundario: ficha.colorPrimario ? ficha.colorSecundario || '' : '',
        logoUrl: logoUrl || '',
        nombreComercial,
        servicios: limpiar(ficha.servicios).join(', '),
        marcas: limpiar(ficha.marcas).join(', '),
      };
    },
    [user, reloadProfile, fijarLogo],
  );

  return { buscar, guardar, buscando };
};
