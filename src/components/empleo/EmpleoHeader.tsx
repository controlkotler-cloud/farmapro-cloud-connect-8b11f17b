
import { motion } from 'framer-motion';

export const EmpleoHeader = () => {
  return (
    <motion.div
      className="bg-salvia-soft rounded-xl p-8 shadow-lg ring-1 ring-salvia/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-salvia rounded-r-full shadow-lg"></div>
        <div className="ml-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Bolsa de Empleo</h1>
          <p className="text-muted-foreground">Encuentra oportunidades laborales en el sector farmacéutico</p>
        </div>
      </div>
    </motion.div>
  );
};
