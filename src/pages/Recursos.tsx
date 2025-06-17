
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Calculator, BookOpen, Lock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type ResourceType = Database['public']['Enums']['resource_type'];
type ResourceFormat = Database['public']['Enums']['resource_format'];
type ResourceCategory = Database['public']['Enums']['resource_category'];

interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  format: ResourceFormat;
  category: ResourceCategory;
  file_url: string;
  download_count: number;
  is_premium: boolean;
  created_at: string;
}

const Recursos = () => {
  const { profile } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  const resourceTypes: Array<{ id: string; name: string; icon: typeof FileText }> = [
    { id: 'all', name: 'Todos', icon: FileText },
    { id: 'calculadora', name: 'Calculadoras', icon: Calculator },
    { id: 'plantilla', name: 'Plantillas', icon: FileText },
    { id: 'guia', name: 'Guías', icon: BookOpen },
    { id: 'protocolo', name: 'Protocolos', icon: FileText },
  ];

  useEffect(() => {
    loadResources();
  }, [selectedType]);

  const loadResources = async () => {
    setLoading(true);
    let query = supabase.from('resources').select('*').order('created_at', { ascending: false });
    
    if (selectedType !== 'all') {
      query = query.eq('type', selectedType as ResourceType);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading resources:', error);
    } else {
      setResources(data || []);
    }
    setLoading(false);
  };

  const downloadResource = async (resource: Resource) => {
    if (!profile?.id) return;
    if (resource.is_premium && (!profile.subscription_role || profile.subscription_role === 'freemium')) {
      return;
    }

    // Record download
    await supabase
      .from('resource_downloads')
      .insert([{
        user_id: profile.id,
        resource_id: resource.id
      }]);

    // Update download count
    await supabase
      .from('resources')
      .update({ download_count: resource.download_count + 1 })
      .eq('id', resource.id);

    // Add points for downloading
    await supabase.rpc('add_user_points', {
      user_id: profile.id,
      points: 25
    });

    // Trigger download
    if (resource.file_url) {
      window.open(resource.file_url, '_blank');
    }

    loadResources();
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
        return <FileText className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recursos Profesionales</h1>
        <p className="text-gray-600">Herramientas, plantillas y guías para optimizar tu trabajo diario</p>
      </div>

      <Tabs value={selectedType} onValueChange={handleTypeChange}>
        <TabsList className="grid w-full grid-cols-5">
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getFormatIcon(resource.format)}
                          <div>
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline">{resource.category}</Badge>
                              <Badge variant="secondary">{resource.format.toUpperCase()}</Badge>
                            </div>
                          </div>
                        </div>
                        {resource.is_premium && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                            <Star className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Download className="h-4 w-4 mr-1" />
                          {resource.download_count} descargas
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
