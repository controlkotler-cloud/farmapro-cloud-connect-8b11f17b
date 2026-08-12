/**
 * Para cualquier respuesta no-2xx de `supabase.functions.invoke()`, `data`
 * viene siempre `null` y el motivo real vive en `error.context` (la
 * `Response` original adjunta al `FunctionsHttpError`) — hay que leerlo
 * explícitamente, si no se pierde el mensaje que la edge function sí mandó.
 */

/** Código de estado HTTP de la respuesta fallida, si se puede determinar. */
export const extractFunctionErrorStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const ctx = (error as { context?: unknown }).context;
  if (ctx && typeof ctx === 'object' && 'status' in ctx) {
    const status = (ctx as { status?: unknown }).status;
    if (typeof status === 'number') return status;
  }
  const direct = (error as { status?: unknown }).status;
  return typeof direct === 'number' ? direct : undefined;
};

/** Mensaje `{ error: string }` del cuerpo JSON de la respuesta fallida, si lo hay. */
export const extractFunctionErrorMessage = async (error: unknown): Promise<string | undefined> => {
  if (!error || typeof error !== 'object') return undefined;
  const ctx = (error as { context?: unknown }).context;
  if (ctx && typeof (ctx as Response).json === 'function') {
    try {
      const body = await (ctx as Response).clone().json();
      if (body && typeof body === 'object' && typeof body.error === 'string') {
        return body.error;
      }
    } catch {
      /* el cuerpo no es JSON o ya se consumió: se ignora */
    }
  }
  return undefined;
};
