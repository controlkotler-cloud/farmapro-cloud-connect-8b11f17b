
import { motion } from 'framer-motion';
import { useRetosData } from '@/hooks/useRetosData';
import { useWeeklyChallenges } from '@/hooks/useWeeklyChallenges';
import { LevelProgressCard } from '@/components/retos/LevelProgressCard';
import { UserStatsCards } from '@/components/retos/UserStatsCards';
import { ChallengeCard } from '@/components/retos/ChallengeCard';
import { BadgesSection } from '@/components/retos/BadgesSection';
import { LeaderboardSection } from '@/components/retos/LeaderboardSection';
import { WeeklyChallengesSection } from '@/components/retos/WeeklyChallengesSection';
import { Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Retos = () => {
  const { 
    challenges, 
    userStats, 
    loading, 
    getProgressForChallenge 
  } = useRetosData();

  const { weeklyChallenges, loading: weeklyLoading } = useWeeklyChallenges();

  // Filter out weekly challenges from permanent list
  const permanentChallenges = challenges.filter((c: any) => !c.is_weekly);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4"
        variants={itemVariants}
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
            Retos que <em className="italic-display">suman</em>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pequeños desafíos, puntos e insignias de verdad.
          </p>
        </div>
      </motion.div>

      {/* Level + Stats */}
      <motion.div variants={itemVariants}>
        <LevelProgressCard userStats={userStats} />
      </motion.div>
      <motion.div variants={itemVariants}>
        <UserStatsCards userStats={userStats} />
      </motion.div>

      {/* Weekly Challenges */}
      <motion.div variants={itemVariants}>
        <WeeklyChallengesSection challenges={weeklyChallenges} loading={weeklyLoading} />
      </motion.div>

      {/* Tabs: Retos Permanentes | Insignias | Ranking */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="challenges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="challenges">Retos Permanentes</TabsTrigger>
            <TabsTrigger value="badges">Insignias</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
          </TabsList>

          <TabsContent value="challenges">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-miel-soft p-2">
                  <Target className="h-5 w-5 text-miel" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-foreground">Retos Permanentes</h2>
                  <p className="text-sm text-muted-foreground">Estos retos siempre están disponibles.</p>
                </div>
              </div>
              {permanentChallenges.length > 0 ? (
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants}>
                  {permanentChallenges.map((challenge, index) => (
                    <motion.div key={challenge.id} variants={itemVariants} transition={{ delay: index * 0.1 }}>
                      <ChallengeCard challenge={challenge} progress={getProgressForChallenge(challenge.id)} index={index} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Los retos vuelven en breve. Mientras tanto, suma puntos completando cursos y participando en el foro.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="badges">
            <BadgesSection />
          </TabsContent>

          <TabsContent value="ranking">
            <LeaderboardSection />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};
