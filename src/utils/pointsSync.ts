/**
 * OBSOLETO (2026-06-17): la sincronización de puntos ahora la hace la BASE DE DATOS
 * mediante triggers (ver migración 20260617140000_fix_leaderboard_points.sql).
 *
 * Antes, esta función intentaba un upsert en `user_points` desde el cliente, pero la
 * RLS lo bloquea (la tabla es de solo lectura para el usuario) y además no tenía
 * ninguna llamada en la app. Se deja como no-op para no romper imports existentes.
 */
export const syncUserPoints = async (_userId: string): Promise<boolean> => {
  return true;
};
