
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowRight, Clock } from 'lucide-react';

const Blog = () => {
  const featuredPost = {
    title: "El futuro de la farmacia digital: Tendencias 2024",
    excerpt: "Exploramos las principales tendencias tecnológicas que están transformando el sector farmacéutico y cómo adaptarse a ellas.",
    author: "Dr. María González",
    date: "15 de Enero, 2024",
    readTime: "8 min",
    category: "Tecnología",
    image: "/lovable-uploads/984857f8-bf1d-4c44-947b-487d144f6aae.png"
  };

  const recentPosts = [
    {
      title: "Nuevas regulaciones farmacéuticas: Lo que debes saber",
      excerpt: "Resumen de los cambios normativos más importantes que afectan a las farmacias en 2024.",
      author: "Lic. Carlos Ruiz",
      date: "12 de Enero, 2024",
      readTime: "5 min",
      category: "Regulación"
    },
    {
      title: "Gestión eficiente del stock en farmacia",
      excerpt: "Estrategias prácticas para optimizar el inventario y reducir pérdidas por caducidad.",
      author: "Ana Martínez",
      date: "10 de Enero, 2024",
      readTime: "6 min",
      category: "Gestión"
    },
    {
      title: "Atención farmacéutica personalizada: Casos de éxito",
      excerpt: "Ejemplos reales de cómo la personalización mejora la experiencia del paciente.",
      author: "Dr. Luis Fernández",
      date: "8 de Enero, 2024",
      readTime: "7 min",
      category: "Atención al Cliente"
    },
    {
      title: "Sostenibilidad en la farmacia: Iniciativas verdes",
      excerpt: "Cómo implementar prácticas sostenibles en tu farmacia sin comprometer la rentabilidad.",
      author: "Elena Vega",
      date: "5 de Enero, 2024",
      readTime: "4 min",
      category: "Sostenibilidad"
    }
  ];

  const categories = [
    "Tecnología",
    "Regulación", 
    "Gestión",
    "Atención al Cliente",
    "Sostenibilidad",
    "Formación",
    "Innovación"
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Blog farmapro
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Mantente al día con las últimas novedades, tendencias y mejores prácticas del sector farmacéutico
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Artículo Destacado</h2>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img 
                    src={featuredPost.image} 
                    alt={featuredPost.title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <Badge className="mb-4">{featuredPost.category}</Badge>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {featuredPost.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {featuredPost.date}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {featuredPost.readTime}
                      </div>
                    </div>
                  </div>
                  <Button>
                    Leer más
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Posts Grid */}
            <div className="lg:w-2/3">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Artículos Recientes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {recentPosts.map((post, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{post.category}</Badge>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {post.readTime}
                        </div>
                      </div>
                      <CardTitle className="text-lg hover:text-blue-600 cursor-pointer">
                        {post.title}
                      </CardTitle>
                      <CardDescription>
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {post.author}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {post.date}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-1/3">
              <div className="space-y-8">
                {/* Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle>Categorías</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categories.map((category, index) => (
                        <button
                          key={index}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Newsletter Signup */}
                <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                  <CardHeader>
                    <CardTitle>Suscríbete al Newsletter</CardTitle>
                    <CardDescription className="text-blue-100">
                      Recibe las últimas novedades directamente en tu email
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Tu email"
                        className="w-full px-3 py-2 rounded-md text-gray-900"
                      />
                      <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                        Suscribirse
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Quieres contribuir al blog?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Comparte tu experiencia y conocimientos con la comunidad farmacéutica
          </p>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
            Enviar Artículo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Blog;
