import { describe, expect, it } from 'vitest';
import { PIECE_TYPES } from './pieceTypes';

const post = () => PIECE_TYPES.find((p) => p.id === 'post')!;

describe('pieza post', () => {
  it('el prompt no lleva texto de ejemplo que acabe pintado en la imagen', () => {
    const p = post().buildPrompt({} as never);
    expect(p).not.toMatch(/Escribe aquí/i);
    expect(p).not.toMatch(/si quieres que salgan literales/i);
  });

  it('enseña la ayuda en pantalla', () => {
    expect(post().promptHelp).toBe('Si escribes aquí tus consejos, saldrán tal cual en la imagen.');
  });
});
