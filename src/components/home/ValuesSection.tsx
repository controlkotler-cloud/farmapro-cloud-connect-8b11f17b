
import { motion } from 'framer-motion';
import { Target, Award, Lightbulb, Users } from 'lucide-react';

const values = [
  {
    title: 'Enfoque 100% farmacéutico',
    description: 'No nos limitamos a adaptar soluciones genéricas. Todo lo que vas a encontrar en farmapro está pensado desde cero para el sector farmacéutico español, sus desafíos específicos y su realidad regulatoria.',
    icon: Target
  },
  {
    title: 'Experiencia demostrada',
    description: 'Tras 15 años acompañando, asesorando y ayudando a farmacias de toda España, entendemos profundamente cada aspecto de negocio, desde las preocupaciones de los titulares hasta las dinámicas del mostrador.',
    icon: Award
  },
  {
    title: 'Innovación práctica',
    description: 'Integramos las tendencias tecnológicas más avanzadas, pero siempre con un enfoque práctico: si no genera resultados tangibles para tu farmacia, no lo incorporamos.',
    icon: Lightbulb
  },
  {
    title: 'Comunidad activa',
    description: 'farmapro no es solo el ecosistema digital de referencia para farmacias en España. También es una comunidad vibrante donde titulares, adjuntos, auxiliares y estudiantes comparten experiencias, aprenden juntos y generan conexiones valiosas que trascienden mucho más allá de lo digital.',
    icon: Users
  }
];

export const ValuesSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ¿Por qué formar parte de farmapro?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-start space-x-4"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <value.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
