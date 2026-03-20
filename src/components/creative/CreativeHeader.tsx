import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, TrendingUp, CheckCircle } from 'lucide-react';

export const CreativeHeader = () => {
  const badges = [
    { icon: ShieldCheck, text: 'Cumple normativa farmacéutica' },
    { icon: TrendingUp, text: 'Adaptado al algoritmo 2026' },
    { icon: CheckCircle, text: 'Contenido listo para publicar' },
  ];

  return (
    <motion.div
      className="bg-gradient-to-br from-green-50 via-white to-emerald-50 rounded-2xl p-8 shadow-sm ring-1 ring-green-100"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">IAFarma</h1>
      </div>
      <p className="text-gray-500 mb-6 ml-[52px]">Tu asistente de contenido con inteligencia artificial</p>

      <div className="flex flex-wrap gap-3 ml-[52px]">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-sm ring-1 ring-gray-100"
          >
            <badge.icon className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span>{badge.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
