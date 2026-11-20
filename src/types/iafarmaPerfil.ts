// Copia de supabase/functions/_shared/iafarmaPerfil/tipos.ts para el frontend
// (el alias de Vite no llega a supabase/). Si cambia uno, cambia el otro.

export type Fuente = 'web' | 'instagram' | 'manual';

export interface Dato<T> {
  valor: T;
  fuente: Fuente;
  cita?: string;
}

export interface PropuestaPerfil {
  nombreComercial?: Dato<string>;
  localidad?: Dato<string>;
  tono?: Dato<string>;
  servicios: Dato<string>[];
  marcas: Dato<string>[];
  web?: string;
  instagram?: string;
  logoProvisional?: { url: string; path: string; fuente: Fuente };
  coloresCss: string[];
  fuentesFallidas: { fuente: Fuente; motivo: string }[];
}

export type RespuestaPerfil =
  | { estado: 'ok'; propuesta: PropuestaPerfil }
  | { estado: 'limite'; mensaje: string };
