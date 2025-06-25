
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Store, MapPin, Euro, Edit, Trash, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PharmacyListing {
  id: string;
  title: string;
  location: string;
  description: string;
  price: number;
  surface_area: number;
  annual_revenue: number;
  is_active: boolean;
  contact_email: string;
  seller_id: string;
  created_at: string;
}

const AdminFarmacias = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [pharmacies, setPharmacies] = useState<PharmacyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<PharmacyListing | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      title: '',
      location: '',
      description: '',
      price: '',
      surface_area: '',
      annual_revenue: '',
      contact_email: '',
      is_active: true
    }
  });

  useEffect(() => {
    if (isAdmin) {
      loadPharmacies();
    }
  }, [isAdmin]);

  const loadPharmacies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pharmacy_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading pharmacies:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las farmacias",
        variant: "destructive",
      });
    } else {
      setPharmacies(data || []);
    }
    setLoading(false);
  };

  const validateForm = () => {
    if (!form.getValues('title').trim()) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        variant: "destructive"
      });
      return false;
    }
    if (!form.getValues('location').trim()) {
      toast({
        title: "Error", 
        description: "La ubicación es obligatoria",
        variant: "destructive"
      });
      return false;
    }
    if (!form.getValues('description').trim()) {
      toast({
        title: "Error",
        description: "La descripción es obligatoria",
        variant: "destructive"
      });
      return false;
    }
    if (!form.getValues('contact_email').trim()) {
      toast({
        title: "Error",
        description: "El email de contacto es obligatorio",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const onSubmit = async (values: any) => {
    if (!validateForm()) return;

    if (!user?.id) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para gestionar farmacias",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      console.log('Saving pharmacy listing:', values);

      const pharmacyData = {
        title: values.title.trim(),
        location: values.location.trim(),
        description: values.description.trim(),
        price: values.price ? parseFloat(values.price) : null,
        surface_area: values.surface_area ? parseInt(values.surface_area) : null,
        annual_revenue: values.annual_revenue ? parseFloat(values.annual_revenue) : null,
        contact_email: values.contact_email.trim(),
        is_active: values.is_active
      };

      if (editingPharmacy) {
        const { error } = await supabase
          .from('pharmacy_listings')
          .update(pharmacyData)
          .eq('id', editingPharmacy.id);
        
        if (error) {
          console.error('Error updating pharmacy listing:', error);
          throw error;
        }

        toast({
          title: "Éxito",
          description: "Farmacia actualizada correctamente"
        });
      } else {
        const { error } = await supabase
          .from('pharmacy_listings')
          .insert([{
            ...pharmacyData,
            seller_id: user.id
          }]);
        
        if (error) {
          console.error('Error creating pharmacy listing:', error);
          throw error;
        }

        toast({
          title: "Éxito", 
          description: "Farmacia creada correctamente"
        });
      }
      
      resetForm();
      await loadPharmacies();
    } catch (error: any) {
      console.error('Error saving pharmacy listing:', error);
      toast({
        title: "Error",
        description: `No se pudo guardar la farmacia: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const togglePharmacyStatus = async (pharmacyId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('pharmacy_listings')
      .update({ is_active: !currentStatus })
      .eq('id', pharmacyId);

    if (error) {
      console.error('Error updating pharmacy status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la farmacia",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: `Farmacia ${!currentStatus ? 'activada' : 'desactivada'} correctamente`,
      });
      setPharmacies(prevPharmacies => 
        prevPharmacies.map(pharmacy => 
          pharmacy.id === pharmacyId 
            ? { ...pharmacy, is_active: !currentStatus }
            : pharmacy
        )
      );
    }
  };

  const deletePharmacy = async (pharmacyId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta farmacia?')) {
      const { error } = await supabase
        .from('pharmacy_listings')
        .delete()
        .eq('id', pharmacyId);

      if (error) {
        console.error('Error deleting pharmacy:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la farmacia",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Farmacia eliminada correctamente",
        });
        setPharmacies(prevPharmacies => prevPharmacies.filter(pharmacy => pharmacy.id !== pharmacyId));
      }
    }
  };

  const openEditDialog = (pharmacy: PharmacyListing) => {
    console.log('Editing pharmacy listing:', pharmacy.id);
    setEditingPharmacy(pharmacy);
    form.reset({
      title: pharmacy.title,
      location: pharmacy.location,
      description: pharmacy.description,
      price: pharmacy.price?.toString() || '',
      surface_area: pharmacy.surface_area?.toString() || '',
      annual_revenue: pharmacy.annual_revenue?.toString() || '',
      contact_email: pharmacy.contact_email,
      is_active: pharmacy.is_active
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    form.reset({
      title: '',
      location: '',
      description: '',
      price: '',
      surface_area: '',
      annual_revenue: '',
      contact_email: '',
      is_active: true
    });
    setEditingPharmacy(null);
    setIsDialogOpen(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Farmacias</h1>
          <p className="text-gray-600">Gestionar directorio de farmacias en venta</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Farmacia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPharmacy ? 'Editar Farmacia' : 'Crear Nueva Farmacia'}
              </DialogTitle>
              <DialogDescription>
                Completa la información de la farmacia en venta
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Anuncio *</FormLabel>
                      <FormControl>
                        <Input placeholder="Farmacia en venta - Centro histórico..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación *</FormLabel>
                      <FormControl>
                        <Input placeholder="Madrid Centro, Barcelona Eixample..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio (€)</FormLabel>
                        <FormControl>
                          <Input placeholder="450000" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="surface_area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Superficie (m²)</FormLabel>
                        <FormControl>
                          <Input placeholder="120" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="annual_revenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facturación Anual (€)</FormLabel>
                        <FormControl>
                          <Input placeholder="380000" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Contacto *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contacto@farmacia.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe la farmacia, ubicación, características especiales..." 
                          rows={4} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={form.watch('is_active')}
                    onCheckedChange={(checked) => form.setValue('is_active', checked)}
                  />
                  <Label htmlFor="active">Farmacia Activa</Label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Guardando...' : (editingPharmacy ? 'Actualizar' : 'Crear')} Farmacia
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pharmacies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay farmacias creadas</h3>
            <p className="text-gray-600 mb-4">Aún no se han creado farmacias en el sistema.</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera farmacia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pharmacies.map((pharmacy) => (
            <Card key={pharmacy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Store className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{pharmacy.title}</CardTitle>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        {pharmacy.location}
                      </div>
                    </div>
                  </div>
                  <Badge variant={pharmacy.is_active ? "default" : "secondary"}>
                    {pharmacy.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pharmacy.price && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Precio</p>
                      <p className="text-lg font-semibold text-green-600">{formatPrice(pharmacy.price)}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {pharmacy.surface_area && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Superficie</p>
                        <p className="text-sm text-gray-600">{pharmacy.surface_area} m²</p>
                      </div>
                    )}
                    {pharmacy.annual_revenue && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Facturación</p>
                        <p className="text-sm text-gray-600">{formatPrice(pharmacy.annual_revenue)}/año</p>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{pharmacy.description}</p>
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => togglePharmacyStatus(pharmacy.id, pharmacy.is_active)}
                    >
                      {pharmacy.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(pharmacy)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deletePharmacy(pharmacy.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFarmacias;
