
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Copyright, 
  Mail, 
  Phone, 
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle,
  Users,
  FileText,
  Zap,
  CreditCard,
  Settings,
  HelpCircle,
  Send,
  ArrowUp,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Youtube
} from 'lucide-react';

const FaqsContacto = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const categories = [
    { id: 'farmapro', label: 'Sobre farmapro', icon: Users, description: 'Todo sobre nuestro ecosistema digital, nuestra filosofía y el equipo.' },
    { id: 'servicios', label: 'Servicios y Consultoría', icon: Settings, description: 'Información sobre nuestros servicios profesionales.' },
    { id: 'newsletter', label: 'Newsletter farmapro IMPULSO', icon: Zap, description: 'Dudas sobre nuestra newsletter quincenal gratuita.' },
    { id: 'portal', label: 'Portal de Suscripción', icon: FileText, description: 'Preguntas sobre acceso, contenidos y planes.' },
    { id: 'facturacion', label: 'Facturación y Pagos', icon: CreditCard, description: 'Información sobre precios, facturación y métodos de pago.' },
    { id: 'soporte', label: 'Soporte Técnico', icon: HelpCircle, description: 'Ayuda con accesos, descargas y funcionalidades.' }
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <img src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" alt="farmapro" className="w-10 h-10" />
              <img src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" alt="farmapro" className="h-8" />
            </Link>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-green-800 mb-6">
            Preguntas Frecuentes y Contacto
          </h1>
          <h2 className="text-2xl md:text-3xl text-green-700 mb-6">
            Estamos Aquí para Resolver tus Dudas y Acompañarte en Cada Paso
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-4xl mx-auto">
            En farmapro entendemos que tomar decisiones para tu farmacia requiere información clara y respuestas precisas. 
            Hemos recopilado las preguntas más frecuentes sobre nuestro ecosistema digital y te ofrecemos múltiples vías 
            de contacto para resolver cualquier consulta adicional. Nuestro equipo de especialistas está listo para acompañarte.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => document.getElementById('faqs')?.scrollIntoView()}>
              PREGUNTAS FRECUENTES
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('contacto')?.scrollIntoView()}>
              CONTACTO DIRECTO
            </Button>
          </div>
        </div>
      </section>

      {/* Navegación por Categorías */}
      <section className="py-12 px-4 bg-white" id="categorias">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-green-800 mb-12">
            Encuentra Rápidamente lo que Buscas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  activeCategory === category.id ? 'ring-2 ring-green-500 bg-green-50' : ''
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                <CardContent className="p-6 text-center">
                  <category.icon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{category.label}</h3>
                  <p className="text-gray-600 text-sm">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Preguntas Frecuentes */}
      <section className="py-16 px-4" id="faqs">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-green-800 mb-12">
            Preguntas Frecuentes sobre farmapro
          </h2>

          {/* Sobre farmapro */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-green-700 mb-6">Sobre farmapro</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="farmapro-1">
                <AccordionTrigger>¿Qué es exactamente farmapro?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  farmapro es el ecosistema digital integral de referencia para farmacias en España, diseñado específicamente para impulsar el éxito de farmacias como la tuya. Incluye servicios profesionales de consultoría y marketing, una newsletter gratuita (farmapro IMPULSO), un blog especializado y un portal de suscripción con recursos premium. Cada componente puede funcionar independientemente, pero todos están diseñados para complementarse y ofrecer una solución completa para los profesionales farmacéuticos.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="farmapro-2">
                <AccordionTrigger>¿Qué diferencia a farmapro de otras soluciones para farmacias?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Tres elementos nos diferencian claramente: 1) Nuestro enfoque exclusivo en el sector farmacéutico, con soluciones adaptadas a su normativa y realidad específica; 2) La integración de servicios profesionales con recursos digitales en un ecosistema coherente; y 3) Nuestro equipo multidisciplinar que combina una dilatada experiencia en gestión y marketing farmacéutico con la adaptación tecnológica que necesita la farmacia de hoy.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="farmapro-3">
                <AccordionTrigger>¿Quién está detrás de farmapro?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  farmapro surge como evolución de la división farmacéutica de MkPro, tras más de 15 años de experiencia trabajando con farmacias en toda España. Nuestro equipo está liderado por Alejandro Tellería, con amplia experiencia en el sector farmacéutico, y Francesc Fernández, experto en soluciones tecnológicas. Nos respalda un equipo multidisciplinar de consultores, farmacéuticos, especialistas en marketing y desarrolladores.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="farmapro-4">
                <AccordionTrigger>¿Trabajáis con cualquier tipo de farmacia?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Sí, nuestras soluciones se adaptan a todo tipo de farmacias: grandes, pequeñas, urbanas, rurales, de barrio o turísticas. Para cada cliente diseñamos estrategias personalizadas según su ubicación, tamaño, equipo y objetivos específicos. Contamos con casos de éxito en farmacias de todo tipo.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Servicios y Consultoría */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-green-700 mb-6">Servicios y Consultoría</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="servicios-1">
                <AccordionTrigger>¿Qué servicios específicos ofrecéis para farmacias?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Nuestro catálogo incluye consultoría estratégica (análisis DAFO, plan estratégico, optimización de categorías, formación de equipos), marketing digital (gestión de redes sociales, diseño web, SEO local, campañas), formación especializada (in-company, técnicas de venta) e implementación de servicios profesionales innovadores. Cada servicio puede contratarse individualmente o en paquetes integrales.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="servicios-2">
                <AccordionTrigger>¿Cómo se inicia una colaboración con farmapro?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  El proceso comienza con una consulta inicial gratuita donde analizamos tus necesidades específicas y objetivos. Posteriormente, realizamos un diagnóstico más detallado que nos permite diseñar una propuesta personalizada. Una vez acordado el alcance, establecemos un plan de acción con objetivos, plazos y métricas claras, e iniciamos la implementación con seguimiento continuo.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="servicios-3">
                <AccordionTrigger>¿Cuánto tiempo dura una colaboración típica?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  La duración varía según el tipo de proyecto. Las intervenciones puntuales (como análisis o formaciones específicas) pueden resolverse en 1-3 meses, mientras que las transformaciones integrales suelen requerir colaboraciones de 6-12 meses para garantizar una implementación efectiva y resultados sostenibles. También ofrecemos acompañamiento continuo a largo plazo para farmacias que desean un apoyo permanente.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="servicios-4">
                <AccordionTrigger>¿Qué resultados puedo esperar al trabajar con farmapro?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Los resultados varían según los objetivos específicos de cada proyecto, pero nuestros clientes habitualmente experimentan: incremento en ventas de categorías estratégicas (20-40%), mejora del ticket medio (15-25%), optimización de la rentabilidad por metro cuadrado, mayor eficiencia operativa, mejora de la presencia digital y mayor satisfacción tanto de clientes como del equipo. Establecemos KPIs concretos al inicio de cada colaboración para que puedas medir al milímetro los resultados de cada acción que emprendas con farmapro.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="servicios-5">
                <AccordionTrigger>¿Trabajáis de forma presencial o remota?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Combinamos ambas modalidades según las necesidades del proyecto. Algunas fases requieren presencialidad (como auditorías iniciales, formaciones prácticas o implementaciones físicas), mientras que otras se desarrollan eficientemente en remoto (seguimientos, análisis de datos, consultas). Adaptamos nuestra metodología para ofrecer la máxima eficiencia y comodidad, especialmente para farmacias en zonas menos accesibles.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Newsletter farmapro IMPULSO */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-green-700 mb-6">Newsletter farmapro IMPULSO</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="newsletter-1">
                <AccordionTrigger>¿Qué es exactamente farmapro IMPULSO?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  farmapro IMPULSO es nuestra newsletter premium quincenal gratuita dirigida a profesionales farmacéuticos. Cada edición aborda un desafío específico del sector, ofreciendo análisis detallados, estrategias prácticas, recursos descargables y perspectivas expertas. Es una dosis concentrada de conocimiento accionable que miles de profesionales ya reciben regularmente.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="newsletter-2">
                <AccordionTrigger>¿Realmente es gratuita? ¿Cuál es el "truco"?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Sí, farmapro IMPULSO es completamente gratuita y lo seguirá siendo. No hay trucos ni letra pequeña. Es nuestra forma de aportar valor al sector y demostrar nuestro conocimiento. Si después de beneficiarte del contenido gratuito deseas explorar nuestros servicios o el Portal, estaremos encantados, pero no es obligatorio en absoluto.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="newsletter-3">
                <AccordionTrigger>¿Con qué frecuencia recibiré la newsletter?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  farmapro IMPULSO se envía cada dos semanas, habitualmente los jueves. Esta rutina está cuidadosamente estudiada para ofrecerte contenido de calidad, dándote tiempo suficiente para implementar las estrategias propuestas antes de recibir nueva información.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="newsletter-4">
                <AccordionTrigger>¿Puedo cancelar mi suscripción en cualquier momento?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Por supuesto. Cada edición incluye un enlace de cancelación en el pie del email. Un solo clic y dejarás de recibir la newsletter, sin preguntas ni complicaciones. Valoramos tu bandeja de entrada y por eso respetamos al máximo tu decisión.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="newsletter-5">
                <AccordionTrigger>¿Puedo acceder a ediciones anteriores?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Al suscribirte, recibirás automáticamente acceso a las tres últimas ediciones. Para acceder al archivo completo de ediciones anteriores, puedes suscribirte al Portal farmapro, donde encontrarás todo el histórico de newsletters organizadas por temáticas.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Portal de Suscripción */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-green-700 mb-6">Portal de Suscripción</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="portal-1">
                <AccordionTrigger>¿Qué incluye exactamente el Portal farmapro?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  El Portal farmapro es nuestro espacio digital premium donde encontrarás: 1) Formación especializada (cursos, masterclasses, tutoriales); 2) Biblioteca de recursos descargables (plantillas, protocolos, checklist); 3) Herramientas digitales exclusivas (generador de contenidos con IA, calculadoras); 4) Comunidad privada de profesionales; y 5) Contenido anticipado (análisis de tendencias, informes). Todo el contenido está especialmente diseñado para el sector farmacéutico español.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="portal-2">
                <AccordionTrigger>¿Cómo funciona la prueba gratuita?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Al registrarte, disfrutas de 30 días completos con acceso total a todo el contenido del Portal. Puedes explorar todas las secciones, descargar recursos, participar en la comunidad y comprobar el valor por ti mismo. Si decides que no es para ti, puedes cancelar en cualquier momento antes de que finalice el período y no se te cobrará nada.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="portal-3">
                <AccordionTrigger>¿Con qué frecuencia se actualiza el contenido?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Añadimos nuevo contenido semanalmente. Cada mes incorporamos al menos un nuevo curso o serie completa, 5-10 nuevos recursos descargables, y actualizamos las herramientas digitales con nuevas funcionalidades. Además, el contenido existente se revisa y actualiza regularmente para garantizar que siempre esté al día.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="portal-4">
                <AccordionTrigger>¿Puedo compartir el acceso con mi equipo?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Con el Plan Premium Farmacia, puedes invitar hasta 5 miembros de tu equipo que recibirán sus propias credenciales. Cada uno tendrá su perfil personalizado y podrá seguir su propio progreso, pero compartirán la cuota de la suscripción.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="portal-5">
                <AccordionTrigger>¿Los recursos se pueden personalizar para mi farmacia?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Absolutamente. Todos los recursos están diseñados para ser descargados, adaptados y utilizados en tu farmacia. Las plantillas, protocolos y demás materiales pueden personalizarse con tu logo y datos específicos para implementación inmediata.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Facturación y Pagos */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-green-700 mb-6">Facturación y Pagos</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="facturacion-1">
                <AccordionTrigger>¿Qué métodos de pago aceptáis?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express), PayPal y domiciliación bancaria para clientes en España. Para servicios de consultoría y proyectos personalizados también ofrecemos transferencia bancaria.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="facturacion-2">
                <AccordionTrigger>¿Cómo funciona la facturación del Portal de Suscripción?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  La facturación se realiza de forma automática según el ciclo elegido (mensual o anual). Recibirás la factura por email inmediatamente después de cada cargo. Todas nuestras facturas cumplen con la normativa fiscal vigente e incluyen el IVA correspondiente.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="facturacion-3">
                <AccordionTrigger>¿Hay permanencia en algún servicio?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  El Portal de Suscripción no tiene permanencia mínima; puedes cancelar en cualquier momento. Para servicios de consultoría y proyectos personalizados, establecemos acuerdos específicos según la naturaleza del proyecto, siempre con total transparencia desde el principio.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="facturacion-4">
                <AccordionTrigger>¿Ofrecéis descuentos por pago anual?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Sí, todos nuestros planes de suscripción ofrecen un descuento significativo por pago anual, equivalente aproximadamente a dos meses gratuitos respecto al pago mensual.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="facturacion-5">
                <AccordionTrigger>¿Se puede cambiar de plan una vez suscrito?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Sí, puedes actualizar o cambiar tu plan en cualquier momento. Si cambias a un plan superior, la diferencia se prorrateará por el tiempo restante. Si cambias a un plan inferior, el nuevo precio se aplicará en tu próxima renovación.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Soporte Técnico */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-green-700 mb-6">Soporte Técnico</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="soporte-1">
                <AccordionTrigger>¿Qué navegadores son compatibles con el Portal farmapro?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  El Portal farmapro es compatible con las versiones actualizadas de Chrome, Firefox, Safari, Edge y Opera. Recomendamos mantener tu navegador actualizado para disfrutar de todas las funcionalidades y la mejor experiencia posible.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="soporte-2">
                <AccordionTrigger>¿Puedo acceder desde dispositivos móviles?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Absolutamente. El Portal está completamente optimizado para dispositivos móviles y tablets. Tu progreso se sincroniza automáticamente entre dispositivos, permitiéndote continuar donde lo dejaste independientemente de cómo accedas.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="soporte-3">
                <AccordionTrigger>¿Qué hago si olvidé mi contraseña?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  En la página de inicio de sesión encontrarás un enlace "¿Olvidaste tu contraseña?" que te permitirá restablecerla fácilmente. Recibirás un email con instrucciones para crear una nueva contraseña de forma segura.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="soporte-4">
                <AccordionTrigger>¿Cómo puedo reportar un problema técnico?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Puedes reportar cualquier incidencia a través del formulario de contacto seleccionando "Soporte Técnico" en el asunto, o directamente enviando un email a soporte@farmapro.es. También ofrecemos chat en vivo durante horario laboral para resolver problemas urgentes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="soporte-5">
                <AccordionTrigger>¿Qué ocurre con mis datos personales?</AccordionTrigger>
                <AccordionContent className="text-gray-700">
                  Tratamos tu información con máxima seguridad y cumpliendo rigurosamente con el RGPD. Nunca compartimos tus datos con terceros sin tu consentimiento explícito y utilizamos encriptación avanzada para proteger toda la información sensible. Puedes consultar nuestra política de privacidad completa en el enlace correspondiente.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Sección de Contacto */}
      <section className="py-16 px-4 bg-white" id="contacto">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-green-800 mb-6">
            Contacta con Nosotros
          </h2>
          <p className="text-lg text-gray-700 text-center mb-12 max-w-3xl mx-auto">
            Estamos aquí para ayudarte. Elige el método de contacto que prefieras y te responderemos a la mayor brevedad posible. 
            Nuestro equipo está disponible de lunes a viernes de 9:00 a 18:00h.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulario de Contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-green-600" />
                  Formulario de Contacto
                </CardTitle>
                <p className="text-gray-600">
                  La forma más directa de hacernos llegar tu consulta. Indicando el motivo de tu contacto, 
                  podremos derivarlo al especialista adecuado.
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nombre y apellidos *</label>
                      <Input placeholder="Tu nombre completo" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email de contacto *</label>
                      <Input type="email" placeholder="tu@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Teléfono (opcional)</label>
                    <Input placeholder="+34 123 456 789" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Asunto *</label>
                    <select className="w-full p-2 border border-gray-300 rounded-md">
                      <option>Información General</option>
                      <option>Servicios</option>
                      <option>Newsletter</option>
                      <option>Portal</option>
                      <option>Soporte Técnico</option>
                      <option>Colaboraciones</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mensaje *</label>
                    <Textarea placeholder="Describe tu consulta..." rows={4} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="privacy" className="rounded" />
                    <label htmlFor="privacy" className="text-sm text-gray-600">
                      Acepto la política de privacidad
                    </label>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4 mr-2" />
                    ENVIAR CONSULTA
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Información de Contacto */}
            <div className="space-y-6">
              {/* Contacto Directo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-green-600" />
                    Contacto Directo
                  </CardTitle>
                  <p className="text-gray-600">
                    Si prefieres una comunicación más inmediata, utiliza estas vías:
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span>info@farmapro.es</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span>(+34) 876444920</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <span>WhatsApp Business: (+34) 6XX XXX XXX</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span>Lunes a viernes de 9:00 a 18:00h</span>
                  </div>
                </CardContent>
              </Card>

              {/* Redes Sociales */}
              <Card>
                <CardHeader>
                  <CardTitle>Redes Sociales</CardTitle>
                  <p className="text-gray-600">
                    Síguenos y contáctanos a través de nuestros perfiles:
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <Button variant="outline" size="icon">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Instagram className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Youtube className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Oficinas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Visita Nuestras Oficinas
                  </CardTitle>
                  <p className="text-gray-600">Solo con cita previa</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    Calle de la Farmacia, 123<br />
                    28001 Madrid, España
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-800 text-sm">
                Respondemos a todas las consultas en un plazo máximo de 24 horas laborables
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Preguntas Rápidas */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-green-800 mb-6">
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-lg text-gray-700 text-center mb-12">
            Si tienes una pregunta urgente, quizás estas respuestas rápidas puedan ayudarte:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Cómo puedo probar el Portal farmapro?</h3>
                <p className="text-gray-600 text-sm">
                  Simplemente regístrate en la página del Portal para comenzar tu prueba gratuita de 30 días con acceso completo.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Cuánto tiempo tarda la implementación de servicios?</h3>
                <p className="text-gray-600 text-sm">
                  Los tiempos varían según el servicio, pero normalmente comenzamos a trabajar en 1-2 semanas tras la aprobación del proyecto.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Trabajáis en toda España?</h3>
                <p className="text-gray-600 text-sm">
                  Sí, ofrecemos nuestros servicios a farmacias de toda España, tanto presencialmente como en remoto según las necesidades.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Ofrecéis facturación electrónica?</h3>
                <p className="text-gray-600 text-sm">
                  Sí, todas nuestras facturas se envían en formato electrónico compatible con los principales sistemas de gestión.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Existen descuentos para Colegios Farmacéuticos?</h3>
                <p className="text-gray-600 text-sm">
                  Ofrecemos condiciones especiales para grupos de colegiados. Contacta directamente para más información.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">¿Puedo solicitar una demo personalizada?</h3>
                <p className="text-gray-600 text-sm">
                  Por supuesto, podemos organizar una demostración adaptada a tus intereses específicos. Solicítala a través del formulario.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solicitud de Llamada */}
      <section className="py-16 px-4 bg-green-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-green-800 mb-6">
            ¿Prefieres que te Llamemos?
          </h2>
          <p className="text-lg text-gray-700 text-center mb-12">
            Si prefieres que uno de nuestros especialistas te contacte directamente por teléfono, 
            déjanos tus datos y te llamaremos en el horario que mejor te convenga.
          </p>
          
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nombre *</label>
                    <Input placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Teléfono *</label>
                    <Input placeholder="+34 123 456 789" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Mejor horario para llamarte *</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option>9:00 - 11:00</option>
                    <option>11:00 - 13:00</option>
                    <option>13:00 - 15:00</option>
                    <option>15:00 - 17:00</option>
                    <option>17:00 - 18:00</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Motivo *</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option>Información sobre servicios</option>
                    <option>Consulta técnica</option>
                    <option>Presupuesto personalizado</option>
                    <option>Demo del Portal</option>
                    <option>Otro</option>
                  </select>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Phone className="h-4 w-4 mr-2" />
                  SOLICITAR LLAMADA
                </Button>
              </form>
              <p className="text-xs text-gray-600 mt-4 text-center">
                Utilizamos tus datos exclusivamente para contactarte. No realizamos llamadas comerciales no solicitadas.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            ¿Listo para Transformar tu Farmacia?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Sea cual sea tu consulta o necesidad, estamos aquí para acompañarte en cada paso del camino. 
            El equipo farmapro combina pasión por el sector farmacéutico con experiencia y conocimiento 
            especializado para ofrecerte las soluciones que realmente marcan la diferencia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/servicios">
              <Button variant="secondary" size="lg">
                EXPLORAR SERVICIOS
              </Button>
            </Link>
            <Link to="/farmapro-impulso">
              <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-green-700">
                SUSCRIBIRSE A farmapro IMPULSO
              </Button>
            </Link>
            <Link to="/subscription">
              <Button variant="secondary" size="lg">
                PROBAR EL PORTAL
              </Button>
            </Link>
          </div>
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
              <p className="text-gray-400">
                La plataforma líder para el desarrollo de toda la farmacia.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Plataforma</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Formación</li>
                <li>Recursos</li>
                <li>Comunidad</li>
                <li>Retos</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Servicios</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Bolsa de Empleo</li>
                <li>Farmacias en Venta</li>
                <li>Eventos</li>
                <li>Promociones</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/politica-cookies" className="hover:text-white transition-colors">
                    Política de Cookies
                  </Link>
                </li>
                <li>
                  <Link to="/politica-privacidad" className="hover:text-white transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link to="/aviso-legal" className="hover:text-white transition-colors">
                    Aviso Legal
                  </Link>
                </li>
                <li>
                  <Link to="/contacto-soporte" className="hover:text-white transition-colors">
                    Contacto y Soporte
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Copyright className="h-4 w-4" />
                <span>2024 farmapro</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <Link 
                  to="/politica-cookies" 
                  className="hover:text-white transition-colors"
                >
                  Política de Cookies
                </Link>
                <Link 
                  to="/politica-privacidad" 
                  className="hover:text-white transition-colors"
                >
                  Política de Privacidad
                </Link>
                <Link 
                  to="/aviso-legal" 
                  className="hover:text-white transition-colors"
                >
                  Aviso Legal
                </Link>
                <Link 
                  to="/contacto-soporte" 
                  className="hover:text-white transition-colors"
                >
                  Contacto y Soporte
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Botón volver arriba */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 p-0 bg-green-600 hover:bg-green-700"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default FaqsContacto;
