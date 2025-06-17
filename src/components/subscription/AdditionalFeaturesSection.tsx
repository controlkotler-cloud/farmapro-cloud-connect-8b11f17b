
import { Smartphone, Award, Bell, HeadphonesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const additionalFeatures = [
  {
    icon: Smartphone,
    title: 'Acceso Multiplataforma',
    description: 'Disfruta del Portal farmapro desde cualquier dispositivo: ordenador, tablet o móvil. Tu progreso se sincroniza automáticamente para que puedas continuar donde lo dejaste.'
  },
  {
    icon: Award,
    title: 'Certificados de Formación',
    description: 'Obtén certificados personalizados al completar cursos y módulos formativos, ideales para tu desarrollo profesional y acreditación continua.'
  },
  {
    icon: Bell,
    title: 'Notificaciones Personalizadas',
    description: 'Configura alertas sobre nuevos contenidos en tus áreas de interés, eventos exclusivos o actualizaciones importantes del sector.'
  },
  {
    icon: HeadphonesIcon,
    title: 'Soporte Especializado',
    description: 'Cuenta con un equipo de expertos en farmacia y tecnología para resolver cualquier duda o incidencia que pueda surgir durante tu experiencia.'
  }
];

export const AdditionalFeaturesSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Potencia tu Experiencia en el Portal farmapro</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {additionalFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            DESCUBRIR TODAS LAS FUNCIONALIDADES
          </Button>
        </div>
      </div>
    </section>
  );
};
