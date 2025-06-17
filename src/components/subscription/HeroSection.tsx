
import { Button } from '@/components/ui/button';

export const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">
            Portal farmapro: Recursos Exclusivos para la gestión eficaz de tu farmacia
          </h1>
          <h2 className="text-2xl mb-6 opacity-90">
            Accede al Conocimiento, Herramientas y Recursos que Están Transformando las Farmacias Líderes en España
          </h2>
          <p className="text-xl mb-8 leading-relaxed">
            Bienvenido al Portal farmapro, el espacio digital exclusivo donde los profesionales farmacéuticos más ambiciosos encuentran todo lo necesario para llevar su práctica al siguiente nivel. Aquí convergen formación avanzada, herramientas especializadas y contenidos premium que no encontrarás en ningún otro lugar.
          </p>
          <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-semibold px-8 py-4 text-lg mb-8">
            COMENZAR MI PRUEBA GRATUITA
          </Button>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <p className="text-lg italic mb-2">
              "El Portal farmapro ha transformado completamente nuestra forma de trabajar. El acceso a recursos de esta calidad desde cualquier dispositivo nos ha dado una ventaja competitiva que se refleja directamente en nuestros resultados."
            </p>
            <p className="font-semibold">Josep Daries - Titular de Farmacia en Valencia</p>
          </div>
        </div>
      </div>
    </section>
  );
};
