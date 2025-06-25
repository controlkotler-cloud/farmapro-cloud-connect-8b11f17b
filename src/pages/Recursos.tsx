
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Calculator, BookOpen, Lock, Star, File, Link, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ResourceType = Database['public']['Enums']['resource_type'];
type ResourceFormat = Database['public']['Enums']['resource_format'];
type ResourceCategory = Database['public']['Enums']['resource_category'];

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  format: ResourceFormat;
  category: ResourceCategory;
  file_url: string | null;
  download_count: number | null;
  is_premium: boolean | null;
  created_at: string;
}

const Recursos = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  const resourceTypes: Array<{ id: string; name: string; icon: typeof FileText }> = [
    { id: 'all', name: 'Todos', icon: FileText },
    { id: 'calculadora', name: 'Calculadoras', icon: Calculator },
    { id: 'plantilla', name: 'Plantillas', icon: FileText },
    { id: 'guia', name: 'Guías', icon: BookOpen },
    { id: 'protocolo', name: 'Protocolos', icon: FileText },
    { id: 'checklist', name: 'Checklists', icon: BookOpen },
    { id: 'manual', name: 'Manuales', icon: BookOpen },
    { id: 'herramienta', name: 'Herramientas', icon: Calculator },
  ];

  useEffect(() => {
    loadResources();
  }, [selectedType]);

  const loadResources = async () => {
    try {
      setLoading(true);
      console.log('Loading resources from database...');
      
      let query = supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (selectedType !== 'all') {
        query = query.eq('type', selectedType as ResourceType);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading resources:', error);
        toast({
          title: "Error",
          description: `Error al cargar recursos: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Resources loaded:', data?.length || 0);
      setResources(data || []);
    } catch (error: any) {
      console.error('Exception loading resources:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar recursos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadResource = async (resource: Resource) => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para descargar recursos",
        variant: "destructive"
      });
      return;
    }

    if (resource.is_premium && (!profile.subscription_role || profile.subscription_role === 'freemium')) {
      toast({
        title: "Recurso Premium",
        description: "Este recurso requiere una suscripción premium",
        variant: "destructive"
      });
      return;
    }

    try {
      // Record download
      const { error: downloadError } = await supabase
        .from('resource_downloads')
        .insert([{
          user_id: profile.id,
          resource_id: resource.id
        }]);

      if (downloadError) {
        console.error('Error recording download:', downloadError);
      }

      // Update download count
      const { error: updateError } = await supabase
        .from('resources')
        .update({ download_count: (resource.download_count || 0) + 1 })
        .eq('id', resource.id);

      if (updateError) {
        console.error('Error updating download count:', updateError);
      }

      // Add points for downloading
      try {
        const { error: pointsError } = await supabase.rpc('add_user_points', {
          user_id: profile.id,
          points: 25
        } as any);
        if (pointsError) {
          console.error('Error adding points:', pointsError);
        } else {
          toast({
            title: "¡Puntos ganados!",
            description: "Has ganado 25 puntos por descargar este recurso"
          });
        }
      } catch (error) {
        console.error('Error calling add_user_points:', error);
      }

      // Trigger download
      if (resource.file_url) {
        window.open(resource.file_url, '_blank');
        toast({
          title: "Descarga iniciada",
          description: "El recurso se está descargando"
        });
      } else {
        toast({
          title: "Error",
          description: "El archivo no está disponible",
          variant: "destructive"
        });
      }

      // Reload resources to update download count
      loadResources();
    } catch (error: any) {
      console.error('Error downloading resource:', error);
      toast({
        title: "Error",
        description: `No se pudo descargar el recurso: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  };

  const canAccessResource = (resource: Resource) => {
    if (!resource.is_premium) return true;
    return profile?.subscription_role && profile.subscription_role !== 'freemium';
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'xls':
        return <Calculator className="h-5 w-5 text-green-600" />;
      case 'docs':
        return <File className="h-5 w-5 text-blue-600" />;
      case 'url':
        return <Link className="h-5 w-5 text-purple-600" />;
      case 'video':
        return <Video className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      'atencion': 'Atención al Cliente',
      'marketing': 'Marketing',
      'gestion': 'Gestión',
      'liderazgo': 'Liderazgo',
      'finanzas': 'Finanzas',
      'digital': 'Digital'
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getTypeLabel = (type: string) => {
    const types = {
      'protocolo': 'Protocolo',
      'calculadora': 'Calculadora',
      'plantilla': 'Plantilla',
      'guia': 'Guía',
      'checklist': 'Checklist',
      'manual': 'Manual',
      'herramienta': 'Herramienta'
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recursos</h1>
        <p className="text-gray-600">Herramientas, plantillas y guías para optimizar tu trabajo diario</p>
      </div>

      <Tabs value={selectedType} onValueChange={handleTypeChange}>
        <TabsList className="grid w-full grid-cols-8">
          {resourceTypes.map((type) => (
            <TabsTrigger key={type.id} value={type.id} className="flex items-center space-x-2">
              <type.icon className="h-4 w-4" />
              <span>{type.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedType} className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recursos disponibles</h3>
              <p className="text-gray-500">
                {selectedType === 'all' 
                  ? 'Aún no se han publicado recursos.' 
                  : `No hay recursos del tipo "${resourceTypes.find(t => t.id === selectedType)?.name}" disponibles.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource, index) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {getFormatIcon(resource.format)}
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                            <div className="flex items-center flex-wrap gap-2 mt-2">
                              <Badge variant="outline">
                                {getCategoryLabel(resource.category)}
                              </Badge>
                              <Badge variant="secondary">
                                {getTypeLabel(resource.type)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {resource.format.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {resource.is_premium && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 ml-2">
                            <Star className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      {resource.description && (
                        <CardDescription className="line-clamp-3">
                          {resource.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Download className="h-4 w-4 mr-1" />
                          {resource.download_count || 0} descargas
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(resource.created_at).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => downloadResource(resource)}
                        disabled={!canAccessResource(resource)}
                      >
                        {!canAccessResource(resource) ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Requiere Premium
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Recursos;
