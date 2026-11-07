import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAccessState, parseModoGratis } from './plans';

const NOW = new Date('2026-11-10T12:00:00Z');
const dias = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

describe('parseModoGratis', () => {
  it('solo "permanente" activa la cuenta gratis; todo lo demás es muro', () => {
    expect(parseModoGratis('permanente')).toBe('permanente');
    expect(parseModoGratis('"permanente"')).toBe('permanente');
    expect(parseModoGratis('muro')).toBe('muro');
    expect(parseModoGratis(undefined)).toBe('muro');
    expect(parseModoGratis(null)).toBe('muro');
    expect(parseModoGratis('')).toBe('muro');
    expect(parseModoGratis('PERMANENTE ')).toBe('muro');
    expect(parseModoGratis(true)).toBe('muro');
  });
});

describe('getAccessState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('plan de pago y admin: paid en cualquier modo', () => {
    for (const modo of ['muro', 'permanente'] as const) {
      expect(getAccessState('plus', dias(90), null, modo)).toBe('paid');
      expect(getAccessState('equipo', dias(90), null, modo)).toBe('paid');
      expect(getAccessState('admin', dias(90), null, modo)).toBe('paid');
    }
  });

  it('dentro de los 30 días: free_trial en cualquier modo', () => {
    expect(getAccessState('freemium', dias(10), null, 'muro')).toBe('free_trial');
    expect(getAccessState('freemium', dias(10), null, 'permanente')).toBe('free_trial');
    expect(getAccessState('freemium', dias(29), null, 'permanente')).toBe('free_trial');
  });

  it('sin fecha de alta: free_trial', () => {
    expect(getAccessState('freemium', null, null, 'permanente')).toBe('free_trial');
  });

  it('prueba terminada en modo permanente: gratis', () => {
    expect(getAccessState('freemium', dias(31), null, 'permanente')).toBe('gratis');
  });

  it('prueba terminada en modo muro (o sin modo): free_locked, como hoy', () => {
    expect(getAccessState('freemium', dias(31), null, 'muro')).toBe('free_locked');
    expect(getAccessState('freemium', dias(31), null)).toBe('free_locked');
  });

  it('una concesión (trial_ends_at) alarga la prueba', () => {
    const futuro = new Date(NOW.getTime() + 5 * 86_400_000).toISOString();
    expect(getAccessState('freemium', dias(60), futuro, 'permanente')).toBe('free_trial');
    const pasado = new Date(NOW.getTime() - 1 * 86_400_000).toISOString();
    expect(getAccessState('freemium', dias(60), pasado, 'permanente')).toBe('gratis');
  });
});
