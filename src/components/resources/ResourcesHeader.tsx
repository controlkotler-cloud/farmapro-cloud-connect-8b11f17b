
import { motion } from 'framer-motion';

export const ResourcesHeader = () => {
  return (
    <motion.div 
      className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-8 shadow-lg ring-1 ring-purple-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-purple-400 to-purple-600 rounded-r-full shadow-lg"></div>
        <div className="ml-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recursos Descargables</h1>
          <p className="text-gray-600">Descarga plantillas, guías y herramientas para impulsar tu farmacia</p>
        </div>
      </div>
    </motion.div>
  );
};
