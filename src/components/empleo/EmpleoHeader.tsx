
import { motion } from 'framer-motion';

export const EmpleoHeader = () => {
  return (
    <motion.div
      className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
          Empleo <em className="italic-display">en farmacia</em>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ofertas y candidaturas del sector, sin ruido.
        </p>
      </div>
    </motion.div>
  );
};
