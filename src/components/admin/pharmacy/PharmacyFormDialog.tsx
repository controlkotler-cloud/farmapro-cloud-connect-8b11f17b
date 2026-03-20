
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
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

interface PharmacyFormDialogProps {
  editingPharmacy: PharmacyListing | null;
  onPharmacyUpdated: () => void;
}

export const PharmacyFormDialog = ({ editingPharmacy, onPharmacyUpdated }: PharmacyFormDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      title: editingPharmacy?.title || '',
      location: editingPharmacy?.location || '',
      description: editingPharmacy?.description || '',
      price: editingPharmacy?.price?.toString() || '',
      surface_area: editingPharmacy?.surface_area?.toString() || '',
      annual_revenue: editingPharmacy?.annual_revenue?.toString() || '',
      contact_email: editingPharmacy?.contact_email || '',
      is_active: editingPharmacy?.is_active ?? true
    }
  });

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
        name: values.title.trim(),
        location: values.location.trim(),
        address: values.location.trim(),
        city: values.location.trim(),
        description: values.description.trim(),
        price: values.price ? parseFloat(values.price) : null,
        surface_area: values.surface_area ? parseInt(values.surface_area) : null,
        annual_revenue: values.annual_revenue ? parseFloat(values.annual_revenue) : null,
        contact_email: values.contact_email.trim(),
        is_active: values.is_active
      } as any;

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
      onPharmacyUpdated();
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
    setIsDialogOpen(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
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
  );
};
