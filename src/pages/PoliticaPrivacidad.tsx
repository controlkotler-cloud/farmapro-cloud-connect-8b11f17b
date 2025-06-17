
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PoliticaPrivacidad = () => {
  return (
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
              <p className="text-gray-700 leading-relaxed">
                farmapro es responsable del tratamiento de tus datos personales de acuerdo con el Reglamento 
                General de Protección de Datos (RGPD) y la Ley Orgánica de Protección de Datos Personales y 
                garantía de los derechos digitales (LOPDGDD).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Datos que recopilamos</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Datos de identificación: nombre, apellidos, email</li>
                <li>Datos profesionales: número de colegiado, especialidad, centro de trabajo</li>
                <li>Datos de navegación: información sobre tu uso de la plataforma</li>
                <li>Datos de progreso: cursos completados, puntuaciones, certificaciones</li>
                <li>Datos de comunicación: mensajes en foros, consultas de soporte</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Finalidades del tratamiento</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Proporcionar acceso y funcionalidad a la plataforma formativa</li>
                <li>Gestionar tu cuenta de usuario y perfil profesional</li>
                <li>Certificar la realización de cursos y actividades formativas</li>
                <li>Facilitar la comunicación en foros y comunidades profesionales</li>
                <li>Enviar comunicaciones sobre cursos, eventos y novedades</li>
                <li>Mejorar la experiencia de usuario y desarrollar nuevas funcionalidades</li>
                <li>Cumplir obligaciones legales aplicables al sector farmacéutico</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Base legal</h2>
              <p className="text-gray-700 mb-4">
                El tratamiento de tus datos se basa en:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Ejecución del contrato de servicios formativos</li>
                <li>Consentimiento para comunicaciones comerciales</li>
                <li>Interés legítimo para mejorar nuestros servicios</li>
                <li>Cumplimiento de obligaciones legales</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Conservación de datos</h2>
              <p className="text-gray-700">
                Conservamos tus datos personales durante el tiempo necesario para cumplir con las finalidades 
                para las que fueron recogidos y según los plazos legales aplicables. Los datos de certificaciones 
                se conservan según la normativa de formación continuada del sector farmacéutico.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Tus derechos</h2>
              <p className="text-gray-700 mb-4">
                Tienes derecho a:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Acceder a tus datos personales</li>
                <li>Rectificar datos inexactos o incompletos</li>
                <li>Suprimir tus datos cuando sea procedente</li>
                <li>Limitar el tratamiento en determinadas circunstancias</li>
                <li>Portabilidad de tus datos</li>
                <li>Oponerte al tratamiento por motivos legítimos</li>
                <li>Revocar el consentimiento en cualquier momento</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Contacto</h2>
              <p className="text-gray-700">
                Para ejercer tus derechos o resolver dudas sobre el tratamiento de datos, contacta con nosotros:
                <br />
                <span className="font-medium">Email:</span> privacidad@farmapro.com
                <br />
                <span className="font-medium">Delegado de Protección de Datos:</span> dpd@farmapro.com
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
  );
};

export default PoliticaPrivacidad;
