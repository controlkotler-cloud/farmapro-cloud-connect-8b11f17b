
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Mail, BookOpen, Star } from 'lucide-react';

const ecosystemComponents = [
  {
    title: 'Servicios Especializados para Farmacias',
    description: 'Consultoría estratégica, marketing digital, gestión de redes sociales, diseño web y más. Servicios profesionales adaptados específicamente a las necesidades reales de las farmacias.',
    icon: Building2,
    cta: 'EXPLORAR SERVICIOS'
  },
  {
    title: 'farmapro IMPULSO',
    description: 'Nuestra newsletter quincenal gratuita que ya inspira a miles de titulares y profesionales farmacéuticos. Suscríbete ya mismo y empieza a aprovechar estrategias prácticas, análisis de tendencias y recursos de alto valor que podrás aplicar de inmediato en el día a día de tu farmacia.',
    icon: Mail,
    cta: 'SUSCRIBIRME GRATIS'
  },
  {
    title: 'Blog Especializado',
    description: 'Contenido cuidadosamente seleccionado y creado por expertos de nuestro sector. Artículos, guías y análisis que aportan valor real a tu día a día y la visión estratégica que necesita tu farmacia.',
    icon: BookOpen,
    cta: 'DESCUBRIR CONTENIDOS'
  },
  {
    title: 'Portal de Suscripción',
    description: 'Accederás a recursos exclusivos, formación especializada, herramientas y contenidos premium que le darán a tu farmacia esa ventaja competitiva que necesita y disfrutarás de un espacio privilegiado para titulares de farmacia, farmacéuticos adjuntos, técnicos de farmacia y estudiantes que, como tú, buscan la excelencia.',
    icon: Star,
    cta: 'CONOCER MÁS'
  }
];

export const EcosystemComponents = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Esto es todo lo que vas a poder aprovechar de farmapro
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {ecosystemComponents.map((component, index) => (
            <motion.div
              key={component.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <component.icon className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle className="text-xl">{component.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    {component.description}
                  </CardDescription>
                  <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                    {component.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
