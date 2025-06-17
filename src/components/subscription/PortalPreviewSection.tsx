
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const portalSections = [
  {
    title: 'Formación Avanzada',
    description: 'Cursos estructurados por módulos, webinars grabados, microlearning y recursos formativos para todo tu equipo. Filtros por temática, nivel y rol profesional.'
  },
  {
    title: 'Recursos y Herramientas',
    description: 'Biblioteca organizada de plantillas, protocolos, calculadoras, generadores de contenido y más recursos prácticos para el día a día de tu farmacia.'
  },
  {
    title: 'Comunidad Exclusiva',
    description: 'Foros temáticos, mensajería directa, grupos de interés y espacio para networking profesional seguro y enfocado al sector farmacéutico.'
  },
  {
    title: 'farmaproRetos',
    description: 'Transforma tu aprendizaje en logros reales. Gana puntos, desbloquea recompensas y compite con los demás mientras dominas habilidades a tu aire.'
  },
  {
    title: 'Mi Perfil',
    description: 'Tu espacio personalizado donde puedes guardar favoritos, seguir tu progreso en cursos, recibir recomendaciones adaptadas a tus intereses y gestionar tu suscripción.'
  }
];

export const PortalPreviewSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Un Vistazo al Interior del Portal farmapro</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {portalSections.map((section, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{section.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
            EXPLORAR EL PORTAL
          </Button>
        </div>
      </div>
    </section>
  );
};
