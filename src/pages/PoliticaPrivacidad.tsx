import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copyright } from 'lucide-react';

const PoliticaPrivacidad = () => {
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
              Política de Privacidad
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-green max-w-none space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Responsable del tratamiento</h2>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Denominación social:</strong> farmapro Formación S.L.<br />
                  <strong>CIF:</strong> B-12345678<br />
                  <strong>Domicilio:</strong> Calle de la Farmacia, 123, 28001 Madrid<br />
                  <strong>Email:</strong> privacidad@farmapro.com<br />
                  <strong>Teléfono:</strong> +34 900 123 456
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">¿Qué datos recopilamos?</h2>
              
              <h3 className="text-xl font-medium text-green-600 mb-2">Datos de registro</h3>
              <p className="text-gray-700 mb-4">
                Nombre, apellidos, email, número de colegiado, especialidad farmacéutica y datos de contacto 
                necesarios para verificar tu condición de profesional farmacéutico.
              </p>

              <h3 className="text-xl font-medium text-green-600 mb-2">Datos de navegación</h3>
              <p className="text-gray-700 mb-4">
                Información sobre tu actividad en farmapro: cursos realizados, tiempo de estudio, 
                resultados de evaluaciones, participación en la comunidad y preferencias de uso.
              </p>

              <h3 className="text-xl font-medium text-green-600 mb-2">Datos de facturación</h3>
              <p className="text-gray-700 mb-4">
                Información necesaria para procesar pagos: datos bancarios (procesados por Stripe), 
                dirección de facturación y historial de transacciones.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">¿Para qué utilizamos tus datos?</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Proporcionar acceso a la plataforma de formación continuada</li>
                <li>Verificar tu condición de profesional farmacéutico colegiado</li>
                <li>Personalizar tu experiencia de aprendizaje</li>
                <li>Generar certificados de formación válidos</li>
                <li>Procesar pagos y gestionar suscripciones</li>
                <li>Enviar comunicaciones relacionadas con tu formación</li>
                <li>Mejorar nuestros servicios mediante análisis de uso</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Base legal del tratamiento</h2>
              <p className="text-gray-700">
                El tratamiento de tus datos se basa en la ejecución del contrato de prestación de servicios 
                formativos, el cumplimiento de obligaciones legales en materia de formación continuada 
                farmacéutica, y tu consentimiento para comunicaciones promocionales y análisis de mejora.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">¿Con quién compartimos tus datos?</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Colegios Farmacéuticos:</strong> Para verificación de colegiación y reporte de formación continuada</li>
                <li><strong>Proveedores de pago:</strong> Stripe para procesar transacciones de manera segura</li>
                <li><strong>Proveedores tecnológicos:</strong> Supabase para hosting y gestión de datos</li>
                <li><strong>Autoridades competentes:</strong> Cuando sea requerido por ley</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Tus derechos</h2>
              <p className="text-gray-700 mb-4">
                Como usuario de farmapro, tienes derecho a:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Acceder a tus datos personales</li>
                <li>Rectificar datos inexactos o incompletos</li>
                <li>Suprimir tus datos (derecho al olvido)</li>
                <li>Limitar el tratamiento de tus datos</li>
                <li>Portabilidad de tus datos</li>
                <li>Oponerte al tratamiento para fines de marketing</li>
                <li>Retirar tu consentimiento en cualquier momento</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Para ejercer estos derechos, contacta con nosotros en: <strong>privacidad@farmapro.com</strong>
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Retención de datos</h2>
              <p className="text-gray-700">
                Conservamos tus datos durante el tiempo necesario para cumplir con las finalidades descritas 
                y las obligaciones legales. Los datos de formación se conservan según la normativa de 
                formación continuada farmacéutica.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Seguridad</h2>
              <p className="text-gray-700">
                Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos contra 
                el acceso no autorizado, alteración, divulgación o destrucción.
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

export default PoliticaPrivacidad;
