
import { motion } from 'framer-motion';

interface CommunityHeaderProps {
  userLevel: number;
  userPoints: number;
}

export const CommunityHeader = ({ userLevel, userPoints }: CommunityHeaderProps) => {
  return (
    <motion.div 
      className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl p-8 shadow-lg ring-1 ring-pink-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-pink-400 to-pink-600 rounded-r-full shadow-lg"></div>
        <div className="ml-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comunidad farmapro</h1>
          <p className="text-gray-600 mb-4">Conecta con profesionales farmacéuticos, comparte experiencias y aprende juntos</p>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-white/80 rounded-lg px-4 py-2 shadow-sm">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Nivel {userLevel}</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/80 rounded-lg px-4 py-2 shadow-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">{userPoints} puntos</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
