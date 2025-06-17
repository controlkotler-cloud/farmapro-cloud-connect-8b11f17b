
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Heart,
  Users,
  Target,
  BookOpen,
  Mail,
  Play,
  ArrowRight,
  CheckCircle,
  Star,
  Copyright,
  Phone,
  MapPin,
  ChevronRight,
  Lightbulb,
  TrendingUp,
  Award,
  Network,
  Zap,
  Shield,
  Building2,
  UserCheck,
  MessageSquare,
  Calendar
} from 'lucide-react';

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

const values = [
  {
    title: 'Enfoque 100% farmacéutico',
    description: 'No nos limitamos a adaptar soluciones genéricas. Todo lo que vas a encontrar en farmapro está pensado desde cero para el sector farmacéutico español, sus desafíos específicos y su realidad regulatoria.',
    icon: Target
  },
  {
    title: 'Experiencia demostrada',
    description: 'Tras 15 años acompañando, asesorando y ayudando a farmacias de toda España, entendemos profundamente cada aspecto de negocio, desde las preocupaciones de los titulares hasta las dinámicas del mostrador.',
    icon: Award
  },
  {
    title: 'Innovación práctica',
    description: 'Integramos las tendencias tecnológicas más avanzadas, pero siempre con un enfoque práctico: si no genera resultados tangibles para tu farmacia, no lo incorporamos.',
    icon: Lightbulb
  },
  {
    title: 'Comunidad activa',
    description: 'farmapro no es solo el ecosistema digital de referencia para farmacias en España. También es una comunidad vibrante donde titulares, adjuntos, auxiliares y estudiantes comparten experiencias, aprenden juntos y generan conexiones valiosas que trascienden mucho más allá de lo digital.',
    icon: Users
  }
];

const testimonials = [
  {
    quote: "Formar parte de farmapro ha cambiado completamente nuestra visión. Hemos conseguido diferenciarnos en un área con mucha competencia y ahora nuestros clientes nos reconocen por nuestra personalidad única en digital y en la farmacia física.",
    author: "Rafael, Titular",
    location: "Farmacia en Getafe"
  },
  {
    quote: "Lo que más valoramos de formar parte de farmapro es que encuentro respuestas y soluciones para nuestros problemas y retos diarios. Para mí, farmapro se ha convertido en una extensión de nuestro equipo, aportando estrategias que realmente funcionan en nuestro contexto.",
    author: "Ramón, Titular",
    location: "Farmacia en Zaragoza"
  },
  {
    quote: "La newsletter farmapro IMPULSO es lectura obligada para todo el equipo. Cada vez que nos llega, encontramos ideas que podemos implementar inmediatamente y que realmente tienen un impacto real en ventas y por lo tanto en resultados.",
    author: "Ana, Farmacéutica adjunta",
    location: "Farmacia en Sevilla"
  }
];

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

const Index = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" alt="farmapro" className="w-10 h-10" />
              <img src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" alt="farmapro" className="h-8" />
            </div>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">farmapro</span>: Impulsando el Futuro de la Farmacia
            </h1>
            <h2 className="text-2xl md:text-3xl text-gray-700 mb-6 font-medium">
              El Ecosistema digital que está revolucionando el sector farmacéutico
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Bienvenido a farmapro, el ecosistema digital dedicado a impulsar el potencial de las farmacias. 
              Conectamos servicios profesionales, conocimiento especializado, herramientas digitales y una comunidad vibrante para transformar tu realidad profesional. 
              Forma parte de un nuevo concepto en el sector farmacéutico diseñado para profesionales que entienden y son plenamente conscientes de sus desafíos diarios.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg px-8 py-3">
                DESCUBRE farmapro
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 flex items-center gap-2">
                <Play className="h-5 w-5" />
                VER VÍDEO
              </Button>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
              <p className="text-green-800 font-medium">
                Acompañamos y guiamos a cientos de farmacias en toda España en su camino hacia la excelencia.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Concept Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Mucho más que marketing para farmacias: Un Ecosistema digital que lo engloba todo.
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            En farmapro hemos evolucionado para ofrecerte una solución integral. Partiendo de nuestros 15 años de experiencia en marketing digital farmacéutico, 
            hemos creado un ecosistema único donde cada elemento está diseñado para potenciar tu desarrollo personal y profesional.
          </p>
        </div>
      </section>

      {/* Ecosystem Components */}
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

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué formar parte de farmapro?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <value.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Farmacias que están marcando la diferencia con farmapro
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current inline" />
                      ))}
                    </div>
                    <blockquote className="text-gray-700 mb-4 italic">
                      "{testimonial.quote}"
                    </blockquote>
                    <div>
                      <cite className="font-semibold text-gray-900">{testimonial.author}</cite>
                      <p className="text-sm text-gray-600">{testimonial.location}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              farmapro IMPULSO: Inspiración quincenal para tu farmacia
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              farmapro IMPULSO no es una newsletter más. Es una dosis concentrada de estrategia, inspiración y herramientas prácticas 
              que miles de profesionales farmacéuticos ya reciben cada quince días.
            </p>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Lo que encontrarás:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-100">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span>Estrategias innovadoras aplicables inmediatamente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span>Análisis de tendencias y oportunidades del sector</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span>Casos de éxito inspiradores de farmacias reales</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span>Herramientas y recursos descargables de alto valor</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Input 
                type="email" 
                placeholder="Tu email profesional" 
                className="bg-white text-gray-900 flex-1 max-w-md"
              />
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                QUIERO RECIBIRLA
              </Button>
            </div>
            
            <p className="text-blue-200 text-sm">
              <strong>3.700+</strong> profesionales farmacéuticos ya la reciben y aplican sus consejos
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main CTA Section */}
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

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Hablamos sobre el futuro de tu farmacia?
            </h2>
          </div>
          
          <Card>
            <CardContent className="p-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <Input type="text" placeholder="Tu nombre completo" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <Input type="email" placeholder="Tu email profesional" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                  <Input type="tel" placeholder="Tu número de teléfono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interés principal</label>
                  <select className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Servicios profesionales</option>
                    <option>Portal de suscripción</option>
                    <option>Newsletter gratuita</option>
                    <option>Consulta estratégica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje breve</label>
                  <textarea 
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    rows={4}
                    placeholder="Cuéntanos brevemente sobre tu farmacia y qué te interesa"
                  ></textarea>
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg py-3">
                  ENVIAR
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" alt="farmapro" className="w-8 h-8" />
                <img src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" alt="farmapro" className="h-6" />
              </div>
              <p className="text-gray-400 mb-4">
                Impulsando la excelencia farmacéutica en España
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Navegación</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Servicios para Farmacias</a></li>
                <li><a href="#" className="hover:text-white transition-colors">farmapro IMPULSO</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Portal de Suscripción</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ's</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/politica-privacidad" className="hover:text-white transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
                <li><a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
                <li>
                  <Link to="/aviso-legal" className="hover:text-white transition-colors">
                    Aviso Legal
                  </Link>
                </li>
                <li>
                  <Link to="/politica-cookies" className="hover:text-white transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contacto</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>info@farmapro.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+34 900 123 456</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Madrid, España</span>
                </li>
              </ul>
              
              <div className="mt-6">
                <h4 className="font-medium mb-2">Mantente informado</h4>
                <div className="flex space-x-2">
                  <Input 
                    type="email" 
                    placeholder="Tu email" 
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-green-600">
                    OK
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Copyright className="h-4 w-4" />
                <span>{currentYear} farmapro | Impulsando la excelencia farmacéutica en España</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
