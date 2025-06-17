
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const featuredContent = [
  {
    title: 'Curso Completo "Optimización de Categorías de Alta Rentabilidad"',
    features: ['5 módulos con más de 25 lecciones', 'Ejemplos prácticos de implementación', 'Plantillas de análisis y seguimiento', 'Casos de éxito documentados', 'Certificado de finalización']
  },
  {
    title: 'Toolkit Descargable "Pack Completo de Protocolos Operativos 2025"',
    features: ['12 protocolos listos para adaptar', 'Flujos de trabajo optimizados', 'Checklist de implementación', 'Indicadores de seguimiento', 'Plantillas de formación para equipo']
  },
  {
    title: 'Serie Exclusiva "Farmacia del Futuro: Tendencias y Oportunidades"',
    features: ['Análisis de las 5 tendencias clave', 'Entrevistas con líderes del sector', 'Predicciones para los próximos 3 años', 'Estrategias de adaptación temprana', 'Hoja de ruta personalizable']
  },
  {
    title: 'Herramienta Digital "Asistente de Contenido con IA Farmacéutica"',
    features: ['Generador de textos para redes sociales', 'Creador de descripciones de productos', 'Plantillas para comunicaciones con pacientes', 'Adaptado a terminología farmacéutica', 'Cumplimiento de normativa sanitaria']
  }
];

export const FeaturedContentSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Contenido Premium que Marca la Diferencia</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Una muestra del contenido exclusivo que encontrarás en el Portal farmapro. Actualizamos constantemente nuestro catálogo para ofrecerte siempre los recursos más relevantes y valiosos.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuredContent.map((content, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{content.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {content.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Badge variant="secondary" className="text-sm px-4 py-2">
            Nuevos recursos añadidos semanalmente - Contenido actualizado Diciembre 2024
          </Badge>
        </div>
      </div>
    </section>
  );
};
