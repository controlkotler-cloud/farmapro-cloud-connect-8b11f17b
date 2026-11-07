import { describe, it, expect } from 'vitest';
import { cierreQuincena, esHerramientaDeLaQuincena, type RecursoQuincena } from './quincena';

const r = (over: Partial<RecursoQuincena>): RecursoQuincena => ({
  id: 'x',
  is_newsletter: true,
  newsletter_ref: 'N33',
  open_until: null,
  ...over,
});

const NOW = new Date('2026-11-10T12:00:00Z');

describe('cierreQuincena', () => {
  it('es el open_until más tardío de todos los recursos con ese ref', () => {
    const lista = [
      r({ id: 'pdf', open_until: '2026-11-24T22:59:00Z' }),
      r({ id: 'xlsx', open_until: null }),
      r({ id: 'otro', open_until: '2026-11-20T00:00:00Z' }),
      r({ id: 'ajeno', newsletter_ref: 'N32', open_until: '2026-12-31T00:00:00Z' }),
    ];
    expect(cierreQuincena('N33', lista)?.toISOString()).toBe('2026-11-24T22:59:00.000Z');
  });

  it('es null si ningún recurso del ref tiene fecha o el ref está vacío', () => {
    expect(cierreQuincena('N33', [r({ open_until: null })])).toBeNull();
    expect(cierreQuincena(null, [r({ open_until: '2026-11-24T00:00:00Z' })])).toBeNull();
  });

  it('ignora fechas inválidas', () => {
    expect(cierreQuincena('N33', [r({ open_until: 'no-es-fecha' })])).toBeNull();
  });
});

describe('esHerramientaDeLaQuincena', () => {
  const lista = [
    r({ id: 'pdf', open_until: '2026-11-24T22:59:00Z' }),
    r({ id: 'xlsx', open_until: null }),
    r({ id: 'vieja', newsletter_ref: 'N32', open_until: '2026-11-10T11:00:00Z' }),
  ];

  it('el recurso sin fecha hereda la ventana de su hermano', () => {
    expect(esHerramientaDeLaQuincena(lista[1], lista, NOW)).toBe(true);
  });

  it('abierta mientras now < cierre', () => {
    expect(esHerramientaDeLaQuincena(lista[0], lista, NOW)).toBe(true);
  });

  it('pasa a Plus justo al cierre', () => {
    expect(esHerramientaDeLaQuincena(lista[0], lista, new Date('2026-11-24T22:59:00Z'))).toBe(false);
    expect(esHerramientaDeLaQuincena(lista[0], lista, new Date('2026-11-24T22:58:59Z'))).toBe(true);
  });

  it('la quincena anterior ya cerrada es de Plus', () => {
    expect(esHerramientaDeLaQuincena(lista[2], lista, NOW)).toBe(false);
  });

  it('un recurso que no es de newsletter nunca es de la quincena', () => {
    expect(esHerramientaDeLaQuincena(r({ is_newsletter: false, open_until: '2027-01-01T00:00:00Z' }), lista, NOW)).toBe(false);
  });

  it('sin newsletter_ref no hay ventana', () => {
    expect(esHerramientaDeLaQuincena(r({ newsletter_ref: null }), lista, NOW)).toBe(false);
  });
});
