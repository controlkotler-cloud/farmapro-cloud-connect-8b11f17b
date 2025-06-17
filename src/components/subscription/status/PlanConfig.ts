
import { Crown, GraduationCap, Briefcase, Sparkles } from 'lucide-react';

export const planConfig = {
  freemium: {
    name: 'Freemium',
    icon: Sparkles,
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
  estudiante: {
    name: 'Estudiante',
    icon: GraduationCap,
    color: 'from-green-400 to-blue-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  profesional: {
    name: 'Profesional',
    icon: Briefcase,
    color: 'from-blue-500 to-purple-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  premium: {
    name: 'Premium',
    icon: Crown,
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
};

export type PlanType = keyof typeof planConfig;
