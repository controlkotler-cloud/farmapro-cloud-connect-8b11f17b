
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, Phone, MapPin, Clock, MessageCircle, ArrowRight } from 'lucide-react';

const FaqsContacto = () => {
  const faqs = [
    {
      question: "¿Cómo puedo registrar mi farmacia en farmapro?",
      answer: "Para registrar tu farmacia, simplemente haz clic en 'Acceder al Portal' y selecciona 'Crear cuenta'. Completa el formulario con los datos de tu farmacia y sigue los pasos de verificación."
    },
    {
      question: "¿Qué incluye el plan Profesional?",
      answer: "El plan Profesional incluye acceso completo a todos los cursos, recursos descargables, participación en la comunidad, sistema de retos, directorio de farmacias y eventos exclusivos."
    },
    {
      question: "¿Los cursos están certificados?",
      answer: "Sí, todos nuestros cursos están certificados por organismos oficiales y son válidos para la formación continuada farmacéutica."
    },
    {
      question: "¿Puedo cambiar mi plan de suscripción?",
      answer: "Por supuesto. Puedes cambiar tu plan en cualquier momento desde tu perfil en el portal. Los cambios se aplicarán en el siguiente período de facturación."
    },
    {
      question: "¿Hay descuentos para grupos o cadenas de farmacias?",
      answer: "Sí, ofrecemos descuentos especiales para grupos de 5 o más farmacias. Contacta con nuestro equipo comercial para obtener una cotización personalizada."
    },
    {
      question: "¿Cómo funciona el sistema de puntos y niveles?",
      answer: "Ganas puntos completando cursos, participando en retos y siendo activo en la comunidad. Los puntos te permiten subir de nivel y acceder a beneficios exclusivos."
    }
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            FAQ's y Contacto
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Encuentra respuestas a tus preguntas o ponte en contacto con nosotros
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="faqs" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="faqs">Preguntas Frecuentes</TabsTrigger>
              <TabsTrigger value="contacto">Contacto</TabsTrigger>
            </TabsList>

            {/* FAQ's Tab */}
            <TabsContent value="faqs" className="space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Preguntas Frecuentes
                </h2>
                <p className="text-xl text-gray-600">
                  Respuestas a las preguntas más comunes sobre farmapro
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <Accordion type="single" collapsible className="space-y-4">
                  {faqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`item-${index}`}
                      className="bg-white rounded-lg border border-gray-200 px-6"
                    >
                      <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 pb-6">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="text-center pt-8">
                <p className="text-gray-600 mb-4">¿No encuentras lo que buscas?</p>
                <Button 
                  onClick={() => document.querySelector('[value="contacto"]')?.click()}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  Contactar Soporte
                  <MessageCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Contacto Tab */}
            <TabsContent value="contacto" className="space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Ponte en Contacto
                </h2>
                <p className="text-xl text-gray-600">
                  Estamos aquí para ayudarte. Elige la forma que prefieras para contactarnos
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Information */}
                <div className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Mail className="h-5 w-5 mr-2 text-blue-600" />
                        Email
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-2">Soporte técnico:</p>
                      <p className="font-medium">soporte@farmapro.es</p>
                      <p className="text-gray-600 mt-4 mb-2">Ventas y comercial:</p>
                      <p className="font-medium">ventas@farmapro.es</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Phone className="h-5 w-5 mr-2 text-green-600" />
                        Teléfono
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium text-xl">+34 900 123 456</p>
                      <p className="text-gray-600 mt-2">Línea directa de atención al cliente</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-purple-600" />
                        Horario de Atención
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p><span className="font-medium">Lunes a Viernes:</span> 9:00 - 18:00</p>
                        <p><span className="font-medium">Sábados:</span> 9:00 - 14:00</p>
                        <p><span className="font-medium">Domingos:</span> Cerrado</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-red-600" />
                        Oficinas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">farmapro España</p>
                      <p className="text-gray-600">Calle de la Innovación, 123</p>
                      <p className="text-gray-600">28001 Madrid, España</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Envíanos un Mensaje</CardTitle>
                    <CardDescription>
                      Completa el formulario y te responderemos en menos de 24 horas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Nombre *
                        </label>
                        <Input placeholder="Tu nombre" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Email *
                        </label>
                        <Input type="email" placeholder="tu@email.com" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Farmacia
                      </label>
                      <Input placeholder="Nombre de tu farmacia" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Asunto *
                      </label>
                      <Input placeholder="¿En qué podemos ayudarte?" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Mensaje *
                      </label>
                      <Textarea 
                        placeholder="Describe tu consulta o mensaje..."
                        rows={5}
                      />
                    </div>
                    
                    <Button 
                      size="lg" 
                      className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    >
                      Enviar Mensaje
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Quick Help Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Necesitas ayuda inmediata?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Accede a nuestros recursos de ayuda o inicia una conversación en tiempo real
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://portal.farmapro.es/login" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                Acceder al Portal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <Button size="lg" variant="outline">
              Chat en Vivo
              <MessageCircle className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default FaqsContacto;
