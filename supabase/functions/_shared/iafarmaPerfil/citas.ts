// Control de lo que propone el modelo: solo pasa lo que tiene cita literal en
// su fuente. Sin imports de Deno.
import type { Dato, Fuente } from './tipos.ts';

/** Minúsculas, sin acentos, comillas unificadas y espacios colapsados. */
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’´`]/g, "'")
    .replace(/[“”«»]/g, '"')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Una cita de menos de 4 caracteres no demuestra nada. */
const CITA_MINIMA = 4;

export function filtrarConCita(
  items: Dato<string>[],
  textos: Partial<Record<Fuente, string>>,
): Dato<string>[] {
  const norm: Partial<Record<Fuente, string>> = {};
  for (const [f, t] of Object.entries(textos) as [Fuente, string | undefined][]) {
    if (t) norm[f] = normalizar(t);
  }
  return items.filter((d) => {
    if (!d.cita || !d.valor?.trim()) return false;
    const cita = normalizar(d.cita);
    const texto = norm[d.fuente];
    return cita.length >= CITA_MINIMA && !!texto && texto.includes(cita);
  });
}

/** Veto de los robots Julia y Celia (regla de MKPRO). El blíster Celia sí vale. */
export function quitarVetadas(items: Dato<string>[]): Dato<string>[] {
  return items.filter((d) => {
    const v = normalizar(d.valor);
    if (/\brobot (julia|celia)\b/.test(v)) return false;
    if (/\bblister celia\b/.test(v)) return true;
    return !/\b(julia|celia)\b/.test(v);
  });
}
