
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle } from 'lucide-react';

export const NewsletterSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-green-600">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-white mb-6">
            farmapro IMPULSO: Inspiración quincenal para tu farmacia
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            farmapro IMPULSO no es una newsletter más. Es una dosis concentrada de estrategia, inspiración y herramientas prácticas 
            que miles de profesionales farmacéuticos ya reciben cada quince días.
          </p>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Lo que encontrarás:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-100">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Estrategias innovadoras aplicables inmediatamente</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Análisis de tendencias y oportunidades del sector</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Casos de éxito inspiradores de farmacias reales</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Herramientas y recursos descargables de alto valor</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Input 
              type="email" 
              placeholder="Tu email profesional" 
              className="bg-white text-gray-900 flex-1 max-w-md"
            />
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              QUIERO RECIBIRLA
            </Button>
          </div>
          
          <p className="text-blue-200 text-sm">
            <strong>3.700+</strong> profesionales farmacéuticos ya la reciben y aplican sus consejos
          </p>
        </motion.div>
      </div>
    </section>
  );
};
