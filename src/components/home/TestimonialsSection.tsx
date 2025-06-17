
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: "Formar parte de farmapro ha cambiado completamente nuestra visión. Hemos conseguido diferenciarnos en un área con mucha competencia y ahora nuestros clientes nos reconocen por nuestra personalidad única en digital y en la farmacia física.",
    author: "Rafael, Titular",
    location: "Farmacia en Getafe"
  },
  {
    quote: "Lo que más valoramos de formar parte de farmapro es que encuentro respuestas y soluciones para nuestros problemas y retos diarios. Para mí, farmapro se ha convertido en una extensión de nuestro equipo, aportando estrategias que realmente funcionan en nuestro contexto.",
    author: "Ramón, Titular",
    location: "Farmacia en Zaragoza"
  },
  {
    quote: "La newsletter farmapro IMPULSO es lectura obligada para todo el equipo. Cada vez que nos llega, encontramos ideas que podemos implementar inmediatamente y que realmente tienen un impacto real en ventas y por lo tanto en resultados.",
    author: "Ana, Farmacéutica adjunta",
    location: "Farmacia en Sevilla"
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Farmacias que están marcando la diferencia con farmapro
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current inline" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-4 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <cite className="font-semibold text-gray-900">{testimonial.author}</cite>
                    <p className="text-sm text-gray-600">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
