
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const PoliticaPrivacidad = () => {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4">
        <div className="max-w-4xl mx-auto py-8">
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
      </div>
    </DashboardLayout>
  );
};

export default PoliticaPrivacidad;
