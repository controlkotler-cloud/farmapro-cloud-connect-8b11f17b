
import { motion } from 'framer-motion';
import { useRetosData } from '@/hooks/useRetosData';
import { LevelProgressCard } from '@/components/retos/LevelProgressCard';
import { UserStatsCards } from '@/components/retos/UserStatsCards';
import { ChallengeCard } from '@/components/retos/ChallengeCard';
import { Trophy, Target } from 'lucide-react';

export const Retos = () => {
  const { 
    challenges, 
    userStats, 
    loading, 
    getProgressForChallenge 
  } = useRetosData();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-xl"></div>
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
      {/* Header with gradient background */}
      <motion.div 
        className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-8 shadow-lg ring-1 ring-yellow-200"
        variants={itemVariants}
      >
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-r-full shadow-lg"></div>
          <div className="ml-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-lg">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Retos y Desafíos</h1>
                <p className="text-gray-600">Completa retos y gana puntos para subir de nivel</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Level Progress */}
      <motion.div variants={itemVariants}>
        <LevelProgressCard userStats={userStats} />
      </motion.div>

      {/* User Stats */}
      <motion.div variants={itemVariants}>
        <UserStatsCards userStats={userStats} />
      </motion.div>

      {/* Available Challenges */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-6 shadow-lg ring-1 ring-indigo-200">
          <div className="relative mb-6">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-r-full shadow-lg"></div>
            <div className="ml-6 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Retos Disponibles</h2>
            </div>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {challenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
              >
                <ChallengeCard 
                  challenge={challenge} 
                  progress={getProgressForChallenge(challenge.id)}
                  index={index}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
