// Interruptor de la cuenta gratis: system_settings(category='subscription', key='modo_gratis').
// 'permanente' = la prueba terminada pasa a cuenta gratis; cualquier otra cosa (o falta
// de fila) = 'muro', el comportamiento de siempre. Mismo criterio que parseModoGratis
// de src/lib/plans.ts.
export type ModoGratis = 'muro' | 'permanente';

export const MSG_IA_EN_PLUS =
  'La IA de farmapro está en Plus. Tu cuenta gratis incluye la herramienta de Impulso de cada quincena y el cajón de la Rebotica del mes.';

// deno-lint-ignore no-explicit-any
export async function readModoGratis(client: any): Promise<ModoGratis> {
  try {
    const { data } = await client
      .from('system_settings')
      .select('value')
      .eq('category', 'subscription')
      .eq('key', 'modo_gratis')
      .maybeSingle();
    let v = data?.value;
    if (typeof v === 'string') {
      try { v = JSON.parse(v); } catch { /* ya era texto plano */ }
    }
    return v === 'permanente' ? 'permanente' : 'muro';
  } catch {
    return 'muro';
  }
}
