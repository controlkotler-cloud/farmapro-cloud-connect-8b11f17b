
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Target, 
  Users, 
  TrendingUp, 
  Award, 
  CheckCircle,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';

const FarmaproImpulso = () => {
  const features = [
    {
      icon: Target,
      title: "Estrategia Personalizada",
      description: "Plan de crecimiento adaptado específicamente a tu farmacia y mercado local"
    },
    {
      icon: TrendingUp,
      title: "Análisis de Mercado",
      description: "Estudios detallados de tu competencia y oportunidades de crecimiento"
    },
    {
      icon: Users,
      title: "Consultoría Especializada",
      description: "Expertos en farmacia te acompañan en cada paso de tu transformación"
    },
    {
      icon: Award,
      title: "Certificaciones Premium",
      description: "Acceso a certificaciones exclusivas que diferencian tu farmacia"
    }
  ];

  const benefits = [
    "Incremento promedio del 30% en ventas en los primeros 6 meses",
    "Mejora de la eficiencia operativa en un 40%",
    "Aumento de la satisfacción del cliente al 95%",
    "Reducción de costos operativos del 20%",
    "Implementación de tecnologías de vanguardia",
    "Posicionamiento como farmacia líder en tu zona"
  ];

  const testimonials = [
    {
      name: "Dr. Ana Martín",
      pharmacy: "Farmacia Central, Madrid",
      content: "farmapro IMPULSO transformó completamente nuestro negocio. En 8 meses aumentamos nuestras ventas un 45% y mejoramos significativamente la experiencia de nuestros clientes.",
      rating: 5
    },
    {
      name: "Lic. Carlos Pérez",
      pharmacy: "Farmacia San José, Barcelona",
      content: "La consultoría personalizada y las herramientas proporcionadas nos permitieron modernizar todos nuestros procesos. Ahora somos la farmacia de referencia en nuestra zona.",
      rating: 5
    }
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Rocket className="h-16 w-16 mr-4" />
              <h1 className="text-4xl md:text-6xl font-bold">
                farmapro <span className="text-yellow-300">IMPULSO</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto">
              El programa premium de transformación farmacéutica que llevará tu negocio al siguiente nivel
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold">
                <Zap className="mr-2 h-5 w-5" />
                Solicitar Consulta Gratuita
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                Ver Casos de Éxito
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              PROGRAMA PREMIUM
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Qué incluye farmapro IMPULSO?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un programa integral diseñado para farmacias que buscan un crecimiento exponencial
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow border-t-4 border-t-purple-600">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Resultados que Hablan por Sí Solos
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Las farmacias que participan en nuestro programa IMPULSO experimentan transformaciones extraordinarias
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:pl-8">
              <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-6">Resultados Promedio</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-4xl font-bold text-yellow-300 mb-2">+30%</div>
                      <div className="text-sm">Aumento en Ventas</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-yellow-300 mb-2">40%</div>
                      <div className="text-sm">Mejora Eficiencia</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-yellow-300 mb-2">95%</div>
                      <div className="text-sm">Satisfacción Cliente</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-yellow-300 mb-2">6</div>
                      <div className="text-sm">Meses Promedio</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nuestro Proceso de Transformación
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un enfoque metodológico probado en cientos de farmacias
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Diagnóstico", description: "Análisis completo de tu farmacia actual" },
              { step: "02", title: "Estrategia", description: "Diseño de plan personalizado de crecimiento" },
              { step: "03", title: "Implementación", description: "Ejecución guiada de todas las mejoras" },
              { step: "04", title: "Optimización", description: "Seguimiento y ajustes continuos" }
            ].map((phase, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{phase.step}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{phase.title}</h3>
                <p className="text-gray-600">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Lo que Dicen Nuestros Clientes
            </h2>
            <p className="text-xl text-gray-600">
              Historias reales de transformación farmacéutica
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8">
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.pharmacy}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para Impulsar tu Farmacia?
          </h2>
          <p className="text-xl mb-8">
            Únete al programa que está transformando farmacias en toda España
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold">
              <Zap className="mr-2 h-5 w-5" />
              Consulta Gratuita
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
              Más Información
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default FarmaproImpulso;
