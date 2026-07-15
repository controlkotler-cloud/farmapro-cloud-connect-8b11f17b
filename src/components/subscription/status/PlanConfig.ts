
import { Crown, GraduationCap, Briefcase, Sparkles } from 'lucide-react';

// Sin acento de sección propio (layout/suscripción core): freemium y estudiante en
// neutro shadcn, profesional (plan "Más Popular") en brand, premium (nivel superior) en ciruela.
export const planConfig = {
  freemium: {
    name: 'Freemium',
    icon: Sparkles,
    color: 'bg-muted-foreground',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
  },
  estudiante: {
    name: 'Estudiante',
    icon: GraduationCap,
    color: 'bg-foreground',
    bgColor: 'bg-secondary',
    textColor: 'text-secondary-foreground',
  },
  profesional: {
    name: 'Profesional',
    icon: Briefcase,
    color: 'bg-primary',
    bgColor: 'bg-brand-soft',
    textColor: 'text-brand-dark',
  },
  premium: {
    name: 'Premium',
    icon: Crown,
    color: 'bg-ciruela',
    bgColor: 'bg-ciruela-soft',
    textColor: 'text-ciruela',
  },
};

export type PlanType = keyof typeof planConfig;
