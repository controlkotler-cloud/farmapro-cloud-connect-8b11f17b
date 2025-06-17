
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, BookOpen, Users, Zap, Star, Download, PlayCircle, Shield, Smartphone, Award, Bell, HeadphonesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Footer } from '@/components/home/Footer';

const plans = [
  {
    id: 'premium',
    name: 'Premium Farmacia',
    price: '39€/mes',
    description: 'Para equipos que buscan excelencia',
    features: [
      'Acceso para hasta 3 miembros del equipo',
      'Todo el contenido del portal',
      'Descarga ilimitada de recursos',
      'Soporte prioritario',
      'Webinars exclusivos en directo',
      '15% descuento en servicios farmapro'
    ],
    highlighted: true,
    color: 'bg-gradient-to-br from-blue-600 to-green-600'
  },
  {
    id: 'professional',
    name: 'Individual Profesional',
    price: '19€/mes',
    description: 'Para profesionales ambiciosos',
    features: [
      'Acceso para 1 usuario',
      'Todo el contenido del portal',
      'Descarga ilimitada de recursos',
      'Soporte estándar',
      'Acceso a webinars grabados',
      '10% descuento en servicios farmapro'
    ],
    highlighted: false,
    color: 'bg-gradient-to-br from-gray-600 to-gray-700'
  },
  {
    id: 'student',
    name: 'Estudiante',
    price: '5€/mes',
    description: 'Para el futuro de la farmacia',
    features: [
      'Acceso para estudiantes de farmacia',
      'Contenido adaptado a formación',
      'Recursos para desarrollo profesional',
      'Comunidad de estudiantes y mentores',
      'Preparación para el mundo laboral',
      'Upgrade con descuento al graduarse'
    ],
    highlighted: false,
    color: 'bg-gradient-to-br from-green-600 to-blue-600'
  }
];

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

const testimonials = [
  {
    name: 'Josep Daries',
    role: 'Titular de Farmacia en Valencia',
    quote: 'El Portal farmapro ha transformado completamente nuestra forma de trabajar. El acceso a recursos de esta calidad desde cualquier dispositivo nos ha dado una ventaja competitiva que se refleja directamente en nuestros resultados.',
    featured: true
  },
  {
    name: 'Antonio García',
    role: 'Titular de Farmacia en Barcelona',
    quote: 'Los recursos del Portal farmapro nos han permitido implementar un sistema de categorías que ha incrementado nuestras ventas de dermocosmética un 34% en solo dos meses. La inversión se recupera con creces.'
  },
  {
    name: 'Lucía Fernández',
    role: 'Farmacéutica Adjunta en Madrid',
    quote: 'Como adjunta, valoro especialmente la formación continua y la comunidad. He conectado con otros profesionales que comparten mis inquietudes y juntos hemos implementado mejoras que están transformando nuestra farmacia.'
  },
  {
    name: 'Carlos Martínez',
    role: 'Responsable de Marketing en Farmacia de Sevilla',
    quote: 'El generador de contenidos con IA nos ahorra horas cada semana y ha mejorado notablemente nuestra presencia en redes sociales. Nuestros seguidores han aumentado un 67% y lo mejor es que se traduce en visitas reales a la farmacia.'
  },
  {
    name: 'Paula Sánchez',
    role: 'Estudiante de último año de Farmacia',
    quote: 'Como estudiante, el plan especial me permite acceder a recursos que complementan perfectamente mi formación académica. La comunidad me ha ayudado incluso a encontrar prácticas y orientar mi futuro profesional.'
  }
];

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

const Subscription = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'plans') {
      setActiveTab('plans');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">
              Portal farmapro: Recursos Exclusivos para la gestión eficaz de tu farmacia
            </h1>
            <h2 className="text-2xl mb-6 opacity-90">
              Accede al Conocimiento, Herramientas y Recursos que Están Transformando las Farmacias Líderes en España
            </h2>
            <p className="text-xl mb-8 leading-relaxed">
              Bienvenido al Portal farmapro, el espacio digital exclusivo donde los profesionales farmacéuticos más ambiciosos encuentran todo lo necesario para llevar su práctica al siguiente nivel. Aquí convergen formación avanzada, herramientas especializadas y contenidos premium que no encontrarás en ningún otro lugar.
            </p>
            <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-semibold px-8 py-4 text-lg mb-8">
              COMENZAR MI PRUEBA GRATUITA
            </Button>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <p className="text-lg italic mb-2">
                "El Portal farmapro ha transformado completamente nuestra forma de trabajar. El acceso a recursos de esta calidad desde cualquier dispositivo nos ha dado una ventaja competitiva que se refleja directamente en nuestros resultados."
              </p>
              <p className="font-semibold">Josep Daries - Titular de Farmacia en Valencia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
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

      {/* Portal Preview Section */}
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

      {/* Featured Content Section */}
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

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Planes Diseñados para Cada Perfil Profesional</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ofrecemos diferentes opciones de suscripción para adaptarnos a las necesidades específicas de cada profesional farmacéutico. Todos los planes incluyen acceso completo al Portal farmapro.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative hover:shadow-xl transition-shadow ${plan.highlighted ? 'ring-2 ring-blue-600' : ''}`}>
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">Más Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${plan.color} flex items-center justify-center`}>
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-blue-600">{plan.price}</div>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full ${plan.highlighted ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-800'} text-white`}>
                    ELEGIR ESTE PLAN
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">30 días de prueba gratuita sin compromiso - Cancelación sencilla en cualquier momento</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">La Comunidad farmapro Habla</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.slice(1).map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic">"{testimonial.quote}"</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{testimonial.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Se unen 47 nuevos miembros cada semana - 1,234 recursos descargados este mes
            </Badge>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="trial" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">¿Cómo funciona el período de prueba gratuito?</AccordionTrigger>
              <AccordionContent>
                Al registrarte, disfrutarás de 30 días completos con acceso total a todo el contenido del Portal farmapro. Podrás explorar todas las secciones, descargar recursos, participar en la comunidad y comprobar por ti mismo el valor que aporta. Si decides que no es para ti, puedes cancelar en cualquier momento antes de que finalice el período de prueba y no se te cobrará nada.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="change-plan" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">¿Puedo cambiar de plan después de suscribirme?</AccordionTrigger>
              <AccordionContent>
                Sí, puedes actualizar o cambiar tu plan en cualquier momento. Si cambias a un plan superior, la diferencia se prorrateará por el tiempo restante de tu suscripción actual. Si cambias a un plan inferior, el nuevo precio se aplicará en tu próxima renovación.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="content-updates" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">¿Con qué frecuencia se actualiza el contenido?</AccordionTrigger>
              <AccordionContent>
                Añadimos nuevo contenido semanalmente. Cada mes incorporamos al menos un nuevo curso o serie completa, 5-10 nuevos recursos descargables, y actualizamos las herramientas digitales con nuevas funcionalidades. Además, el contenido existente se revisa y actualiza regularmente para garantizar que siempre esté al día con las últimas tendencias y normativas.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="team-access" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">¿Cómo puedo compartir el acceso con mi equipo?</AccordionTrigger>
              <AccordionContent>
                Con el Plan Premium Farmacia, puedes invitar hasta 5 miembros de tu equipo que recibirán sus propias credenciales de acceso. Cada miembro tendrá su perfil personalizado y podrá seguir su propio progreso en cursos y guardar sus recursos favoritos, pero compartirán la cuota de la suscripción.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="download-resources" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">¿Puedo descargar los recursos para usarlos en mi farmacia?</AccordionTrigger>
              <AccordionContent>
                Absolutamente. Todos los recursos están diseñados para ser descargados, personalizados y utilizados en tu farmacia. Las plantillas, protocolos, y demás materiales pueden adaptarse con tu logo y datos específicos para su implementación inmediata.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="spanish-content" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">¿El contenido está adaptado a la normativa española?</AccordionTrigger>
              <AccordionContent>
                Sí, todo el contenido del Portal farmapro está específicamente creado para el contexto farmacéutico español. Tanto los aspectos legales, regulatorios, como las estrategias de mercado y gestión están adaptados a la realidad específica de las farmacias en España, incluyendo actualizaciones cuando la normativa cambia.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Main CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Transforma tu Farmacia con Acceso Premium</h2>
          <p className="text-xl mb-8 leading-relaxed">
            El Portal farmapro es la inversión más rentable que puedes hacer en el desarrollo de tu farmacia y tu propia carrera profesional. Con acceso instantáneo a recursos exclusivos, formación especializada y una comunidad de profesionales innovadores, tendrás todas las herramientas necesarias para destacar en un sector cada vez más competitivo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">Acceso ilimitado</h3>
              <p className="text-sm opacity-90">A todo el contenido premium</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">Nuevos recursos</h3>
              <p className="text-sm opacity-90">Cada semana</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">Soporte especializado</h3>
              <p className="text-sm opacity-90">Cuando lo necesites</p>
            </div>
          </div>
          <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-semibold px-8 py-4 text-lg mb-4">
            COMENZAR MI PRUEBA GRATUITA DE 30 DÍAS
          </Button>
          <p className="text-sm opacity-90">Sin compromiso. Cancelación sencilla en cualquier momento. Sin preguntas.</p>
        </div>
      </section>

      {/* Additional Features Section */}
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

      {/* Onboarding Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Comienza tu Viaje en el Portal farmapro</h2>
            <p className="text-lg text-gray-600">En solo 2 minutos estarás accediendo a recursos exclusivos que transformarán tu farmacia</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-3">Regístrate y Explora</h3>
              <p className="text-gray-600">Crea tu cuenta, personaliza tu perfil y descubre todo el contenido disponible en el portal.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-3">Identifica tus Prioridades</h3>
              <p className="text-gray-600">Utiliza nuestro asistente de recomendación para encontrar el contenido más relevante para tus necesidades específicas.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-3">Implementa y Transforma</h3>
              <p className="text-gray-600">Descarga recursos, aplica los conocimientos adquiridos y comparte tus éxitos con la comunidad.</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
              COMENZAR AHORA
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Subscription;
