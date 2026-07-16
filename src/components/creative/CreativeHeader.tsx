import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, TrendingUp, CheckCircle } from 'lucide-react';

export const CreativeHeader = () => {
  const badges = [
    { icon: ShieldCheck, text: 'Pensado para tu farmacia' },
    { icon: TrendingUp, text: 'Adaptado al algoritmo actual' },
    { icon: CheckCircle, text: 'Contenido listo para publicar' },
  ];

  return (
    <motion.div
      className="bg-ciruela-soft rounded-2xl p-8 shadow-soft"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-ciruela text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="inline-flex rounded-full bg-ciruela px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-primary-foreground">
          IAFarma
        </span>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
        Tu asistente <em className="italic-display">creativo</em>
      </h1>
      <p className="mt-1.5 mb-6 text-muted-foreground">Textos e imágenes para tu farmacia, con IA.</p>

      <div className="flex flex-wrap gap-3">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm text-muted-foreground shadow-soft ring-1 ring-border"
          >
            <badge.icon className="h-4 w-4 text-ciruela flex-shrink-0" />
            <span>{badge.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
