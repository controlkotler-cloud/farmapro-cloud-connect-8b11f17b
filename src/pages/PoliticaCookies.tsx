
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copyright } from 'lucide-react';

const PoliticaCookies = () => {
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
              Política de Cookies
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-green max-w-none space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">¿Qué son las cookies?</h2>
              <p className="text-gray-700 leading-relaxed">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas farmapro. 
                Nos ayudan a recordar tus preferencias, mejorar tu experiencia de navegación y entender cómo utilizas 
                nuestra plataforma.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Tipos de cookies que utilizamos</h2>
              
              <h3 className="text-xl font-medium text-green-600 mb-2">Cookies Necesarias</h3>
              <p className="text-gray-700 mb-4">
                Son esenciales para el funcionamiento básico de farmapro. Permiten la navegación segura, 
                autenticación de usuarios y funcionalidades básicas de la plataforma.
              </p>

              <h3 className="text-xl font-medium text-green-600 mb-2">Cookies de Análisis</h3>
              <p className="text-gray-700 mb-4">
                Nos ayudan a entender cómo interactúas con nuestra plataforma mediante herramientas como 
                Google Analytics. Esta información es anónima y nos permite mejorar continuamente farmapro.
              </p>

              <h3 className="text-xl font-medium text-green-600 mb-2">Cookies de Marketing</h3>
              <p className="text-gray-700 mb-4">
                Utilizadas para mostrar contenido y anuncios relevantes basados en tus intereses y actividad 
                en farmapro, tanto en nuestra plataforma como en sitios web de terceros.
              </p>

              <h3 className="text-xl font-medium text-green-600 mb-2">Cookies de Preferencias</h3>
              <p className="text-gray-700 mb-4">
                Guardan tus configuraciones personalizadas, como idioma, región, tema de la interfaz y otras 
                preferencias para mejorar tu experiencia en farmapro.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Gestión de cookies</h2>
              <p className="text-gray-700 mb-4">
                Puedes gestionar tus preferencias de cookies en cualquier momento haciendo clic en el icono 
                de cookies que aparece en la esquina inferior derecha de la pantalla, o a través de la 
                configuración de tu navegador.
              </p>
              <p className="text-gray-700">
                Al continuar navegando en farmapro sin cambiar la configuración de cookies de tu navegador, 
                aceptas el uso de cookies según se describe en esta política.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Contacto</h2>
              <p className="text-gray-700">
                Si tienes preguntas sobre nuestra política de cookies, puedes contactarnos a través de 
                nuestra página de contacto o enviando un email a: 
                <span className="font-medium"> cookies@farmapro.com</span>
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
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

export default PoliticaCookies;
