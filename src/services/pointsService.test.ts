import { describe, it, expect } from 'vitest';
import {
  getLevelInfo,
  getNextLevelInfo,
  getNextLevelProgress,
  getPointsToNextLevel,
  LEVELS,
} from './pointsService';

describe('pointsService', () => {
  it('getLevelInfo mapea puntos al nivel correcto (límites incluidos)', () => {
    expect(getLevelInfo(0).level).toBe(1);
    expect(getLevelInfo(99).level).toBe(1);
    expect(getLevelInfo(100).level).toBe(2);
    expect(getLevelInfo(299).level).toBe(2);
    expect(getLevelInfo(300).level).toBe(3);
    expect(getLevelInfo(2000).level).toBe(6);
    expect(getLevelInfo(999999).level).toBe(6);
  });

  it('getNextLevelInfo devuelve el siguiente nivel o null en el máximo', () => {
    expect(getNextLevelInfo(0)?.level).toBe(2);
    expect(getNextLevelInfo(2000)).toBeNull();
  });

  it('getPointsToNextLevel calcula los puntos restantes', () => {
    expect(getPointsToNextLevel(0)).toBe(100);
    expect(getPointsToNextLevel(250)).toBe(50); // siguiente nivel (3) en 300
    expect(getPointsToNextLevel(2000)).toBe(0); // ya en el máximo
  });

  it('getNextLevelProgress queda acotado entre 0 y 100', () => {
    expect(getNextLevelProgress(0)).toBe(0);
    expect(getNextLevelProgress(50)).toBe(50);
    expect(getNextLevelProgress(2000)).toBe(100); // máximo
    const mid = getNextLevelProgress(150);
    expect(mid).toBeGreaterThanOrEqual(0);
    expect(mid).toBeLessThanOrEqual(100);
  });

  it('LEVELS es continuo y estrictamente creciente', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minPoints).toBeGreaterThan(LEVELS[i - 1].minPoints);
      expect(LEVELS[i].minPoints).toBe(LEVELS[i - 1].maxPoints + 1);
    }
  });
});
