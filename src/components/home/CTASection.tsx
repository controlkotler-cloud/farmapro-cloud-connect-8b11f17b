
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Mail, Shield, UserCheck, ArrowRight } from 'lucide-react';

const ctaOptions = [
  {
    title: 'Necesito servicios profesionales para mi farmacia',
    description: 'Consultoría estratégica, marketing digital, diseño web, campañas y muchos más servicios especializados adaptados a tu realidad.',
    icon: Building2,
    cta: 'EXPLORAR SERVICIOS'
  },
  {
    title: 'Quiero inspiración y recursos gratuitos',
    description: 'Suscríbete a farmapro IMPULSO y accede a nuestro blog para empezar a beneficiarte de contenido valioso inmediatamente.',
    icon: Mail,
    cta: 'RECIBIR CONTENIDO GRATUITO'
  },
  {
    title: 'Busco acceso a recursos exclusivos y formación',
    description: 'Descubre nuestro Portal de Suscripción con todo el contenido premium y herramientas diferenciales para profesionales.',
    icon: Shield,
    cta: 'CONOCER EL PORTAL'
  },
  {
    title: 'Prefiero hablar directamente con un experto',
    description: 'Agenda una consulta personal para analizar tus necesidades específicas y encontrar la solución ideal en el ecosistema farmapro.',
    icon: UserCheck,
    cta: 'CONTACTAR AHORA'
  }
];

export const CTASection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Encuentra Tu Lugar en el Ecosistema farmapro
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hay un espacio para ti en farmapro, independientemente de tu rol o experiencia en el sector farmacéutico. 
            Descubre qué componentes de nuestro ecosistema pueden impulsar tu desarrollo profesional y el éxito de tu farmacia.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ctaOptions.map((option, index) => (
            <motion.div
              key={option.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <option.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{option.title}</h3>
                      <p className="text-gray-600 mb-4">{option.description}</p>
                      <Button variant="outline" className="group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-green-600 group-hover:text-white transition-all">
                        {option.cta}
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
