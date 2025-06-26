import { Card } from '@/components/ui/card';
import { UserStatsCards } from '@/components/retos/UserStatsCards';
import { LevelProgressCard } from '@/components/retos/LevelProgressCard';
import { ChallengeCard } from '@/components/retos/ChallengeCard';
import { useRetosData } from '@/hooks/useRetosData';
import { MessageSquare, BookOpen, Gift, Trophy } from 'lucide-react';
import { useEffect } from 'react';

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

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Categorizar retos por tipo
  const challengesByType = {
    forum: challenges.filter(c => c.type === 'forum_post' || c.type === 'forum_reply'),
    course: challenges.filter(c => c.type === 'course_completed' || c.type === 'course_started'),
    resource: challenges.filter(c => c.type === 'resource_downloaded'),
    other: challenges.filter(c => !['forum_post', 'forum_reply', 'course_completed', 'course_started', 'resource_downloaded'].includes(c.type))
  };

  const CategorySection = ({ 
    title, 
    icon: Icon, 
    emoji, 
    challenges: categoryChallenges, 
    color 
  }: { 
    title: string; 
    icon: any; 
    emoji: string; 
    challenges: any[]; 
    color: string;
  }) => {
    if (categoryChallenges.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {emoji} {title}
          </h3>
          <span className="text-sm text-gray-500">({categoryChallenges.length} retos)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoryChallenges.map((challenge, index) => {
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
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sistema de Retos farmapro</h1>
        <p className="text-gray-600">Completa desafíos y gana puntos para subir de nivel en la comunidad</p>
      </div>

      {/* User Stats Cards */}
      <UserStatsCards userStats={userStats} />

      {/* Level Progress Card */}
      <LevelProgressCard 
        userStats={userStats}
        getNextLevelProgress={getNextLevelProgress}
        getPointsToNextLevel={getPointsToNextLevel}
      />

      {/* Challenges by Category */}
      <div className="space-y-8">
        <div className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-yellow-600" />
          <h2 className="text-2xl font-bold text-gray-900">Retos Disponibles</h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Retos de Comunidad */}
            <CategorySection
              title="Retos de Comunidad"
              icon={MessageSquare}
              emoji="💬"
              challenges={challengesByType.forum}
              color="bg-purple-100 text-purple-600"
            />

            {/* Retos de Formación */}
            <CategorySection
              title="Retos de Formación"
              icon={BookOpen}
              emoji="📚"
              challenges={challengesByType.course}
              color="bg-blue-100 text-blue-600"
            />

            {/* Retos de Recursos */}
            <CategorySection
              title="Retos de Recursos"
              icon={Gift}
              emoji="📁"
              challenges={challengesByType.resource}
              color="bg-green-100 text-green-600"
            />

            {/* Otros Retos */}
            {challengesByType.other.length > 0 && (
              <CategorySection
                title="Otros Retos"
                icon={Trophy}
                emoji="🏆"
                challenges={challengesByType.other}
                color="bg-orange-100 text-orange-600"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Retos;
