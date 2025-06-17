
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Target, 
  Award, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  Download,
  MessageCircle,
  Building2,
  BookOpen,
  Lightbulb,
  BarChart3,
  UserCheck,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '@/components/home/Footer';

const Servicios = () => {
  const servicios = [
    {
      titulo: "Consultoría puntual y diagnóstico",
      descripcion: "Análisis específico y soluciones inmediatas para desafíos concretos de tu farmacia.",
      ideal: [
        "Farmacias que necesitan resolver un problema específico",
        "Análisis inicial antes de tomar decisiones importantes", 
        "Validación de ideas o proyectos en marcha",
        "Optimización de áreas específicas (categorías, espacios, atención al cliente)"
      ],
      duracion: "2-6 semanas",
      formato: "Presencial + remoto",
      entregables: "Informe diagnóstico + plan de acción + seguimiento inicial",
      icon: Target
    },
    {
      titulo: "Acompañamiento trimestral",
      descripcion: "Consultoría estratégica con seguimiento continuo para impulsar el crecimiento sostenido.",
      ideal: [
        "Farmacias en proceso de mejora de su presencia digital",
        "Implementación de nuevas estrategias de atención y ventas",
        "Lanzamiento de servicios profesionales",
        "Mejora continua de categorías y procesos"
      ],
      duracion: "3 meses renovables",
      formato: "Reuniones mensuales + soporte continuo",
      entregables: "Plan estratégico + implementación guiada + seguimiento de resultados",
      icon: TrendingUp
    },
    {
      titulo: "Transformación integral anual",
      descripcion: "Acompañamiento completo para farmacias que buscan una transformación profunda y sostenible.",
      ideal: [
        "Farmacias que quieren liderar su mercado local",
        "Proyectos de renovación o mejora significativa",
        "Diversificación de servicios y aumento de ingresos",
        "Preparación para el futuro del sector"
      ],
      duracion: "12 meses",
      formato: "Presencial + remoto con dedicación prioritaria",
      entregables: "Estrategia integral + implementación completa + formación de equipos",
      icon: Award
    },
    {
      titulo: "Formación especializada para equipos",
      descripcion: "Programas de capacitación diseñados específicamente para el desarrollo de tu equipo farmacéutico.",
      ideal: [
        "Equipos que necesitan actualizar competencias",
        "Lanzamiento de nuevos servicios profesionales",
        "Mejora de habilidades de atención y ventas éticas",
        "Desarrollo de liderazgo y coordinación de equipos"
      ],
      duracion: "Desde workshops de 1 día hasta programas de 3 meses",
      formato: "In-company personalizado",
      entregables: "Programa formativo + materiales + certificación + seguimiento",
      icon: Users
    }
  ];

  const areas = [
    {
      titulo: "Gestión estratégica de la farmacia",
      items: [
        "Análisis de situación y planificación de mejoras",
        "Optimización de categorías y aprovechamiento del espacio",
        "Gestión inteligente de stock y rotación",
        "Desarrollo de servicios profesionales que aporten valor",
        "Indicadores clave para controlar la evolución"
      ],
      icon: BarChart3
    },
    {
      titulo: "Presencia digital y comunicación",
      items: [
        "Presencia digital estratégica (web, redes sociales)",
        "Posicionamiento local en Google y buscadores",
        "Campañas digitales y comunicación con pacientes",
        "Marketing de contenidos y newsletters",
        "Automatización de comunicaciones farmacéuticas"
      ],
      icon: TrendingUp
    },
    {
      titulo: "Experiencia del paciente y ventas éticas",
      items: [
        "Protocolo de atención excepcional al paciente",
        "Técnicas de recomendación profesional y venta cruzada ética",
        "Fidelización y cuidado de pacientes habituales",
        "Creación de experiencias memorables en la farmacia",
        "Gestión de la reputación y recomendaciones"
      ],
      icon: UserCheck
    },
    {
      titulo: "Digitalización y herramientas tecnológicas",
      items: [
        "Simplificación de procesos operativos diarios",
        "Integración de herramientas tecnológicas útiles",
        "Implementación de servicios digitales para pacientes",
        "Optimización del software de gestión existente",
        "Preparación para tendencias emergentes del sector"
      ],
      icon: Settings
    },
    {
      titulo: "Desarrollo de equipos y liderazgo",
      items: [
        "Formación en competencias técnicas y de atención",
        "Desarrollo de habilidades de coordinación y liderazgo",
        "Sistemas de motivación e incentivos para el equipo",
        "Protocolos operativos y delegación efectiva",
        "Construcción de una cultura de farmacia exitosa"
      ],
      icon: Users
    },
    {
      titulo: "Optimización comercial y rentabilidad",
      items: [
        "Análisis de rentabilidad por categorías y servicios",
        "Optimización de márgenes y estrategias de precios",
        "Identificación de oportunidades de crecimiento",
        "Seguimiento de evolución con indicadores sencillos",
        "Estrategias para aumentar el valor de cada visita"
      ],
      icon: TrendingUp
    }
  ];

  const fases = [
    {
      numero: "01",
      titulo: "Diagnóstico integral",
      descripcion: "Análisis profundo de tu farmacia: situación actual, oportunidades, desafíos y potencial de mejora.",
      items: [
        "Visita presencial para conocer instalaciones y procesos",
        "Análisis de datos de ventas y evolución",
        "Conversaciones con equipo y clientes habituales",
        "Comparación con farmacias similares de la zona"
      ],
      entregable: "Informe diagnóstico completo"
    },
    {
      numero: "02",
      titulo: "Diseño estratégico",
      descripcion: "Desarrollo de la estrategia personalizada basada en tus objetivos y recursos disponibles.",
      items: [
        "Definición de objetivos específicos y alcanzables",
        "Diseño de plan de acción priorizado",
        "Selección de herramientas y recursos necesarios",
        "Planificación temporal y asignación de responsabilidades"
      ],
      entregable: "Plan estratégico detallado"
    },
    {
      numero: "03",
      titulo: "Implementación guiada",
      descripcion: "Acompañamiento en la ejecución del plan con soporte continuo y ajustes sobre la marcha.",
      items: [
        "Reuniones de seguimiento estructuradas",
        "Formación del equipo en nuevos procesos",
        "Supervisión de implementación de herramientas",
        "Resolución de dudas y adaptaciones necesarias"
      ],
      entregable: "Implementación completa + formación"
    },
    {
      numero: "04",
      titulo: "Medición y optimización",
      descripcion: "Seguimiento de resultados con indicadores claros y optimización continua de la estrategia.",
      items: [
        "Análisis de indicadores de éxito y evolución",
        "Identificación de áreas de mejora adicionales",
        "Ajustes estratégicos basados en resultados",
        "Informes detallados de evolución"
      ],
      entregable: "Informes de resultados + optimizaciones"
    },
    {
      numero: "05",
      titulo: "Consolidación y escalabilidad",
      descripcion: "Asegurar la sostenibilidad de los cambios y preparar el crecimiento futuro.",
      items: [
        "Sistematización de procesos exitosos",
        "Formación avanzada para autonomía del equipo",
        "Planificación de siguientes pasos de crecimiento",
        "Transferencia de conocimiento completa"
      ],
      entregable: "Sistemas consolidados + plan futuro"
    }
  ];

  const casos = [
    {
      ubicacion: "Farmacia urbana - Barcelona",
      desafio: "Competencia agresiva de cadenas y necesidad de diferenciación",
      solucion: "Transformación integral con enfoque en servicios profesionales y presencia digital",
      resultados: [
        "Aumento del 34% en servicios profesionales primer año",
        "Crecimiento del 28% en ventas de dermocosmética",
        "Incremento del 45% en seguidores reales en redes sociales",
        "Recuperación de la inversión en 8 meses"
      ],
      testimonio: "farmapro nos ayudó a encontrar nuestro espacio único. Ahora somos la farmacia de referencia en nuestro barrio y los resultados lo demuestran.",
      autor: "Carmen Rodríguez, Titular"
    },
    {
      ubicacion: "Farmacia rural - Soria",
      desafio: "Población envejecida y limitaciones de recursos para marketing",
      solucion: "Optimización operativa + servicios adaptados + presencia digital local",
      resultados: [
        "Aumento del 22% en ticket medio",
        "Implementación exitosa de 3 nuevos servicios",
        "Mejora del 67% en visibilidad online local",
        "Ahorro de 2 horas diarias en tareas administrativas"
      ],
      testimonio: "Pensábamos que la digitalización no era para nosotros. farmapro nos demostró que es posible adaptarla a cualquier realidad.",
      autor: "José María, Titular"
    },
    {
      ubicacion: "Farmacia de barrio - Valencia",
      desafio: "Equipo desmotivado y estancamiento en ventas",
      solucion: "Programa de formación integral + redefinición de procesos",
      resultados: [
        "Mejora del 89% en satisfacción del equipo",
        "Incremento del 31% en recomendaciones profesionales",
        "Aumento del 25% en retención de clientes",
        "Reducción del 40% en rotación de personal"
      ],
      testimonio: "La transformación del equipo ha sido espectacular. Ahora trabajamos con una energía y enfoque que nunca habíamos tenido.",
      autor: "Ana Martínez, Farmacéutica adjunta"
    }
  ];

  const planes = [
    {
      nombre: "Diagnóstico express",
      duracion: "2-3 semanas",
      precio: "Desde 1.490€",
      incluye: [
        "Visita presencial completa (1 día)",
        "Análisis de datos y documentación",
        "Conversaciones con equipo clave",
        "Informe diagnóstico con 5-7 recomendaciones prioritarias",
        "Sesión de presentación de resultados",
        "1 mes de soporte vía email"
      ],
      ideal: "Farmacias que necesitan claridad sobre próximos pasos o validar decisiones importantes."
    },
    {
      nombre: "Transformación enfocada",
      duracion: "3 meses",
      precio: "Desde 3.990€",
      incluye: [
        "Todo lo del diagnóstico express",
        "Plan estratégico específico para 1-2 áreas clave",
        "3 sesiones de implementación guiada",
        "Formación del equipo (4-8 horas)",
        "Herramientas y recursos específicos",
        "Seguimiento mensual con indicadores",
        "Soporte continuado durante la implementación"
      ],
      ideal: "Farmacias que quieren impulsar áreas específicas con acompañamiento profesional."
    },
    {
      nombre: "Transformación integral",
      duracion: "12 meses",
      precio: "Desde 9.990€",
      incluye: [
        "Diagnóstico completo multidisciplinar",
        "Estrategia integral personalizada",
        "Implementación guiada en todas las fases",
        "Formación completa del equipo (20-30 horas)",
        "Herramientas digitales y recursos premium",
        "Reuniones presenciales mensuales",
        "Soporte prioritario ilimitado",
        "Informes trimestrales de evolución",
        "Planificación estratégica para el año siguiente"
      ],
      ideal: "Farmacias comprometidas con una transformación profunda y sostenible."
    },
    {
      nombre: "Formación de equipos",
      duracion: "1 día a 3 meses (según programa)",
      precio: "Desde 890€/día",
      incluye: [
        "Análisis de necesidades formativas",
        "Programa personalizado por roles",
        "Materiales didácticos específicos",
        "Sesiones prácticas con casos reales",
        "Evaluación y certificación",
        "Seguimiento post-formación (30 días)",
        "Recursos adicionales para consolidación"
      ],
      ideal: "Equipos que necesitan desarrollar competencias específicas o adaptarse a nuevos desafíos."
    }
  ];

  const testimonios = [
    {
      categoria: "Consultoría puntual",
      texto: "Necesitábamos una segunda opinión sobre nuestro proyecto de ampliación. En solo 3 semanas, farmapro nos dio las claves que necesitábamos. Su diagnóstico nos ahorró meses de dudas y posibles errores.",
      autor: "Rafael Santos, Titular en Getafe"
    },
    {
      categoria: "Acompañamiento trimestral",
      texto: "El acompañamiento trimestral nos ha dado la estructura que nos faltaba. Tener reuniones regulares con expertos ha acelerado muchísimo nuestra mejora digital.",
      autor: "Lucía Fernández, Farmacéutica adjunta en Málaga"
    },
    {
      categoria: "Transformación integral",
      texto: "Después de un año con farmapro, tenemos una farmacia completamente diferente. No solo han mejorado las ventas, sino que trabajar aquí es mucho más satisfactorio para todo el equipo.",
      autor: "Antonio García, Titular en Zaragoza"
    },
    {
      categoria: "Formación de equipos",
      texto: "La formación que recibió nuestro equipo ha sido transformadora. Ahora atienden con mucha más confianza y las recomendaciones profesionales se han disparado.",
      autor: "Carmen López, Titular en Sevilla"
    }
  ];

  const pasos = [
    {
      numero: "01",
      titulo: "Consulta inicial gratuita",
      descripcion: "Conversación sin compromiso para entender tus necesidades y objetivos específicos.",
      items: [
        "Llamada o videollamada de 30-45 minutos",
        "Análisis inicial de tu situación",
        "Identificación de oportunidades principales",
        "Recomendación del servicio más adecuado"
      ]
    },
    {
      numero: "02",
      titulo: "Propuesta personalizada",
      descripcion: "Diseño de una propuesta específica adaptada a tu farmacia y presupuesto.",
      items: [
        "Alcance detallado del proyecto",
        "Cronograma de trabajo específico",
        "Inversión y condiciones claras",
        "Metodología y entregables concretos"
      ]
    },
    {
      numero: "03",
      titulo: "Acuerdo y planificación",
      descripcion: "Firma del acuerdo y planificación detallada del inicio del proyecto.",
      items: [
        "Contrato claro con términos específicos",
        "Calendario de trabajo coordinado",
        "Asignación de equipo consultor",
        "Preparación de materiales y recursos"
      ]
    },
    {
      numero: "04",
      titulo: "Inicio y acompañamiento",
      descripcion: "Comenzamos el trabajo con total dedicación y seguimiento continuo.",
      items: [
        "Reunión de inicio presencial o virtual",
        "Implementación según metodología acordada",
        "Comunicación regular y transparente",
        "Ajustes y optimizaciones sobre la marcha"
      ]
    }
  ];

  const faqs = [
    {
      pregunta: "¿Cómo sabemos qué servicio necesita nuestra farmacia?",
      respuesta: "Durante la consulta inicial gratuita analizamos tu situación específica y te recomendamos el servicio más adecuado. No hay compromiso y siempre priorizamos tus objetivos y presupuesto disponible."
    },
    {
      pregunta: "¿Trabajáis con farmacias de cualquier tamaño?",
      respuesta: "Sí, adaptamos nuestra metodología a farmacias grandes, pequeñas, urbanas, rurales, de barrio o turísticas. Cada proyecto se personaliza completamente según la realidad específica de cada farmacia."
    },
    {
      pregunta: "¿Cuánto tiempo pasa hasta ver resultados?",
      respuesta: "Los primeros resultados suelen ser visibles entre las 4-8 semanas de inicio, dependiendo del tipo de intervención. Los cambios más profundos se consolidan entre los 3-6 meses."
    },
    {
      pregunta: "¿Qué garantías ofrecéis sobre los resultados?",
      respuesta: "Trabajamos con objetivos claros desde el inicio. Si no alcanzamos los resultados acordados, continuamos trabajando sin coste adicional hasta conseguirlos."
    },
    {
      pregunta: "¿Podemos empezar con un servicio pequeño y ampliar después?",
      respuesta: "Por supuesto. Muchas de nuestras colaboraciones más exitosas comenzaron con un diagnóstico puntual y evolucionaron hacia acompañamientos más integrales."
    },
    {
      pregunta: "¿Cómo compatibilizáis el trabajo con nuestra operativa diaria?",
      respuesta: "Nuestra metodología está diseñada para generar el mínimo impacto en tu operativa. Trabajamos en horarios que no interfieran con la atención a pacientes y siempre coordinamos las intervenciones previamente."
    }
  ];

  const recursos = [
    {
      titulo: "Autodiagnóstico: 25 indicadores clave para tu farmacia",
      descripcion: "Evalúa rápidamente 5 áreas críticas de tu farmacia y detecta oportunidades de mejora inmediatas.",
      icon: CheckCircle
    },
    {
      titulo: "Preparación para consultoría: qué tener listo",
      descripcion: "Documentos, datos e información necesaria para maximizar el valor de cualquier consultoría externa.",
      icon: BookOpen
    },
    {
      titulo: "Servicios profesionales en farmacia",
      descripcion: "Herramienta Excel para evaluar el potencial de implementar nuevos servicios en tu farmacia.",
      icon: BarChart3
    },
    {
      titulo: "Tendencias del sector farmacéutico 2025",
      descripcion: "Análisis exclusivo de las 7 tendencias que marcarán el futuro de la farmacia comunitaria en España.",
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <img src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" alt="farmapro" className="w-10 h-10" />
              <img src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" alt="farmapro" className="h-8" />
            </Link>
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
              Servicios profesionales que impulsan el éxito de tu farmacia
            </h1>
            <h2 className="text-2xl md:text-3xl text-gray-700 mb-6 font-medium">
              15 años de experiencia transformando farmacias en toda España
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              En farmapro ofrecemos servicios de consultoría estratégica diseñados específicamente para farmacias que buscan destacar, 
              mejorar sus resultados y adaptarse al entorno actual. Nuestro equipo multidisciplinar combina profundo conocimiento del 
              sector farmacéutico con experiencia en gestión, marketing digital y optimización operativa. No aplicamos soluciones genéricas: 
              cada proyecto está diseñado a medida de tu farmacia, tu equipo y tus objetivos específicos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg px-8 py-3">
                SOLICITAR DIAGNÓSTICO GRATUITO
              </Button>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
              <p className="text-green-800 font-medium">
                Más de 70 farmacias confían en nosotros para impulsar su crecimiento
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sección de Tipos de Servicios */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Servicios adaptados a las necesidades de tu farmacia
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Entendemos que cada farmacia tiene necesidades diferentes según su momento, objetivos y recursos disponibles. 
              Por eso ofrecemos un catálogo flexible de servicios que van desde intervenciones puntuales hasta acompañamiento estratégico integral.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {servicios.map((servicio, index) => (
              <motion.div
                key={servicio.titulo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <servicio.icon className="h-12 w-12 text-blue-600 mb-4" />
                    <CardTitle className="text-xl">{servicio.titulo}</CardTitle>
                    <p className="text-gray-600">{servicio.descripcion}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Ideal para:</h4>
                        <ul className="space-y-1">
                          {servicio.ideal.map((item, i) => (
                            <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span><strong>Duración:</strong> {servicio.duracion}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span><strong>Formato:</strong> {servicio.formato}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Award className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span><strong>Entregables:</strong> {servicio.entregables}</span>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                        CONOCER DETALLES
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Áreas de Especialización */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestras áreas de expertise
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Cada proyecto de consultoría puede abordar una o varias de estas áreas especializadas, 
              siempre adaptadas a las necesidades específicas de tu farmacia.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {areas.map((area, index) => (
              <motion.div
                key={area.titulo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <area.icon className="h-10 w-10 text-blue-600 mb-3" />
                    <CardTitle className="text-lg">{area.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {area.items.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Metodología */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nuestra metodología probada: del diagnóstico a los resultados
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Aplicamos un enfoque estructurado y personalizado que garantiza resultados medibles en cada proyecto. 
              Nuestra metodología se basa en 15 años de experiencia y está constantemente perfeccionada con los aprendizajes de cada farmacia.
            </p>
          </div>
          
          <div className="space-y-8">
            {fases.map((fase, index) => (
              <motion.div
                key={fase.numero}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex flex-col lg:flex-row items-center gap-8 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className="lg:w-1/3">
                  <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg p-8 text-center">
                    <div className="text-3xl font-bold mb-2">{fase.numero}</div>
                    <h3 className="text-xl font-semibold">{fase.titulo}</h3>
                  </div>
                </div>
                <div className="lg:w-2/3">
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-gray-600 mb-4">{fase.descripcion}</p>
                      <ul className="space-y-2 mb-4">
                        {fase.items.map((item, i) => (
                          <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">
                          <strong>Entregable:</strong> {fase.entregable}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Casos de Éxito */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Resultados reales en farmacias como la tuya
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {casos.map((caso, index) => (
              <motion.div
                key={caso.ubicacion}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">{caso.ubicacion}</CardTitle>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Desafío:</strong> {caso.desafio}</p>
                      <p className="text-sm"><strong>Solución:</strong> {caso.solucion}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Resultados:</h4>
                        <ul className="space-y-1">
                          {caso.resultados.map((resultado, i) => (
                            <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{resultado}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm italic text-green-800 mb-2">"{caso.testimonio}"</p>
                        <p className="text-sm font-medium text-green-700">- {caso.autor}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-lg font-semibold text-gray-900">
              +150 farmacias transformadas exitosamente en 15 años
            </p>
          </div>
        </div>
      </section>

      {/* Sección de Planes de Servicio */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Elige el acompañamiento que mejor se adapte a tu farmacia
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {planes.map((plan, index) => (
              <motion.div
                key={plan.nombre}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-xl text-blue-600">{plan.nombre}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Duración: {plan.duracion}</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{plan.precio}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Incluye:</h4>
                        <ul className="space-y-1">
                          {plan.incluye.map((item, i) => (
                            <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>Ideal para:</strong> {plan.ideal}
                        </p>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                        SOLICITAR INFORMACIÓN
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Opciones de pago: Facilidades de pago disponibles. Consulta condiciones especiales para colegiados.
            </p>
          </div>
        </div>
      </section>

      {/* Sección de Testimonios Específicos */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Lo que dicen nuestros clientes
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonios.map((testimonio, index) => (
              <motion.div
                key={testimonio.categoria}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {testimonio.categoria}
                      </span>
                    </div>
                    <p className="text-gray-600 italic mb-4">"{testimonio.texto}"</p>
                    <p className="text-sm font-medium text-gray-900">- {testimonio.autor}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Proceso de Contratación */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Cómo comenzamos a trabajar juntos
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pasos.map((paso, index) => (
              <motion.div
                key={paso.numero}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full text-center">
                  <CardHeader>
                    <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                      <span className="font-bold">{paso.numero}</span>
                    </div>
                    <CardTitle className="text-lg">{paso.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{paso.descripcion}</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {paso.items.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 inline-block">
              <p className="text-green-800 font-medium">
                <strong>Garantía de satisfacción:</strong> Si no estás satisfecho con los primeros entregables, 
                trabajamos sin coste adicional hasta conseguir tu conformidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Preguntas Frecuentes */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Preguntas frecuentes sobre nuestros servicios
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.pregunta}</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.respuesta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Sección CTA Principal */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Transforma tu farmacia con acompañamiento experto
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Cada día que pasa sin optimizar tu farmacia es una oportunidad perdida. Nuestros servicios de consultoría están diseñados 
              para acelerar tu éxito, evitar errores costosos y maximizar el potencial de tu farmacia. Con más de 15 años de experiencia 
              y decenas de casos de éxito, somos el partner estratégico que tu farmacia necesita.
            </p>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Beneficios destacados:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-100">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span>Resultados visibles desde las primeras semanas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span>Metodología probada en más de 150 farmacias</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span>Equipo especializado exclusivamente en farmacia</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span>Acompañamiento continuo hasta alcanzar objetivos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-300" />
                  <span>Garantía de satisfacción total</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                SOLICITAR CONSULTA GRATUITA
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                VER CASOS DE ÉXITO
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                DESCARGAR PORTFOLIO
              </Button>
            </div>
            
            <p className="text-blue-200 text-sm">
              <strong>Garantía final:</strong> Consulta inicial gratuita sin compromiso. Si no vemos potencial de mejora en tu farmacia, te lo diremos honestamente.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sección de Recursos Adicionales */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Recursos complementarios para tu farmacia
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {recursos.map((recurso, index) => (
              <motion.div
                key={recurso.titulo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center">
                    <recurso.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <CardTitle className="text-lg">{recurso.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{recurso.descripcion}</p>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                      <Download className="h-4 w-4 mr-2" />
                      DESCARGAR GRATIS
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Contacto Especializado */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Habla directamente con nuestros especialistas
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Para consultoría</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span>consultoria@farmapro.es</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <span>(+34) 876 444 920</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  <span>WhatsApp Business: (+34) 6XX XXX XXX</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Para formación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span>formacion@farmapro.es</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Responsable: [Nombre del especialista en formación]</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Horario de atención especializada:</h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Lunes a viernes: 9:00 - 18:00h</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>Urgencias: disponible vía WhatsApp</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Oficinas para reuniones presenciales:</h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Madrid: [Dirección]</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Barcelona: [Dirección]</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Valencia: [Dirección]</span>
                    </div>
                    <p className="text-sm mt-2">También nos desplazamos a tu farmacia</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    <strong>Tiempo de respuesta garantizado:</strong> Máximo 4 horas laborables para todas las consultas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Servicios;
