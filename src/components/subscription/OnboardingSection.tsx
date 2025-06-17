
import { Button } from '@/components/ui/button';

export const OnboardingSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Comienza tu Viaje en el Portal farmapro</h2>
          <p className="text-lg text-gray-600">En solo 2 minutos estarás accediendo a recursos exclusivos que transformarán tu farmacia</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
            <h3 className="text-xl font-semibold mb-3">Regístrate y Explora</h3>
            <p className="text-gray-600">Crea tu cuenta, personaliza tu perfil y descubre todo el contenido disponible en el portal.</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
            <h3 className="text-xl font-semibold mb-3">Identifica tus Prioridades</h3>
            <p className="text-gray-600">Utiliza nuestro asistente de recomendación para encontrar el contenido más relevante para tus necesidades específicas.</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
            <h3 className="text-xl font-semibold mb-3">Implementa y Transforma</h3>
            <p className="text-gray-600">Descarga recursos, aplica los conocimientos adquiridos y comparte tus éxitos con la comunidad.</p>
          </div>
        </div>
        <div className="text-center mt-8">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
            COMENZAR AHORA
          </Button>
        </div>
      </div>
    </section>
  );
};
