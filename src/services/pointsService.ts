
export const getNextLevelProgress = (totalPoints: number): number => {
  // Cada nivel requiere 1000 puntos
  // Nivel 1: 0-999 puntos, Nivel 2: 1000-1999 puntos, etc.
  const pointsInCurrentLevel = totalPoints % 1000;
  const progressPercentage = (pointsInCurrentLevel / 1000) * 100;
  
  console.log('Progress calculation:', {
    totalPoints,
    pointsInCurrentLevel,
    progressPercentage
  });
  
  return progressPercentage;
};

export const getPointsToNextLevel = (totalPoints: number): number => {
  // Puntos necesarios para llegar al siguiente nivel
  const pointsInCurrentLevel = totalPoints % 1000;
  const pointsNeeded = 1000 - pointsInCurrentLevel;
  
  console.log('Points to next level:', {
    totalPoints,
    pointsInCurrentLevel,
    pointsNeeded
  });
  
  return pointsNeeded;
};
