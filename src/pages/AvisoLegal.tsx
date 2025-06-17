import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copyright } from 'lucide-react';

const AvisoLegal = () => {
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
              Aviso Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-green max-w-none space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Datos identificativos</h2>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Denominación social:</strong> farmapro Formación S.L.<br />
                  <strong>CIF:</strong> B-12345678<br />
                  <strong>Domicilio social:</strong> Calle de la Farmacia, 123, 28001 Madrid<br />
                  <strong>Email:</strong> info@farmapro.com<br />
                  <strong>Teléfono:</strong> +34 900 123 456<br />
                  <strong>Registro Mercantil:</strong> Madrid, Tomo 12345, Folio 67, Sección 8, Hoja M-123456
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Objeto y ámbito de aplicación</h2>
              <p className="text-gray-700">
                El presente aviso legal regula el uso del sitio web farmapro (en adelante, "la plataforma"), 
                que farmapro Formación S.L. pone a disposición de los usuarios de Internet. La utilización 
                de la plataforma atribuye la condición de usuario e implica la aceptación plena y sin reservas 
                de todas las disposiciones incluidas en este aviso legal.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Condiciones de uso</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>El acceso a la plataforma es gratuito salvo en lo relativo al coste de la conexión a través de la red de telecomunicaciones suministrada por el proveedor de acceso contratado por los usuarios.</li>
                <li>La utilización de la plataforma requiere registro previo y aceptación de las condiciones de uso.</li>
                <li>El usuario se compromete a hacer un uso adecuado de los contenidos y servicios que farmapro ofrece a través de su plataforma.</li>
                <li>Queda prohibido el uso de la plataforma con fines ilícitos o que puedan dañar la imagen, intereses y derechos de farmapro o de terceros.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Propiedad intelectual e industrial</h2>
              <p className="text-gray-700 mb-4">
                farmapro Formación S.L. es titular de todos los derechos de propiedad intelectual e industrial 
                de su página web, así como de los elementos contenidos en la misma (a título enunciativo, 
                imágenes, sonido, audio, vídeo, software o textos; marcas o logotipos, combinaciones de colores, 
                estructura y diseño, selección de materiales usados, programas de ordenador necesarios para su 
                funcionamiento, acceso y uso, etc.).
              </p>
              <p className="text-gray-700">
                Todos los derechos están reservados. En virtud de lo dispuesto en los artículos 8 y 32.1, párrafo 
                segundo, de la Ley de Propiedad Intelectual, quedan expresamente prohibidas la reproducción, la 
                distribución y la comunicación pública, incluida su modalidad de puesta a disposición, de la 
                totalidad o parte de los contenidos de esta página web, con fines comerciales, en cualquier soporte 
                y por cualquier medio técnico, sin la autorización de farmapro Formación S.L.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Responsabilidad</h2>
              <p className="text-gray-700 mb-4">
                farmapro Formación S.L. no será responsable de los daños y perjuicios que pudieran derivarse de:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>La falta de disponibilidad, mantenimiento y efectivo funcionamiento de la plataforma o de cualquiera de sus servicios o contenidos.</li>
                <li>La existencia de virus, programas maliciosos o lesivos en los contenidos.</li>
                <li>El uso ilícito, negligente, fraudulento, contrario a este aviso legal, a la buena fe y a los usos generalmente aceptados o al orden público.</li>
                <li>La falta de licitud, calidad, fiabilidad, utilidad y disponibilidad de los servicios prestados por terceros y puestos a disposición de los usuarios en el sitio web.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Modificaciones</h2>
              <p className="text-gray-700">
                farmapro Formación S.L. se reserva el derecho a efectuar sin previo aviso las modificaciones 
                que considere oportunas en su portal, pudiendo cambiar, suprimir o añadir tanto los contenidos 
                y servicios que se presten a través de la misma como la forma en la que éstos aparezcan 
                presentados o localizados en su portal.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Legislación aplicable y jurisdicción</h2>
              <p className="text-gray-700">
                La relación entre farmapro Formación S.L. y el usuario se regirá por la normativa española 
                vigente y cualquier controversia se someterá a los Juzgados y tribunales de la ciudad de Madrid.
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

export default AvisoLegal;
