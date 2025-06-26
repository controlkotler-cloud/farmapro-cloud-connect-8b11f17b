
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search, FileText, BookOpen, Trophy, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  format: string;
  is_premium: boolean;
  created_at: string;
}

export const Recursos = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadResources();
  }, [selectedCategory]);

  const loadResources = async () => {
    setLoading(true);
    let query = supabase.from('resources').select('*').order('created_at', { ascending: false });
    
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading resources:', error);
    } else {
      // Transformar los datos para que coincidan con la interface
      const transformedData = data?.map(resource => ({
        ...resource,
        format: resource.format || 'pdf' // Valor por defecto si no existe
      })) || [];
      setResources(transformedData);
    }
    setLoading(false);
  };

  const handleDownload = async (resource: Resource) => {
    if (resource.is_premium && (!profile?.subscription_role || profile.subscription_role === 'freemium')) {
      toast({
        title: "Recurso Premium",
        description: "Necesitas una suscripción premium para descargar este recurso.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (profile?.id) {
        await supabase.rpc('add_user_points', {
          user_id: profile.id,
          points: 25
        });
      }
    } catch (error) {
      console.error('Error adding points:', error);
    }

    window.open(resource.file_url, '_blank');
    
    toast({
      title: "Descarga iniciada",
      description: `Has ganado 25 puntos por descargar ${resource.title}`,
    });
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    { value: 'all', label: 'Todos', icon: FileText, color: 'from-gray-500 to-gray-600' },
    { value: 'templates', label: 'Plantillas', icon: FileText, color: 'from-blue-500 to-blue-600' },
    { value: 'guides', label: 'Guías', icon: BookOpen, color: 'from-green-500 to-green-600' },
    { value: 'tools', label: 'Herramientas', icon: Trophy, color: 'from-purple-500 to-purple-600' },
    { value: 'checklists', label: 'Checklists', icon: Target, color: 'from-orange-500 to-orange-600' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with gradient background */}
      <motion.div 
        className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-8 shadow-lg ring-1 ring-purple-200"
        variants={itemVariants}
      >
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-purple-400 to-purple-600 rounded-r-full shadow-lg"></div>
          <div className="ml-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recursos Descargables</h1>
            <p className="text-gray-600">Descarga plantillas, guías y herramientas para impulsar tu farmacia</p>
          </div>
        </div>
      </motion.div>

      {/* Search and filters */}
      <motion.div 
        className="flex flex-col lg:flex-row gap-4"
        variants={itemVariants}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Category tabs with sidebar styling */}
      <motion.div 
        className="flex flex-wrap gap-2"
        variants={itemVariants}
      >
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.value)}
            className={`relative group transition-all duration-300 transform hover:scale-105 ${
              selectedCategory === category.value
                ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                : 'hover:shadow-md'
            }`}
          >
            <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} shadow-lg mr-2 transition-transform group-hover:scale-110`}>
              <category.icon className="h-4 w-4 text-white" />
            </div>
            {category.label}
          </Button>
        ))}
      </motion.div>

      {/* Resources grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {filteredResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              variants={itemVariants}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="h-full"
            >
              <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2 flex-1">{resource.title}</CardTitle>
                    {resource.is_premium && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-xs ml-2">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-3">{resource.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {resource.file_type.toUpperCase()}
                    </Badge>
                    <Button
                      onClick={() => handleDownload(resource)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {filteredResources.length === 0 && !loading && (
        <motion.div 
          className="text-center py-12"
          variants={itemVariants}
        >
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron recursos</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay recursos disponibles en esta categoría'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
