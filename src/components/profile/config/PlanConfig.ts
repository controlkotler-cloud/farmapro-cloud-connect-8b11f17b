
import { Crown, Sparkles, GraduationCap, Briefcase, Settings } from 'lucide-react';

export const planConfig = {
  freemium: {
    name: 'Freemium',
    icon: Sparkles,
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
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
    color: 'from-green-400 to-blue-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
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
    color: 'from-blue-500 to-purple-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
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
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
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
    color: 'from-red-400 to-red-600',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    features: [
      'Acceso completo al sistema',
      'Panel de administración',
      'Gestión de usuarios',
      'Gestión de contenido',
      'Todas las funcionalidades'
    ]
  }
};
