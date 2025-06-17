import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copyright, Mail, Phone, Clock, MapPin } from 'lucide-react';

const ContactoSoporte = () => {
  const currentYear = new Date().getFullYear();

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

      {/* Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-green-800">
              Contacto y Soporte
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-green max-w-none space-y-6">
            <div>
              <p className="text-gray-700 text-center text-lg">
                ¿Necesitas ayuda? Estamos aquí para apoyarte en tu desarrollo profesional farmacéutico.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-6 w-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-green-700">Email</h3>
                </div>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Soporte técnico:</strong> soporte@farmapro.com</p>
                  <p><strong>Formación:</strong> formacion@farmapro.com</p>
                  <p><strong>Facturación:</strong> facturacion@farmapro.com</p>
                  <p><strong>General:</strong> info@farmapro.com</p>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Phone className="h-6 w-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-green-700">Teléfono</h3>
                </div>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Soporte:</strong> +34 900 123 456</p>
                  <p><strong>Comercial:</strong> +34 900 123 457</p>
                  <p className="text-sm text-gray-600">
                    Llamadas gratuitas desde España
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-blue-700">Horarios de atención</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <div>
                  <p><strong>Lunes a Viernes:</strong></p>
                  <p>09:00 - 18:00 (CET)</p>
                </div>
                <div>
                  <p><strong>Fines de semana:</strong></p>
                  <p>Solo email (respuesta en 24-48h)</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-semibold text-green-700">Dirección postal</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  farmapro Formación S.L.<br />
                  Calle de la Farmacia, 123<br />
                  28001 Madrid, España
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Preguntas frecuentes</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-800">¿Cómo puedo restablecer mi contraseña?</h4>
                  <p className="text-gray-700">Utiliza la opción "¿Olvidaste tu contraseña?" en la página de inicio de sesión.</p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-800">¿Los certificados son válidos oficialmente?</h4>
                  <p className="text-gray-700">Sí, nuestros certificados están reconocidos por los Colegios Farmacéuticos para formación continuada.</p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-800">¿Puedo cancelar mi suscripción?</h4>
                  <p className="text-gray-700">Sí, puedes cancelar tu suscripción en cualquier momento desde tu perfil o contactando con nosotros.</p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-800">¿Ofrecen descuentos para estudiantes?</h4>
                  <p className="text-gray-700">Sí, tenemos un plan especial para estudiantes con verificación de matrícula.</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Tiempo de respuesta promedio:</strong> 2-4 horas en horario laboral
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <span>{currentYear} farmapro</span>
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
    </div>
  );
};

export default ContactoSoporte;
