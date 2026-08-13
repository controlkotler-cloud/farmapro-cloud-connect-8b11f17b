
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Users, Download, Sparkles, User, Trophy, Pill, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EMPLOYEES_COUNT_OPTIONS, SPECIALTY_OPTIONS } from '@/lib/pharmacyProfile';

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
    title: '¡Bienvenido a farmapro!',
    subtitle: 'Tu plataforma de formación y herramientas para farmacia',
    text: 'Vamos a enseñarte en 1 minuto todo lo que puedes hacer aquí. ¿Empezamos?',
    icons: <Pill className="h-20 w-20" />,
    bgClass: 'from-brand-soft to-secondary',
    cta: 'Empezar tour',
  },
  {
    title: 'Cursos prácticos para tu farmacia',
    text: 'Desde Instagram y Google hasta gestión financiera y normativa. Cada curso tiene módulos con contenido real, no teoría vacía. Los cursos Premium están incluidos en los planes Plus y Equipo.',
    highlight: 'Cursos por niveles · Módulos con contenido real · Con cuestionario al final',
    icons: <GraduationCap className="h-20 w-20" />,
    bgClass: 'from-brand-soft to-secondary',
    cta: 'Ver cursos',
  },
  {
    title: 'Conecta con otros profesionales',
    text: 'El foro de farmapro es tu espacio para preguntar, compartir experiencias y aprender de otros compañeros. Marketing, gestión, normativa, atención farmacéutica... todo tiene su categoría.',
    highlight: 'Varias categorías · Comparte experiencias · Aprende de otros compañeros',
    icons: <Users className="h-20 w-20" />,
    bgClass: 'from-brand-soft to-secondary',
    cta: 'Explorar el foro',
  },
  {
    title: 'Descargables y herramientas listas para usar',
    text: 'Checklists, plantillas, protocolos y calculadoras que puedes usar hoy mismo en tu farmacia. Y con IAFarma, genera contenido para redes sociales en segundos.',
    highlight: 'Plantillas y checklists listas para usar · Asistente con IA · Incluido en tu plan',
    icons: (
      <div className="flex gap-3">
        <Download className="h-16 w-16" />
        <Sparkles className="h-16 w-16" />
      </div>
    ),
    bgClass: 'from-brand-soft to-secondary',
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
    bgClass: 'from-brand-soft to-secondary',
    cta: '¡Empezar a explorar!',
  },
];

export const OnboardingWizard = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  // Fase 1 del perfil de farmacia (12-08-2026): se piden aquí, en el momento
  // de mayor disposición a rellenarlos, aunque la recomendación real con
  // ellos llegue en fase 2. Todos opcionales — "Saltar" no los exige.
  const [employeesCount, setEmployeesCount] = useState('');
  const [specialtyAreas, setSpecialtyAreas] = useState<string[]>([]);
  const [city, setCity] = useState('');

  const markCompleted = async () => {
    if (user) {
      await supabase
        .from('profiles')
        .update({
          has_completed_onboarding: true,
          ...(employeesCount ? { employees_count: employeesCount } : {}),
          ...(specialtyAreas.length > 0 ? { specialty_areas: specialtyAreas } : {}),
          ...(city.trim() ? { pharmacy_city: city.trim() } : {}),
        } as any)
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

          {/* Perfil de farmacia (solo en el último paso): 3 campos opcionales,
              base de la personalización que llegará en fase 2. */}
          {currentStep === steps.length - 1 && (
            <div className="w-full max-w-sm space-y-4 text-left mb-6">
              <div className="space-y-1.5">
                <Label htmlFor="onboarding-employees" className="text-xs font-semibold text-muted-foreground">
                  Tamaño de tu equipo
                </Label>
                <Select value={employeesCount} onValueChange={setEmployeesCount}>
                  <SelectTrigger id="onboarding-employees" className="bg-background/70">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEES_COUNT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Especialidades de tu farmacia</Label>
                <ToggleGroup
                  type="multiple"
                  value={specialtyAreas}
                  onValueChange={setSpecialtyAreas}
                  className="flex-wrap justify-start gap-1.5"
                >
                  {SPECIALTY_OPTIONS.map((o) => (
                    <ToggleGroupItem
                      key={o.value}
                      value={o.value}
                      className="h-8 rounded-full border border-border bg-background/70 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      {o.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onboarding-city" className="text-xs font-semibold text-muted-foreground">
                  Ciudad de la farmacia
                </Label>
                <Input
                  id="onboarding-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej. Zaragoza"
                  className="bg-background/70"
                />
              </div>
            </div>
          )}

          {/* CTA */}
          <Button onClick={handleNext} size="lg" className="w-full max-w-xs gap-2 rounded-full text-base">
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
