
import { Card } from '@/components/ui/card';
import { UserStatsCards } from '@/components/retos/UserStatsCards';
import { LevelProgressCard } from '@/components/retos/LevelProgressCard';
import { ChallengeCard } from '@/components/retos/ChallengeCard';
import { useRetosData } from '@/hooks/useRetosData';

const Retos = () => {
  const {
    challenges,
    userProgress,
    userStats,
    loading,
    getProgressForChallenge,
    getNextLevelProgress,
    getPointsToNextLevel
  } = useRetosData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sistema de Retos</h1>
        <p className="text-gray-600">Completa desafíos y gana puntos para subir de nivel</p>
      </div>

      {/* User Stats Cards */}
      <UserStatsCards userStats={userStats} />

      {/* Level Progress Card */}
      <LevelProgressCard 
        userStats={userStats}
        getNextLevelProgress={getNextLevelProgress}
        getPointsToNextLevel={getPointsToNextLevel}
      />

      {/* Challenges */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Retos Disponibles</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((challenge, index) => {
              const progress = getProgressForChallenge(challenge.id);
              return (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  progress={progress}
                  index={index}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Retos;
