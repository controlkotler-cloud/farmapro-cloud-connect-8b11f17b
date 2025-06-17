
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const PoliticaCookies = () => {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4">
        <div className="max-w-4xl mx-auto py-8">
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
      </div>
    </DashboardLayout>
  );
};

export default PoliticaCookies;
