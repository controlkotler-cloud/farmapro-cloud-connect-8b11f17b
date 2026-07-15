
import { motion } from 'framer-motion';

export const FarmaciasHeader = () => {
  return (
    <motion.div 
      className="bg-gradient-to-r from-brand-soft to-secondary rounded-xl p-8 shadow-lg border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Farmacias en Venta</h1>
        <p className="text-gray-600">Encuentra tu farmacia ideal</p>
      </div>
    </motion.div>
  );
};
