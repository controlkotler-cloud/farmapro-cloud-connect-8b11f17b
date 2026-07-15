import { motion } from 'framer-motion';
export const CommunityHeader = () => {
  return <motion.div className="bg-terracota-soft rounded-xl p-8 shadow-lg" initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }}>
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-terracota rounded-r-full shadow-lg"></div>
        <div className="ml-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Comunidad farmapro</h1>
          <p className="text-muted-foreground">Conecta con profesionales como tú, comparte experiencias y crea lazos.</p>
        </div>
      </div>
    </motion.div>;
};