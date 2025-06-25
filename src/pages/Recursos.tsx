
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Search, Filter, File, Image, Video, Archive } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  category: string;
  downloads_count: number;
  created_at: string;
}

const Recursos = () => {
  const { profile } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({
    totalResources: 0,
    downloads: 0,
    categories: 0
  });

  useEffect(() => {
    loadResources();
    loadStats();
  }, [selectedCategory]);

  const loadResources = async () => {
    setLoading(true);
    let query = supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading resources:', error);
    } else {
      setResources(data || []);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const { count: totalResources } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true });

    // Count unique categories
    const { data: categoriesData } = await supabase
      .from('resources')
      .select('category');

    const uniqueCategories = new Set(categoriesData?.map(r => r.category) || []).size;

    setStats({
      totalResources: totalResources || 0,
      downloads: 1250, // This would come from actual download tracking
      categories: uniqueCategories
    });
  };

  const handleDownload = async (resource: Resource) => {
    // Track download
    try {
      await supabase
        .from('resources')
        .update({ downloads_count: resource.downloads_count + 1 })
        .eq('id', resource.id);

      // Add points to user
      if (profile?.id) {
        await supabase.rpc('add_user_points', {
          user_id: profile.id,
          points: 10
        } as any);
      }

      // Open download link
      window.open(resource.file_url, '_blank');
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('image')) return Image;
    if (fileType.includes('video')) return Video;
    if (fileType.includes('zip') || fileType.includes('rar')) return Archive;
    return File;
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ['all', 'Protocolos', 'Guías Clínicas', 'Formularios', 'Presentaciones'];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-gray-100 rounded-lg p-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-purple-100 rounded-full p-3 mr-3">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Recursos Farmacéuticos
            </h1>
          </div>
          
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Accede a protocolos, guías clínicas y recursos especializados para tu práctica profesional
          </p>

          <Badge variant="secondary" className="bg-purple-100 text-purple-800 px-3 py-1">
            <Download className="h-3 w-3 mr-1" />
            {stats.downloads} Descargas Realizadas
          </Badge>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                Recursos Disponibles
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.totalResources}
            </div>
            <p className="text-sm text-gray-500">Documentos y archivos</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Descargas
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-50">
                <Download className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.downloads}
            </div>
            <p className="text-sm text-gray-500">Por todos los usuarios</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                Categorías
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50">
                <Filter className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.categories}
            </div>
            <p className="text-sm text-gray-500">Tipos de recursos</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 text-purple-600 mr-3" />
              Biblioteca de Recursos
            </CardTitle>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar recursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category === 'all' ? 'Todos' : category}
                {selectedCategory === category && (
                  <Badge variant="secondary" className="ml-2 px-1 text-xs">
                    {category === 'all' ? resources.length : resources.filter(r => r.category === category).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Resources Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource) => {
                const FileIcon = getFileIcon(resource.file_type);
                return (
                  <Card key={resource.id} className="border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <FileIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{resource.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{resource.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {resource.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {resource.downloads_count} descargas
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(resource)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredResources.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron recursos</h3>
              <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Recursos;
