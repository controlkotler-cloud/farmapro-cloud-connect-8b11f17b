
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">farmapro</span>: Impulsando el Futuro de la Farmacia
          </h1>
          <h2 className="text-2xl md:text-3xl text-gray-700 mb-6 font-medium">
            El Ecosistema digital que está revolucionando el sector farmacéutico
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Bienvenido a farmapro, el ecosistema digital dedicado a impulsar el potencial de las farmacias. 
            Conectamos servicios profesionales, conocimiento especializado, herramientas digitales y una comunidad vibrante para transformar tu realidad profesional. 
            Forma parte de un nuevo concepto en el sector farmacéutico diseñado para profesionales que entienden y son plenamente conscientes de sus desafíos diarios.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg px-8 py-3">
              DESCUBRE farmapro
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 flex items-center gap-2">
              <Play className="h-5 w-5" />
              VER VÍDEO
            </Button>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-medium">
              Acompañamos y guiamos a cientos de farmacias en toda España en su camino hacia la excelencia.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
