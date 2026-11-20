// Tipos del alta guiada de IAFarma. Sin imports de Deno: lo comparten la edge
// function `iafarma-perfil` y los tests de vitest.

export type Fuente = 'web' | 'instagram' | 'manual';

/** Un dato de la ficha con su procedencia. `cita` es el texto literal de la
 *  fuente que lo justifica; el servidor descarta lo que no aparece tal cual. */
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
