
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
import { Plus, Edit, Trash2, Download, FileText, Calculator, BookOpen } from 'lucide-react';
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
    setLoading(true);
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
      setResources(data || []);
    }
    setLoading(false);
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
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value as ResourceCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría" />
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
                  <Label htmlFor="type">Tipo *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value as ResourceType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
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
                  <Label htmlFor="format">Formato *</Label>
                  <Select 
                    value={formData.format} 
                    onValueChange={(value) => setFormData({ ...formData, format: value as ResourceFormat })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Formato" />
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

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingResource ? 'Actualizar' : 'Crear'} Recurso
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resources List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          resources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getFormatIcon(resource.format)}
                    <div>
                      <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{resource.category}</Badge>
                        <Badge variant="secondary">{resource.format.toUpperCase()}</Badge>
                        {resource.is_premium && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="line-clamp-3">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    {resource.download_count} descargas
                  </div>
                  <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(resource)}>
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminRecursos;
