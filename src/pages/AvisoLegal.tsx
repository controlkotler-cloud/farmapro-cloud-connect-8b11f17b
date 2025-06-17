
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AvisoLegal = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-purple-800">
              Aviso Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-purple max-w-none space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-purple-700 mb-4">Información general</h2>
              <p className="text-gray-700 leading-relaxed">
                En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la 
                Sociedad de la Información y de Comercio Electrónico, se informa que farmapro es una 
                plataforma de formación continuada especializada en el sector farmacéutico.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-purple-700 mb-4">Datos identificativos</h2>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Denominación social:</strong> farmapro Formación S.L.<br />
                  <strong>CIF:</strong> B-12345678<br />
                  <strong>Domicilio:</strong> Calle de la Farmacia, 123, 28001 Madrid<br />
                  <strong>Email:</strong> info@farmapro.com<br />
                  <strong>Teléfono:</strong> +34 900 123 456
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-purple-700 mb-4">Objeto</h2>
              <p className="text-gray-700">
                farmapro tiene por objeto proporcionar servicios de formación continuada, recursos educativos 
                y herramientas de desarrollo profesional dirigidos a profesionales del sector farmacéutico, 
                incluyendo farmacéuticos, técnicos en farmacia y otros profesionales sanitarios relacionados.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-purple-700 mb-4">Condiciones de uso</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>El acceso y uso de farmapro implica la aceptación plena de estas condiciones</li>
                <li>Los usuarios deben ser profesionales colegiados o estudiantes del sector farmacéutico</li>
                <li>Está prohibido el uso fraudulento o que pueda dañar la imagen de farmapro</li>
                <li>Los contenidos son propiedad de farmapro y están protegidos por derechos de autor</li>
                <li>Está prohibida la reproducción, distribución o comunicación pública sin autorización</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-purple-700 mb-4">Responsabilidad</h2>
              <p className="text-gray-700 mb-4">
                farmapro se esfuerza por mantener la exactitud y actualidad de la información proporcionada, 
                pero no garantiza la ausencia de errores ni la idoneidad para fines específicos.
              </p>
              <p className="text-gray-700">
                Los usuarios son responsables del uso que hagan de la información y servicios disponibles 
                en la plataforma, así como de mantener la confidencialidad de sus credenciales de acceso.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-purple-700 mb-4">Propiedad intelectual</h2>
              <p className="text-gray-700">
                Todos los contenidos, diseños, textos, imágenes, vídeos, logotipos y demás elementos de 
                farmapro están protegidos por derechos de propiedad intelectual e industrial. Su uso no 
                autorizado constituye una infracción de la legislación vigente.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-purple-700 mb-4">Legislación aplicable</h2>
              <p className="text-gray-700">
                Las presentes condiciones se rigen por la legislación española. Para la resolución de 
                cualquier controversia, las partes se someten a los juzgados y tribunales de Madrid, 
                renunciando expresamente a cualquier otro fuero que pudiera corresponderles.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-purple-700 mb-4">Modificaciones</h2>
              <p className="text-gray-700">
                farmapro se reserva el derecho a modificar el presente aviso legal cuando lo estime oportuno, 
                sin previo aviso. Los usuarios deberán consultar periódicamente este documento para estar 
                al corriente de los cambios.
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AvisoLegal;
