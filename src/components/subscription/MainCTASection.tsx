
import { Button } from '@/components/ui/button';

export const MainCTASection = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-600 to-green-600 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Transforma tu Farmacia con Acceso Premium</h2>
        <p className="text-xl mb-8 leading-relaxed">
          El Portal farmapro es la inversión más rentable que puedes hacer en el desarrollo de tu farmacia y tu propia carrera profesional. Con acceso instantáneo a recursos exclusivos, formación especializada y una comunidad de profesionales innovadores, tendrás todas las herramientas necesarias para destacar en un sector cada vez más competitivo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="font-semibold mb-2">Acceso ilimitado</h3>
            <p className="text-sm opacity-90">A todo el contenido premium</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="font-semibold mb-2">Nuevos recursos</h3>
            <p className="text-sm opacity-90">Cada semana</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="font-semibold mb-2">Soporte especializado</h3>
            <p className="text-sm opacity-90">Cuando lo necesites</p>
          </div>
        </div>
        <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-semibold px-8 py-4 text-lg mb-4">
          COMENZAR MI PRUEBA GRATUITA DE 30 DÍAS
        </Button>
        <p className="text-sm opacity-90">Sin compromiso. Cancelación sencilla en cualquier momento. Sin preguntas.</p>
      </div>
    </section>
  );
};
