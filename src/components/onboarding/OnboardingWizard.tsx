
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Users, Download, Sparkles, User, Trophy, Pill, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingStep {
  title: string;
  subtitle?: string;
  text: string;
  highlight?: string;
  icons: React.ReactNode;
  bgClass: string;
  cta?: string;
}

const steps: OnboardingStep[] = [
  {
    title: '¡Bienvenido a Farmapro!',
    subtitle: 'Tu plataforma de formación y herramientas para farmacia',
    text: 'Vamos a enseñarte en 1 minuto todo lo que puedes hacer aquí. ¿Empezamos?',
    icons: <Pill className="h-20 w-20" />,
    bgClass: 'from-emerald-50 to-emerald-100/50',
    cta: 'Empezar tour',
  },
  {
    title: 'Cursos prácticos para tu farmacia',
    text: 'Desde Instagram y Google hasta gestión financiera y normativa. Cada curso tiene módulos con contenido real, no teoría vacía. Los cursos Premium son exclusivos para titulares.',
    highlight: '10 cursos disponibles · Desde 100 hasta 180 minutos · Con quiz al final',
    icons: <GraduationCap className="h-20 w-20" />,
    bgClass: 'from-blue-50 to-blue-100/50',
    cta: 'Ver cursos',
  },
  {
    title: 'Conecta con otros profesionales',
    text: 'El foro de Farmapro es tu espacio para preguntar, compartir experiencias y aprender de otros compañeros. Marketing, gestión, normativa, atención farmacéutica... todo tiene su categoría.',
    highlight: '7 categorías · 24 hilos activos · Pregunta lo que quieras',
    icons: <Users className="h-20 w-20" />,
    bgClass: 'from-amber-50 to-amber-100/50',
    cta: 'Explorar el foro',
  },
  {
    title: 'Descargables y herramientas listas para usar',
    text: 'Checklists, plantillas, protocolos y calculadoras que puedes usar hoy mismo en tu farmacia. Y con IAFarma, genera contenido para redes sociales en segundos.',
    highlight: '9 recursos descargables · IAFarma con IA · Todo incluido en tu suscripción',
    icons: (
      <div className="flex gap-3">
        <Download className="h-16 w-16" />
        <Sparkles className="h-16 w-16" />
      </div>
    ),
    bgClass: 'from-purple-50 to-purple-100/50',
    cta: 'Ver recursos',
  },
  {
    title: 'Personaliza tu experiencia',
    text: 'Completa tu perfil, marca tus intereses y empieza a ganar puntos con los retos semanales. Cuanto más participas, más aprendes.',
    highlight: 'Completa tu perfil para recibir recomendaciones personalizadas',
    icons: (
      <div className="flex gap-3">
        <User className="h-16 w-16" />
        <Trophy className="h-16 w-16" />
      </div>
    ),
    bgClass: 'from-emerald-50 to-green-100/50',
    cta: '¡Empezar a explorar!',
  },
];

export const OnboardingWizard = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  const markCompleted = async () => {
    if (user) {
      await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true } as any)
        .eq('id', user.id);
    }
    onComplete();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      markCompleted();
    }
  };

  const step = steps[currentStep];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`relative w-full max-w-lg rounded-2xl bg-gradient-to-br ${step.bgClass} border border-border shadow-2xl overflow-hidden`}
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-8 bg-primary'
                  : i < currentStep
                  ? 'w-2 bg-primary/60'
                  : 'w-2 bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>

        <div className="px-6 md:px-10 pt-6 pb-8 flex flex-col items-center text-center">
          {/* Icon */}
          <div className="text-primary mb-6">{step.icons}</div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {step.title}
          </h2>

          {step.subtitle && (
            <p className="text-muted-foreground text-sm md:text-base mb-4">{step.subtitle}</p>
          )}

          {/* Body */}
          <p className="text-muted-foreground leading-relaxed mb-4 max-w-md">
            {step.text}
          </p>

          {/* Highlight */}
          {step.highlight && (
            <div className="bg-background/70 border border-border rounded-lg px-4 py-3 mb-6 text-sm font-medium text-foreground">
              {step.highlight}
            </div>
          )}

          {/* CTA */}
          <Button onClick={handleNext} size="lg" className="w-full max-w-xs gap-2 text-base">
            {step.cta}
            {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>

          {/* Skip */}
          <button
            onClick={markCompleted}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {currentStep === 0 ? 'Saltar, ya lo exploro yo' : 'Saltar onboarding'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
