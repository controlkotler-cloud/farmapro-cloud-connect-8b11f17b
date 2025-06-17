
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, ArrowRight, BookOpen, TrendingUp, Users, Settings, FileText, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/home/Footer';

const categories = [
  {
    id: 'gestion-estrategica',
    name: 'Gestión Estratégica',
    icon: Settings,
    description: 'Estrategias para optimizar la gestión y rentabilidad de tu farmacia',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'marketing-farmaceutico',
    name: 'Marketing Farmacéutico',
    icon: TrendingUp,
    description: 'Técnicas de marketing adaptadas al sector farmacéutico',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'tendencias-emergentes',
    name: 'Tendencias Emergentes',
    icon: Lightbulb,
    description: 'Las últimas innovaciones y tendencias del sector',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'desarrollo-profesional',
    name: 'Desarrollo Profesional',
    icon: Users,
    description: 'Crecimiento personal y profesional para farmacéuticos',
    color: 'bg-orange-100 text-orange-800'
  },
  {
    id: 'normativa-regulacion',
    name: 'Normativa y Regulación',
    icon: FileText,
    description: 'Cambios regulatorios y su impacto en la farmacia',
    color: 'bg-red-100 text-red-800'
  },
  {
    id: 'casos-exito',
    name: 'Casos de Éxito',
    icon: BookOpen,
    description: 'Historias reales de transformación farmacéutica',
    color: 'bg-yellow-100 text-yellow-800'
  }
];

const featuredArticles = [
  {
    id: 1,
    title: 'La Transformación Digital de la Farmacia: Más Allá de la Receta Electrónica',
    excerpt: 'Cómo las farmacias líderes están aprovechando la tecnología para crear experiencias únicas de cliente y optimizar sus operaciones.',
    category: 'Tendencias Emergentes',
    date: '15 Dic 2024',
    author: 'Alejandro Tellería',
    readTime: '8 min',
    image: '/placeholder-blog-1.jpg'
  },
  {
    id: 2,
    title: 'Cross-selling Ético: Cómo Aumentar el Ticket Medio Sin Presionar al Cliente',
    excerpt: 'Estrategias probadas para incrementar las ventas de forma natural, priorizando siempre el bienestar del paciente.',
    category: 'Marketing Farmacéutico',
    date: '12 Dic 2024',
    author: 'Carmen Rodríguez',
    readTime: '6 min',
    image: '/placeholder-blog-2.jpg'
  },
  {
    id: 3,
    title: 'El Arte de la Distribución Estratégica: Maximiza tu Espacio de Venta',
    excerpt: 'Descubre cómo la disposición inteligente de productos puede aumentar significativamente tu rentabilidad por metro cuadrado.',
    category: 'Gestión Estratégica',
    date: '10 Dic 2024',
    author: 'Francesc Fernández',
    readTime: '10 min',
    image: '/placeholder-blog-3.jpg'
  }
];

const recentArticles = [
  {
    id: 4,
    title: 'Nuevas Competencias del Farmacéutico: Preparándose para el Futuro',
    excerpt: 'Las habilidades que todo farmacéutico necesitará desarrollar en los próximos años.',
    category: 'Desarrollo Profesional',
    date: '8 Dic 2024',
    author: 'Laura Martínez',
    readTime: '7 min'
  },
  {
    id: 5,
    title: 'Análisis de la Nueva Normativa de Servicios Profesionales Farmacéuticos',
    excerpt: 'Todo lo que necesitas saber sobre los cambios regulatorios recientes.',
    category: 'Normativa y Regulación',
    date: '5 Dic 2024',
    author: 'Dr. Rafael Gómez',
    readTime: '12 min'
  },
  {
    id: 6,
    title: 'Caso de Éxito: Cómo una Farmacia Rural Triplicó sus Ingresos',
    excerpt: 'La inspiradora historia de transformación de Farmacia Esperanza en Cuenca.',
    category: 'Casos de Éxito',
    date: '3 Dic 2024',
    author: 'Equipo farmapro',
    readTime: '9 min'
  }
];

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">
              Blog farmapro: Conocimiento a raudales para profesionales de farmacia
            </h1>
            <div className="prose prose-lg prose-white max-w-none">
              <p className="text-xl mb-6">
                En el vibrante y competitivo mundo de la farmacia, el conocimiento no es solo poder – es supervivencia y la verdadera oportunidad de destacar.
              </p>
              <p className="text-lg mb-6">
                Bienvenido al Blog farmapro, tu fuente definitiva de contenido especializado que va más allá de los titulares habituales. Aquí encontrarás análisis profundos, estrategias probadas y perspectivas innovadoras que están transformando farmacias reales en toda España.
              </p>
              <p className="text-lg mb-6">
                No se trata de un blog más sobre el sector farmacéutico. Nos diferenciamos por nuestro enfoque práctico y orientado a resultados. Cada artículo está meticulosamente elaborado por profesionales que combinan años de experiencia en farmacia con conocimiento experto en gestión, marketing y transformación digital.
              </p>
              <p className="text-lg mb-6">
                Detrás de cada publicación hay un compromiso: proporcionarte conocimiento accionable que puedas implementar en tu farmacia desde hoy mismo. Sin teorías abstractas ni generalidades – solo estrategias concretas que funcionan en el contexto específico del sector farmacéutico.
              </p>
              <p className="text-lg mb-6">
                Nuestras categorías abarcan desde gestión estratégica y marketing farmacéutico hasta tendencias emergentes y desarrollo profesional. Te mantenemos al día sobre cambios regulatorios, innovaciones tecnológicas y evoluciones del mercado que impactan directamente en tu día a día.
              </p>
              <p className="text-lg mb-8">
                Explora nuestros contenidos destacados, suscríbete para recibir las últimas publicaciones y únete a la conversación. El conocimiento compartido es el que realmente transforma – y aquí, en el Blog farmapro, construimos juntos el futuro de tu farmacia.
              </p>
              <p className="text-xl font-semibold mb-8">
                ¿Estás listo para llevar tu farmacia al siguiente nivel?
              </p>
            </div>
            <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-semibold px-8 py-3">
              EXPLORAR ARTÍCULOS
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Search and Categories */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-between mb-12">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar artículos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'todas' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('todas')}
                size="sm"
              >
                Todas
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  size="sm"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${category.color}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{category.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Artículos Destacados</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {featuredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-xl transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-lg flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-gray-500" />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{article.category}</Badge>
                    <span className="text-sm text-gray-500">{article.readTime}</span>
                  </div>
                  <CardTitle className="text-xl hover:text-blue-600 transition-colors cursor-pointer">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="text-base">{article.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    <span className="mr-4">{article.author}</span>
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{article.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Articles */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Últimas Publicaciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{article.category}</Badge>
                    <span className="text-sm text-gray-500">{article.readTime}</span>
                  </div>
                  <CardTitle className="text-lg hover:text-blue-600 transition-colors cursor-pointer">
                    {article.title}
                  </CardTitle>
                  <CardDescription>{article.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    <span className="mr-4">{article.author}</span>
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{article.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">¿No quieres perderte ningún artículo?</h2>
          <p className="text-xl mb-8">
            Suscríbete a farmapro IMPULSO y recibe quincenalmente los mejores contenidos directamente en tu bandeja de entrada.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Tu email profesional"
              className="bg-white text-gray-900"
            />
            <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold">
              Suscribirme
            </Button>
          </div>
          <p className="text-sm mt-4 opacity-90">
            Únete a +3.000 profesionales que ya reciben farmapro IMPULSO
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
