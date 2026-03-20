import { motion } from 'framer-motion';

export const CreativeHeader = () => {
  return (
    <motion.div 
      className="bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl p-8 shadow-lg ring-1 ring-cyan-200 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-r-full shadow-lg"></div>
        <div className="ml-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IAFarma</h1>
          <p className="text-gray-600">Genera contenido profesional para tu farmacia con inteligencia artificial</p>
        </div>
      </div>
    </motion.div>
  );
};
