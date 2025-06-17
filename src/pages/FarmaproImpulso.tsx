
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, Target, FileText, Users, TrendingUp, Award, Download, Mail, Star, ArrowRight, Clock, Shield } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

const FarmaproImpulso = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulario enviado:', formData);
    // Aquí iría la lógica de envío
  };

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
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
              Suscribirse Gratis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">farmapro IMPULSO</span>: Estrategias probadas que transforman farmacias
          </h1>
          <h2 className="text-2xl md:text-3xl text-gray-700 mb-6 font-medium">
            La newsletter quincenal que +3.000 profesionales farmacéuticos no se quieren perder
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            farmapro IMPULSO no es una newsletter más. Es una dosis concentrada de estrategias probadas, análisis exclusivos y recursos prácticos que están transformando farmacias en toda España. Cada quince días, entregamos directamente en tu bandeja de entrada el conocimiento que necesitas para destacar en un sector cada vez más competitivo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg px-8 py-3">
              QUIERO RECIBIR farmapro IMPULSO
            </Button>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-medium">
              Totalmente gratuita – Acceso prioritario a recursos exclusivos
            </p>
          </div>
        </div>
      </section>

      {/* Sección de Valor Inmediato */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Lo que recibirás cada quincena
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cada edición de farmapro IMPULSO está meticulosamente diseñada para ofrecerte valor inmediato y accionable. No te vamos a facilitar simples consejos teóricos; te vamos a aportar estrategias que vas a poder implementar en tu farmacia desde el mismo día.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Análisis Estratégicos Exclusivos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Profundizamos en un desafío específico que enfrentan las farmacias actuales y lo desglosamos con datos reales y perspectiva consultora.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Soluciones Prácticas y Accionables</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Cada newsletter incluye al menos 3 estrategias concretas que puedes implementar inmediatamente en tu farmacia con resultados visibles.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Download className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Recursos Descargables de Alta Calidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Plantillas, checklists, protocolos y herramientas prácticas diseñadas específicamente para farmacias como la tuya.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Casos Reales Inspiradores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Historias de éxito de farmacias que han implementado cambios estratégicos y están viendo resultados extraordinarios.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Perspectivas de Expertos del Sector</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Entrevistas exclusivas y opiniones de referentes del sector farmacéutico que comparten su visión y mejores prácticas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sección de Previsualización */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              Así es farmapro IMPULSO
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Primera newsletter que vas a recibir:</h3>
                </div>
                <h4 className="text-2xl font-bold text-blue-600 mb-4">
                  "La farmacia silenciosa: como perder ventas sin darte cuenta"
                </h4>
                <blockquote className="text-lg text-gray-600 italic border-l-4 border-blue-600 pl-4">
                  "El 68% de tus clientes potenciales se va sin comprar por este motivo silencioso. ¿Lo estás detectando?"
                </blockquote>
                <Button className="mt-6 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  HAZ CLIC PARA RECIBIRLA
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md">
                <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-t-lg p-4 text-white">
                  <Mail className="h-8 w-8 mb-2" />
                  <h3 className="font-bold">farmapro IMPULSO</h3>
                  <p className="text-sm opacity-90">Newsletter Quincenal</p>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Testimonios */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              Lo que dicen nuestros lectores
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "me gusta farmapro IMPULSO porque en cada envío nos trae ideas que implementamos en la farmacia inmediatamente. El mes pasado aplicamos la estrategia de cross-selling ético y nuestro ticket medio ha aumentado un 17% sin que mi equipo tenga la sensación de estar presionando a los pacientes."
                </p>
                <div className="font-semibold text-gray-900">Carmen Rodríguez</div>
                <div className="text-sm text-gray-500">Titular de Farmacia en Barcelona</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "No exagero al decir que es la mejor newsletter de nuestro sector. Le hemos dado una vuelta completa a nuestra categoría de dermocosmética siguiendo sus consejos y la verdad es que los resultados han superado todas nuestras expectativas."
                </p>
                <div className="font-semibold text-gray-900">Rafael</div>
                <div className="text-sm text-gray-500">Adjunto en Farmacia de Leganés, Madrid</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Como estudiante de último año, farmapro IMPULSO me está dando una visión real del sector que no obtengo en la facultad. Ya he implementado algunas ideas en la farmacia donde hago prácticas y el titular está impresionado."
                </p>
                <div className="font-semibold text-gray-900">Laura Martínez</div>
                <div className="text-sm text-gray-500">Estudiante de Farmacia</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-lg font-semibold text-gray-700">
              3.000+ profesionales farmacéuticos confían en farmapro IMPULSO para impulsar sus farmacias
            </p>
          </div>
        </div>
      </section>

      {/* Sección de Recursos Gratuitos */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Recursos exclusivos para suscriptores
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Al suscribirte a farmapro IMPULSO, no solo recibes análisis y estrategias quincenales. También accedes a una biblioteca creciente de recursos descargables diseñados específicamente para impulsar tu farmacia.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Checklist "10 Señales de Alarma en la Experiencia del Cliente"</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Identifica rápidamente los puntos críticos que pueden estar ahuyentando a tus clientes y aprende a corregirlos.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Plantilla "Distribución Estratégica por Categorías de Alto Margen"</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Optimiza la disposición de productos en tu farmacia para maximizar la visibilidad de los más rentables.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Award className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>"Plan de Incentivos Personalizado para Farmacias"</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Estructura de incentivos probada para motivar a tu equipo y alinear sus objetivos con los de la farmacia.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-orange-600 mb-2" />
                <CardTitle>"Calculadora de Rotación Óptima de Stock"</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Herramienta Excel para determinar los niveles ideales de inventario y evitar el capital inmovilizado.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Cada recurso ha sido desarrollado por expertos y testado en farmacias reales
            </p>
          </div>
        </div>
      </section>

      {/* Sección de Preguntas Frecuentes */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              Preguntas frecuentes sobre farmapro IMPULSO
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>¿Realmente es gratuita? ¿Cuál es el truco?</AccordionTrigger>
              <AccordionContent>
                Sí, farmapro IMPULSO es completamente gratuita. No hay trucos ni letras pequeñas. Forma parte de nuestro compromiso con la mejora del sector farmacéutico. Por supuesto, si después de beneficiarte del contenido deseas explorar nuestros servicios de consultoría o el Portal farmapro, estaremos encantados, pero no es obligatorio en absoluto.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>¿Con qué frecuencia recibiré farmapro IMPULSO?</AccordionTrigger>
              <AccordionContent>
                La newsletter se envía cada quince días. Este intervalo de tiempo está cuidadosamente estudiado para ofrecerte contenido sustancial y de calidad, dándote tiempo suficiente para implementar las estrategias propuestas antes de recibir nueva información.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>¿El contenido está adaptado a cualquier tipo de farmacia?</AccordionTrigger>
              <AccordionContent>
                farmapro IMPULSO se diseña pensando en la diversidad del sector farmacéutico. Incluimos estrategias aplicables a farmacias grandes, pequeñas, urbanas, rurales, de barrio, turísticas, etc. Además, cada edición ofrece diferentes niveles de implementación para adaptarse tanto a farmacias con recursos limitados como a aquellas que buscan transformaciones más ambiciosas.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>¿Puedo compartir el contenido con mi equipo?</AccordionTrigger>
              <AccordionContent>
                ¡Por supuesto! Te animamos a compartir farmapro IMPULSO con todo tu equipo. De hecho, muchas farmacias organizan breves reuniones tras recibir cada edición para discutir qué estrategias implementarán y cómo las adaptarán a su realidad específica.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>¿Puedo cancelar la suscripción en cualquier momento?</AccordionTrigger>
              <AccordionContent>
                Absolutamente. Cada edición incluye un enlace de cancelación en el pie del email. Un solo clic y dejarás de recibir la newsletter, sin preguntas ni complicaciones. Aunque esperamos que el valor que aportamos te haga querer seguir con nosotros por mucho tiempo.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger>¿Cómo se relaciona farmapro IMPULSO con el resto del ecosistema farmapro?</AccordionTrigger>
              <AccordionContent>
                farmapro IMPULSO es solo la puerta de entrada al ecosistema completo. Te permite beneficiarte de nuestro conocimiento y experiencia sin compromiso. Si después quieres profundizar, puedes explorar nuestros servicios de consultoría, formación o acceder al Portal de Suscripción con recursos premium. Todo está diseñado como un continuo que se adapta a tus necesidades.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Sección de Formulario de Suscripción */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Únete al ecosistema y dale tu propio IMPULSO a tu farmacia
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Más de 3.000 profesionales farmacéuticos como tú ya están recibiendo farmapro IMPULSO. No te quedes atrás en un sector que evoluciona a ritmo vertiginoso. Empieza a recibirla desde la primera edición para no perderte nada.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-8 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input 
                  id="name"
                  name="name"
                  type="text" 
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Tu nombre completo" 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com" 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="position">Puesto</Label>
                <select 
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Selecciona tu puesto</option>
                  <option value="titular">Titular</option>
                  <option value="adjunto">Adjunto</option>
                  <option value="tecnico">Técnico</option>
                  <option value="estudiante">Estudiante</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              
              <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                SUSCRIBIRME AHORA
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Respetamos tu bandeja de entrada. Solo recibirás farmapro IMPULSO y ocasionalmente información relevante del ecosistema farmapro. Nunca compartimos tus datos.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Bonus */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Beneficios exclusivos para nuevos suscriptores
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Al suscribirte hoy a farmapro IMPULSO, además de recibir la primera newsletter quincenal, obtendrás estos beneficios exclusivos:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow text-center">
              <CardHeader>
                <Download className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Acceso Inmediato a la guía "25 KPIs ESENCIALES PARA LA FARMACIA MODERNA"</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Recibe hoy mismo la Guía para monitorizar y mejorar el rendimiento de tu farmacia.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow text-center">
              <CardHeader>
                <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Prioridad en Webinars y Eventos farmapro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Serás el primero en recibir invitaciones a nuestros eventos exclusivos, tanto online como presenciales.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow text-center">
              <CardHeader>
                <Award className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>10% de Descuento en tu Primera Contratación</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Si en el futuro decides explorar cualquier servicio del ecosistema farmapro, disfrutarás de un descuento especial por ser suscriptor.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg px-12 py-4">
              QUIERO TODOS ESTOS BENEFICIOS
            </Button>
          </div>
        </div>
      </section>

      {/* Sección de Última Oportunidad */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              ¿Qué harás con la próxima edición de farmapro IMPULSO?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-red-800 mb-6">Sin farmapro IMPULSO</h3>
              <ul className="space-y-4 text-red-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  Seguir enfrentando los mismos desafíos sin nuevas estrategias
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  Ver cómo otras farmacias implementan innovaciones efectivas
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  Perder oportunidades por falta de información actualizada
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  Repetir enfoques que ya no funcionan en el entorno actual
                </li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-green-800 mb-6">Con farmapro IMPULSO</h3>
              <ul className="space-y-4 text-green-700">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  Descubrir estrategias probadas que puedes implementar inmediatamente
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  Posicionar tu farmacia a la vanguardia del sector
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  Acceder a recursos exclusivos que simplifican tu gestión
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  Formar parte de una comunidad de profesionales innovadores
                </li>
              </ul>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg px-12 py-4">
              UNIRME A farmapro HOY
            </Button>
            <p className="mt-4 text-gray-600">
              Una simple suscripción gratuita puede ser el primer paso hacia la farmacia que siempre has querido tener.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FarmaproImpulso;
