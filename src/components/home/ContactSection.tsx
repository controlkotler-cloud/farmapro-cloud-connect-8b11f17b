
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const ContactSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ¿Hablamos sobre el futuro de tu farmacia?
          </h2>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <Input type="text" placeholder="Tu nombre completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <Input type="email" placeholder="Tu email profesional" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <Input type="tel" placeholder="Tu número de teléfono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interés principal</label>
                <select className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Servicios profesionales</option>
                  <option>Portal de suscripción</option>
                  <option>Newsletter gratuita</option>
                  <option>Consulta estratégica</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje breve</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  rows={4}
                  placeholder="Cuéntanos brevemente sobre tu farmacia y qué te interesa"
                ></textarea>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg py-3">
                ENVIAR
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
