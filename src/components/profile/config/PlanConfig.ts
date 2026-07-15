
import { Crown, Sparkles, GraduationCap, Briefcase, Settings } from 'lucide-react';

// Sin acento de sección propio (layout/suscripción core): freemium y estudiante en
// neutro shadcn, profesional (plan "Más Popular") en brand, premium (nivel superior) en
// ciruela. admin no es un plan de pago: neutro reforzado (foreground) para distinguirlo
// sin añadir un tercer acento de color.
export const planConfig = {
  freemium: {
    name: 'Freemium',
    icon: Sparkles,
    color: 'bg-muted-foreground',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    features: [
      'Acceso a 1 curso',
      'Máximo 2 descargas',
      'Ver comunidad (solo lectura)',
      'Retos básicos'
    ]
  },
  estudiante: {
    name: 'Estudiante',
    icon: GraduationCap,
    color: 'bg-foreground',
    bgColor: 'bg-secondary',
    textColor: 'text-secondary-foreground',
    features: [
      '1 curso al mes',
      '2 descargas al mes',
      'Acceso a bolsa de trabajo',
      'Farmacias en venta',
      'Verificación de matrícula requerida'
    ]
  },
  profesional: {
    name: 'Profesional',
    icon: Briefcase,
    color: 'bg-primary',
    bgColor: 'bg-brand-soft',
    textColor: 'text-brand-dark',
    features: [
      'Acceso completo a formación',
      'Descargas ilimitadas',
      'Comunidad completa',
      'Retos avanzados',
      'Eventos exclusivos'
    ]
  },
  premium: {
    name: 'Premium',
    icon: Crown,
    color: 'bg-ciruela',
    bgColor: 'bg-ciruela-soft',
    textColor: 'text-ciruela',
    features: [
      'Todo lo anterior',
      'Promociones exclusivas',
      'Publicar ofertas de empleo',
      'Formaciones premium',
      'Soporte prioritario'
    ]
  },
  admin: {
    name: 'Administrador',
    icon: Settings,
    color: 'bg-foreground',
    bgColor: 'bg-secondary',
    textColor: 'text-foreground',
    features: [
      'Acceso completo al sistema',
      'Panel de administración',
      'Gestión de usuarios',
      'Gestión de contenido',
      'Todas las funcionalidades'
    ]
  }
};
