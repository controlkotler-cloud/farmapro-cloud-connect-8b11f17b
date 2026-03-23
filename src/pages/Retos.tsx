
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
        className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-8 shadow-lg ring-1 ring-yellow-200"
        variants={itemVariants}
      >
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-r-full shadow-lg" />
          <div className="ml-6">
            <h1 className="text-3xl font-bold text-foreground">Retos y Desafíos</h1>
            <p className="text-muted-foreground">Completa retos, gana insignias y sube en el ranking</p>
          </div>
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
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-6 shadow-lg ring-1 ring-indigo-200">
              <div className="relative mb-6">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-r-full shadow-lg" />
                <div className="ml-6 flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Retos Permanentes</h2>
                    <p className="text-sm text-muted-foreground">Estos retos siempre están disponibles</p>
                  </div>
                </div>
              </div>
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants}>
                {permanentChallenges.map((challenge, index) => (
                  <motion.div key={challenge.id} variants={itemVariants} transition={{ delay: index * 0.1 }}>
                    <ChallengeCard challenge={challenge} progress={getProgressForChallenge(challenge.id)} index={index} />
                  </motion.div>
                ))}
              </motion.div>
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
