
import { motion } from 'framer-motion';

export const EmpleoHeader = () => {
  return (
    <motion.div 
      className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8 shadow-lg ring-1 ring-blue-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-lg"></div>
        <div className="ml-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bolsa de Empleo</h1>
          <p className="text-gray-600">Encuentra oportunidades laborales en el sector farmacéutico</p>
        </div>
      </div>
    </motion.div>
  );
};
