import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Download, FileText, Calculator, BookOpen, Link, Video, File, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type Resource = Database['public']['Tables']['resources']['Row'];
type ResourceInsert = Database['public']['Tables']['resources']['Insert'];
type ResourceCategory = Database['public']['Enums']['resource_category'];
type ResourceType = Database['public']['Enums']['resource_type'];
type ResourceFormat = Database['public']['Enums']['resource_format'];

const AdminRecursos = () => {
  const { isAdmin } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingResource, setGeneratingResource] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as ResourceCategory,
    type: '' as ResourceType,
    format: '' as ResourceFormat,
    file_url: '',
    is_premium: false
  });

  const categories = [
    { value: 'atencion' as ResourceCategory, label: 'Atención al Cliente' },
    { value: 'marketing' as ResourceCategory, label: 'Marketing' },
    { value: 'gestion' as ResourceCategory, label: 'Gestión' },
    { value: 'liderazgo' as ResourceCategory, label: 'Liderazgo' },
    { value: 'finanzas' as ResourceCategory, label: 'Finanzas' },
    { value: 'digital' as ResourceCategory, label: 'Digital' }
  ];

  const types = [
    { value: 'protocolo' as ResourceType, label: 'Protocolo' },
    { value: 'calculadora' as ResourceType, label: 'Calculadora' },
    { value: 'plantilla' as ResourceType, label: 'Plantilla' },
    { value: 'guia' as ResourceType, label: 'Guía' },
    { value: 'checklist' as ResourceType, label: 'Checklist' },
    { value: 'manual' as ResourceType, label: 'Manual' },
    { value: 'herramienta' as ResourceType, label: 'Herramienta' }
  ];

  const formats = [
    { value: 'pdf' as ResourceFormat, label: 'PDF' },
    { value: 'docs' as ResourceFormat, label: 'Word' },
    { value: 'xls' as ResourceFormat, label: 'Excel' },
    { value: 'url' as ResourceFormat, label: 'Enlace Web' },
    { value: 'video' as ResourceFormat, label: 'Video' }
  ];

  useEffect(() => {
    if (isAdmin) {
      loadResources();
    }
  }, [isAdmin]);

  const loadResources = async () => {
    try {
      setLoading(true);
      console.log('Loading resources...');
      
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

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
    } catch (error) {
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

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.category) {
      toast({
        title: "Error",
        description: "La categoría es obligatoria",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.type) {
      toast({
        title: "Error",
        description: "El tipo es obligatorio",
        variant: "destructive"
      });
      return false;
    }
    if (!formData.format) {
      toast({
        title: "Error",
        description: "El formato es obligatorio",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      console.log('Saving resource:', formData);

      const resourceData: ResourceInsert = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        type: formData.type,
        format: formData.format,
        file_url: formData.file_url.trim() || null,
        is_premium: formData.is_premium,
        download_count: 0
      };

      if (editingResource) {
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', editingResource.id);

        if (error) {
          console.error('Error updating resource:', error);
          throw error;
        }
        
        toast({
          title: "Éxito",
          description: "Recurso actualizado correctamente"
        });
      } else {
        const { error } = await supabase
          .from('resources')
          .insert([resourceData]);

        if (error) {
          console.error('Error creating resource:', error);
          throw error;
        }
        
        toast({
          title: "Éxito",
          description: "Recurso creado correctamente"
        });
      }

      resetForm();
      await loadResources();
    } catch (error: any) {
      console.error('Error saving resource:', error);
      toast({
        title: "Error",
        description: `No se pudo guardar el recurso: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '' as ResourceCategory,
      type: '' as ResourceType,
      format: '' as ResourceFormat,
      file_url: '',
      is_premium: false
    });
    setEditingResource(null);
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (resource: Resource) => {
    console.log('Editing resource:', resource.id);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      category: resource.category,
      type: resource.type,
      format: resource.format,
      file_url: resource.file_url || '',
      is_premium: resource.is_premium || false
    });
    setEditingResource(resource);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este recurso?')) return;

    try {
      console.log('Deleting resource:', resourceId);
      
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) {
        console.error('Error deleting resource:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Recurso eliminado correctamente"
      });
      await loadResources();
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: `No se pudo eliminar el recurso: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  };

  const handleGenerateResource = async () => {
    try {
      setGeneratingResource(true);
      console.log('Generando recurso con IA...');
      
      const { data, error } = await supabase.functions.invoke('generate-daily-resource', {
        body: {}
      });

      if (error) {
        console.error('Error generando recurso:', error);
        throw error;
      }

      if (data?.success) {
        toast({
          title: "¡Recurso generado!",
          description: `Se ha creado "${data.title}" en la categoría ${data.category}`,
        });
        await loadResources();
      } else {
        throw new Error(data?.error || 'Error desconocido al generar recurso');
      }
    } catch (error: any) {
      console.error('Error generating resource:', error);
      toast({
        title: "Error",
        description: `No se pudo generar el recurso: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setGeneratingResource(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'xls':
        return <Calculator className="h-4 w-4 text-green-600" />;
      case 'docs':
        return <File className="h-4 w-4 text-blue-600" />;
      case 'url':
        return <Link className="h-4 w-4 text-purple-600" />;
      case 'video':
        return <Video className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getTypeLabel = (type: string) => {
    const typeObj = types.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  const getFormatLabel = (format: string) => {
    const formatObj = formats.find(f => f.value === format);
    return formatObj ? formatObj.label : format.toUpperCase();
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Recursos</h1>
          <p className="text-gray-600">Crear y gestionar recursos descargables</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleGenerateResource}
            disabled={generatingResource}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 hover:from-purple-600 hover:to-indigo-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {generatingResource ? 'Generando...' : 'Generar con IA'}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Recurso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingResource ? 'Editar Recurso' : 'Crear Nuevo Recurso'}
              </DialogTitle>
              <DialogDescription>
                Completa la información del recurso
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Protocolo de atención al cliente"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe brevemente el recurso y su utilidad"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Categoría *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value as ResourceCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Tipo *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value as ResourceType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Formato *</Label>
                  <Select 
                    value={formData.format} 
                    onValueChange={(value) => setFormData({ ...formData, format: value as ResourceFormat })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="file_url">URL del archivo</Label>
                <Input
                  id="file_url"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://ejemplo.com/archivo.pdf"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="premium"
                  checked={formData.is_premium}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                />
                <Label htmlFor="premium">Recurso Premium</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : (editingResource ? 'Actualizar' : 'Crear')} Recurso
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos ({resources.length})</CardTitle>
          <CardDescription>
            Lista completa de recursos disponibles en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">Cargando recursos...</span>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hay recursos creados</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer recurso
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Descargas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {getFormatIcon(resource.format)}
                        <div>
                          <div className="font-medium">{resource.title}</div>
                          {resource.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {resource.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(resource.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getTypeLabel(resource.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">
                        {getFormatLabel(resource.format)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Download className="h-4 w-4 mr-1" />
                        {resource.download_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {resource.is_premium ? (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                          Premium
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Gratuito
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(resource.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEdit(resource)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDelete(resource.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRecursos;
