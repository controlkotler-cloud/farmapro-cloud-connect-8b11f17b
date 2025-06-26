import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Search, Filter, File, Image, Video, Archive } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  file_url: string;
  format: string;
  category: string;
  download_count: number;
  created_at: string;
}

type CategoryType = 'gestion' | 'marketing' | 'liderazgo' | 'atencion' | 'finanzas' | 'digital';
type SelectedCategoryType = 'all' | CategoryType;

const Recursos = () => {
  const { profile } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategoryType>('all');
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
      query = query.eq('category', selectedCategory as CategoryType);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading resources:', error);
    } else {
      const transformedResources: Resource[] = (data || []).map(resource => ({
        id: resource.id,
        title: resource.title,
        description: resource.description || '',
        file_url: resource.file_url || '',
        format: resource.format,
        category: resource.category,
        download_count: resource.download_count,
        created_at: resource.created_at
      }));
      setResources(transformedResources);
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
        .update({ download_count: resource.download_count + 1 })
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

  const getFileIcon = (format: string) => {
    if (format === 'pdf') return FileText;
    if (format === 'video') return Video;
    if (format === 'xls') return Archive;
    if (format === 'docs') return File;
    return File;
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories: SelectedCategoryType[] = ['all', 'gestion', 'marketing', 'liderazgo', 'atencion', 'finanzas', 'digital'];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-50 rounded-full p-3 mr-3">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Recursos Farmacéuticos
            </h1>
          </div>
          
          <p className="text-gray-600 mb-4 max-w-2xl mx-auto text-sm">
            Accede a protocolos, guías clínicas y recursos especializados para tu práctica profesional
          </p>

          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-xs">
            <Download className="h-3 w-3 mr-1" />
            {stats.downloads} Descargas Realizadas
          </Badge>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              Recursos Disponibles
            </h3>
            <div className="p-2 rounded-lg bg-blue-50">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 mb-1">
            {stats.totalResources}
          </div>
          <p className="text-xs text-gray-500">Documentos y archivos</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              Total Descargas
            </h3>
            <div className="p-2 rounded-lg bg-green-50">
              <Download className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 mb-1">
            {stats.downloads}
          </div>
          <p className="text-xs text-gray-500">Por todos los usuarios</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              Categorías
            </h3>
            <div className="p-2 rounded-lg bg-purple-50">
              <Filter className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 mb-1">
            {stats.categories}
          </div>
          <p className="text-xs text-gray-500">Tipos de recursos</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              Biblioteca de Recursos
            </h2>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar recursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 h-9"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full h-8 text-xs"
              >
                {category === 'all' ? 'Todos' : category.charAt(0).toUpperCase() + category.slice(1)}
                {selectedCategory === category && (
                  <Badge variant="secondary" className="ml-2 px-1 text-xs h-4">
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
                <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource) => {
                const FileIcon = getFileIcon(resource.format);
                return (
                  <div key={resource.id} className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-200">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate text-sm">{resource.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{resource.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs h-5">
                          {resource.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {resource.download_count} descargas
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(resource)}
                        className="bg-blue-600 hover:bg-blue-700 h-8"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredResources.length === 0 && !loading && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron recursos</h3>
              <p className="text-gray-500 text-sm">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recursos;
