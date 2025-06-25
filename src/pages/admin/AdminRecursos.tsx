
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
import { Plus, Edit, Trash2, Download, FileText, Calculator, BookOpen, Link, Video, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Resource = Database['public']['Tables']['resources']['Row'];
type ResourceCategory = Database['public']['Enums']['resource_category'];
type ResourceType = Database['public']['Enums']['resource_type'];
type ResourceFormat = Database['public']['Enums']['resource_format'];

const AdminRecursos = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
    { value: 'atencion', label: 'Atención al Cliente' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'gestion', label: 'Gestión' },
    { value: 'liderazgo', label: 'Liderazgo' },
    { value: 'finanzas', label: 'Finanzas' },
    { value: 'digital', label: 'Digital' }
  ];

  const types = [
    { value: 'protocolo', label: 'Protocolo' },
    { value: 'calculadora', label: 'Calculadora' },
    { value: 'plantilla', label: 'Plantilla' },
    { value: 'guia', label: 'Guía' },
    { value: 'checklist', label: 'Checklist' },
    { value: 'manual', label: 'Manual' },
    { value: 'herramienta', label: 'Herramienta' }
  ];

  const formats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'docs', label: 'Word' },
    { value: 'xls', label: 'Excel' },
    { value: 'url', label: 'Enlace Web' },
    { value: 'video', label: 'Video' }
  ];

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      console.log('Cargando recursos...');
      
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading resources:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los recursos",
          variant: "destructive"
        });
      } else {
        console.log('Recursos cargados:', data?.length);
        setResources(data || []);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.type || !formData.format) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      console.log('Guardando recurso:', formData);

      if (editingResource) {
        const { error } = await supabase
          .from('resources')
          .update(formData)
          .eq('id', editingResource.id);

        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Recurso actualizado correctamente"
        });
      } else {
        const { error } = await supabase
          .from('resources')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Recurso creado correctamente"
        });
      }

      resetForm();
      loadResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el recurso",
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
    console.log('Editando recurso:', resource.id);
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
      console.log('Eliminando recurso:', resourceId);
      
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Recurso eliminado correctamente"
      });
      loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el recurso",
        variant: "destructive"
      });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Recursos</h1>
          <p className="text-gray-600">Crear y gestionar recursos descargables</p>
        </div>
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
