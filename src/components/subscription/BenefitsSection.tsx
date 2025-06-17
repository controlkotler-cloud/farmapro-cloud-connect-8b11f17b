
import { BookOpen, Users, Zap, Star, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const benefits = [
  {
    icon: BookOpen,
    title: 'Formación Especializada y Actualizada',
    description: 'Cursos completos, masterclasses y tutoriales sobre gestión farmacéutica, marketing, categorías de alta rentabilidad y atención farmacéutica avanzada. Contenido actualizado mensualmente y adaptado a la realidad de nuestro sector.'
  },
  {
    icon: Download,
    title: 'Biblioteca de Recursos Descargables',
    description: 'Plantillas profesionales, checklist operativos, protocolos de actuación y herramientas listas para implementar en tu farmacia. Todo el material está diseñado para ser práctico y de aplicación inmediata.'
  },
  {
    icon: Zap,
    title: 'Herramientas Digitales Exclusivas',
    description: 'Accede a nuestro generador de contenidos con IA especializada en farmacia, calculadoras de rentabilidad, planificadores de campañas y más herramientas que simplifican tu gestión diaria.'
  },
  {
    icon: Users,
    title: 'Comunidad Privada de Profesionales',
    description: 'Conecta con otros miembros del portal, comparte experiencias, resuelve dudas en tiempo real y participa en debates exclusivos sobre los temas más relevantes del sector.'
  },
  {
    icon: Star,
    title: 'Contenido Premium Anticipado',
    description: 'Recibe antes que nadie análisis de tendencias, informes sectoriales y estudios de mercado que te permitirán anticiparte a los cambios y oportunidades del sector farmacéutico.'
  }
];

export const BenefitsSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Qué Te Ofrece el Portal farmapro</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hemos creado un ecosistema digital completo pensado específicamente para las necesidades del profesional farmacéutico español. Cada elemento está diseñado para ofrecerte valor inmediato y resultados tangibles.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
