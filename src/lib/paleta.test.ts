import { describe, expect, it } from 'vitest';
import { combinarPaleta, paletaDeImagen } from './paleta';

function pixeles(colores: [number, number, number, number][]): Uint8ClampedArray {
  return new Uint8ClampedArray(colores.flat());
}

describe('paletaDeImagen', () => {
  it('ignora el blanco', () => {
    expect(paletaDeImagen(pixeles(Array(16).fill([255, 255, 255, 255])))).toEqual([]);
  });

  it('cuantiza al centro del cubo e ignora lo transparente', () => {
    const px = pixeles([
      ...Array(8).fill([0x1a, 0x7f, 0x5a, 255]),
      ...Array(8).fill([0x1a, 0x7f, 0x5a, 0]),
    ]);
    expect(paletaDeImagen(px)).toEqual(['#187858']);
  });

  it('ordena por frecuencia y corta en n', () => {
    const px = pixeles([
      ...Array(3).fill([200, 30, 30, 255]),
      ...Array(5).fill([30, 30, 200, 255]),
      ...Array(1).fill([30, 200, 30, 255]),
    ]);
    expect(paletaDeImagen(px, 2)).toEqual(['#1818c8', '#c81818']);
  });
});

describe('combinarPaleta', () => {
  it('sin logo, los dos primeros del CSS', () => {
    expect(combinarPaleta([], ['#aa0000', '#00aa00'])).toEqual({ primario: '#aa0000', secundario: '#00aa00' });
  });

  it('sin nada, vacío', () => {
    expect(combinarPaleta([], [])).toEqual({});
  });

  it('un color del logo que está en el CSS manda, con el hex exacto del CSS', () => {
    expect(combinarPaleta(['#c81818', '#187858'], ['#1a7f5a', '#333399'])).toEqual({
      primario: '#1a7f5a',
      secundario: '#c81818',
    });
  });

  it('sin coincidencia, los dos primeros del logo', () => {
    expect(combinarPaleta(['#c81818', '#187858'], ['#3333ff'])).toEqual({
      primario: '#c81818',
      secundario: '#187858',
    });
  });
});
