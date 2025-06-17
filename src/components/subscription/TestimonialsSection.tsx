
import { Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const testimonials = [
  {
    name: 'Antonio García',
    role: 'Titular de Farmacia en Barcelona',
    quote: 'Los recursos del Portal farmapro nos han permitido implementar un sistema de categorías que ha incrementado nuestras ventas de dermocosmética un 34% en solo dos meses. La inversión se recupera con creces.'
  },
  {
    name: 'Lucía Fernández',
    role: 'Farmacéutica Adjunta en Madrid',
    quote: 'Como adjunta, valoro especialmente la formación continua y la comunidad. He conectado con otros profesionales que comparten mis inquietudes y juntos hemos implementado mejoras que están transformando nuestra farmacia.'
  },
  {
    name: 'Carlos Martínez',
    role: 'Responsable de Marketing en Farmacia de Sevilla',
    quote: 'El generador de contenidos con IA nos ahorra horas cada semana y ha mejorado notablemente nuestra presencia en redes sociales. Nuestros seguidores han aumentado un 67% y lo mejor es que se traduce en visitas reales a la farmacia.'
  },
  {
    name: 'Paula Sánchez',
    role: 'Estudiante de último año de Farmacia',
    quote: 'Como estudiante, el plan especial me permite acceder a recursos que complementan perfectamente mi formación académica. La comunidad me ha ayudado incluso a encontrar prácticas y orientar mi futuro profesional.'
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">La Comunidad farmapro Habla</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-base italic">"{testimonial.quote}"</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{testimonial.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Badge variant="secondary" className="text-sm px-4 py-2">
            Se unen 47 nuevos miembros cada semana - 1,234 recursos descargados este mes
          </Badge>
        </div>
      </div>
    </section>
  );
};
