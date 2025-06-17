
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Target, 
  Briefcase, 
  Calendar,
  Building,
  MapPin,
  Gift,
  ArrowRight
} from 'lucide-react';

const Servicios = () => {
  const services = [
    {
      icon: GraduationCap,
      title: "Formación Especializada",
      description: "Cursos actualizados y certificados por expertos del sector farmacéutico",
      features: ["Cursos online", "Certificaciones oficiales", "Actualizaciones continuas"]
    },
    {
      icon: Users,
      title: "Comunidad Profesional",
      description: "Conecta con otros profesionales y comparte conocimientos",
      features: ["Foros especializados", "Networking", "Grupos de trabajo"]
    },
    {
      icon: BookOpen,
      title: "Recursos Actualizados",
      description: "Acceso a la biblioteca más completa de recursos farmacéuticos",
      features: ["Guías prácticas", "Documentación técnica", "Casos de estudio"]
    },
    {
      icon: Target,
      title: "Sistema de Retos",
      description: "Desafíos profesionales para mejorar tus competencias",
      features: ["Retos semanales", "Ranking de participantes", "Premios exclusivos"]
    },
    {
      icon: Briefcase,
      title: "Oportunidades de Empleo",
      description: "Portal especializado en ofertas de trabajo del sector farmacéutico",
      features: ["Ofertas exclusivas", "Perfil profesional", "Matching inteligente"]
    },
    {
      icon: Calendar,
      title: "Eventos Profesionales",
      description: "Acceso prioritario a congresos, seminarios y eventos del sector",
      features: ["Eventos exclusivos", "Descuentos especiales", "Networking premium"]
    }
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Servicios para Farmacias
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Todo lo que tu farmacia necesita para crecer y destacar en el sector
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://portal.farmapro.es/login" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Acceder al Portal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Solicitar Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Servicios Principales */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Una plataforma integral diseñada específicamente para profesionales farmacéuticos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center mb-4">
                    <service.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold text-blue-600 mb-2">5,000+</h3>
              <p className="text-gray-600">Farmacias registradas</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-green-600 mb-2">200+</h3>
              <p className="text-gray-600">Cursos disponibles</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-blue-600 mb-2">15,000+</h3>
              <p className="text-gray-600">Profesionales activos</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-green-600 mb-2">98%</h3>
              <p className="text-gray-600">Satisfacción del cliente</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para impulsar tu farmacia?
          </h2>
          <p className="text-xl mb-8">
            Únete a miles de profesionales que ya confían en farmapro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://portal.farmapro.es/login" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Contactar Ventas
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Servicios;
