// =====================================================================
// Ventana de la "herramienta de la quincena" de Impulso (cuenta gratis).
// Regla (spec cuenta gratis, 07-11-2026): los recursos `is_newsletter` que
// comparten `newsletter_ref` son gratis mientras su ventana siga abierta. La
// ventana se cierra en el `open_until` MÁS TARDÍO de todos los recursos con ese
// ref (la guía PDF lo tiene; el Excel puede tenerlo a NULL). Es la misma fecha
// que usa la edge `descarga-abierta`. Cerrada la ventana, el recurso pasa a Plus.
// Función pura: sin Supabase ni React, para poder probarla.
// =====================================================================

export interface RecursoQuincena {
  id: string;
  is_newsletter: boolean;
  newsletter_ref?: string | null;
  open_until?: string | null;
}

/** Cierre de la quincena `ref`: el mayor `open_until` válido entre sus recursos. */
export function cierreQuincena(
  ref: string | null | undefined,
  recursos: RecursoQuincena[],
): Date | null {
  if (!ref) return null;
  let max = NaN;
  for (const r of recursos) {
    if (r.newsletter_ref !== ref || !r.open_until) continue;
    const t = new Date(r.open_until).getTime();
    if (Number.isNaN(t)) continue;
    if (Number.isNaN(max) || t > max) max = t;
  }
  return Number.isNaN(max) ? null : new Date(max);
}

/** ¿Es este recurso la herramienta de la quincena en curso (gratis ahora mismo)? */
export function esHerramientaDeLaQuincena(
  recurso: RecursoQuincena,
  recursos: RecursoQuincena[],
  now: Date = new Date(),
): boolean {
  if (!recurso.is_newsletter || !recurso.newsletter_ref) return false;
  const cierre = cierreQuincena(recurso.newsletter_ref, recursos);
  if (!cierre) return false;
  return now.getTime() < cierre.getTime();
}
