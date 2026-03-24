export interface LevelInfo {
  level: number;
  name: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Alumno', icon: '🌱', minPoints: 0, maxPoints: 99 },
  { level: 2, name: 'Auxiliar Digital', icon: '💊', minPoints: 100, maxPoints: 299 },
  { level: 3, name: 'Técnico Experto', icon: '🔬', minPoints: 300, maxPoints: 599 },
  { level: 4, name: 'Farmacéutico Pro', icon: '⚕️', minPoints: 600, maxPoints: 999 },
  { level: 5, name: 'Farmacéutico Senior', icon: '🏅', minPoints: 1000, maxPoints: 1999 },
  { level: 6, name: 'Referente del Sector', icon: '👑', minPoints: 2000, maxPoints: Infinity },
];

export const getLevelInfo = (totalPoints: number): LevelInfo => {
  return LEVELS.find(l => totalPoints >= l.minPoints && totalPoints <= l.maxPoints) || LEVELS[0];
};

export const getNextLevelInfo = (totalPoints: number): LevelInfo | null => {
  const current = getLevelInfo(totalPoints);
  return LEVELS.find(l => l.level === current.level + 1) || null;
};

export const getNextLevelProgress = (totalPoints: number): number => {
  const current = getLevelInfo(totalPoints);
  const next = getNextLevelInfo(totalPoints);
  if (!next) return 100;
  const range = next.minPoints - current.minPoints;
  const progress = totalPoints - current.minPoints;
  return Math.min(Math.round((progress / range) * 100), 100);
};

export const getPointsToNextLevel = (totalPoints: number): number => {
  const next = getNextLevelInfo(totalPoints);
  if (!next) return 0;
  return next.minPoints - totalPoints;
};

// Points values for different actions
export const POINT_VALUES = {
  MODULE_COMPLETE: 10,
  COURSE_COMPLETE: 50,
  QUIZ_PASS: 20,
  QUIZ_BONUS_90: 10,
  FORUM_POST: 5,
  FORUM_REPLY: 3,
  FORUM_LIKE: 1,
  RESOURCE_DOWNLOAD: 2,
  AI_CONTENT: 5,
  DAILY_LOGIN: 1,
} as const;
