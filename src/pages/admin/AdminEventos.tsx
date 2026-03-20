
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
import { Calendar, MapPin, Plus, Edit, Trash, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  location: string;
  start_date: string;
  end_date: string;
  image_url: string;
  registration_url: string;
  is_featured: boolean;
  created_at: string;
}

const AdminEventos = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      event_type: '',
      location: '',
      start_date: '',
      end_date: '',
      image_url: '',
      registration_url: '',
      is_featured: false
    }
  });

  useEffect(() => {
    if (isAdmin) {
      loadEvents();
    }
  }, [isAdmin]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('Loading events from database...');
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Error",
          description: `Error al cargar eventos: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Events loaded:', data?.length || 0);
      setEvents(data || []);
    } catch (error: any) {
      console.error('Exception loading events:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar eventos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
    if (!form.getValues('description').trim()) {
      toast({
        title: "Error", 
        description: "La descripción es obligatoria",
        variant: "destructive"
      });
      return false;
    }
    if (!form.getValues('event_type').trim()) {
      toast({
        title: "Error",
        description: "El tipo de evento es obligatorio",
        variant: "destructive"
      });
      return false;
    }
    if (!form.getValues('start_date')) {
      toast({
        title: "Error",
        description: "La fecha de inicio es obligatoria",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const onSubmit = async (values: any) => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      console.log('Saving event:', values);

      const eventData = {
        title: values.title.trim(),
        description: values.description.trim(),
        event_type: values.event_type.trim(),
        location: values.location?.trim() || null,
        start_date: values.start_date,
        end_date: values.end_date || values.start_date,
        image_url: values.image_url?.trim() || null,
        registration_url: values.registration_url?.trim() || null,
        is_featured: values.is_featured || false
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);
        
        if (error) {
          console.error('Error updating event:', error);
          throw error;
        }

        toast({
          title: "Éxito",
          description: "Evento actualizado correctamente"
        });
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventData]);
        
        if (error) {
          console.error('Error creating event:', error);
          throw error;
        }

        toast({
          title: "Éxito", 
          description: "Evento creado correctamente"
        });
      }
      
      resetForm();
      await loadEvents();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: `No se pudo guardar el evento: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return;

    try {
      console.log('Deleting event:', eventId);
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting event:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Evento eliminado correctamente"
      });
      await loadEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: `No se pudo eliminar el evento: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (event: Event) => {
    console.log('Editing event:', event.id);
    setEditingEvent(event);
    form.reset({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      location: event.location || '',
      start_date: event.start_date?.slice(0, 16) || '',
      end_date: event.end_date?.slice(0, 16) || '',
      image_url: event.image_url || '',
      registration_url: event.registration_url || '',
      is_featured: event.is_featured
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    form.reset({
      title: '',
      description: '',
      event_type: '',
      location: '',
      start_date: '',
      end_date: '',
      image_url: '',
      registration_url: '',
      is_featured: false
    });
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Eventos</h1>
          <p className="text-gray-600">Crear y gestionar eventos y webinars</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
              </DialogTitle>
              <DialogDescription>
                Completa la información del evento
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Título del evento" {...field} />
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
                        <Textarea placeholder="Descripción del evento" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="event_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Evento *</FormLabel>
                        <FormControl>
                          <Input placeholder="Webinar, Conferencia, etc." {...field} />
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
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Online, Madrid, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Fin</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Imagen</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="registration_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Registro</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={form.watch('is_featured')}
                    onCheckedChange={(checked) => form.setValue('is_featured', checked)}
                  />
                  <Label htmlFor="featured">Evento Destacado</Label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Guardando...' : (editingEvent ? 'Actualizar' : 'Crear')} Evento
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Cargando eventos...</span>
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos creados</h3>
            <p className="text-gray-600 mb-4">Aún no se han creado eventos en el sistema.</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant={event.is_featured ? "default" : "secondary"}>
                    {event.event_type}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(event)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteEvent(event.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                <CardDescription className="line-clamp-3">{event.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(event.start_date).toLocaleDateString('es-ES')}
                  </div>
                  {event.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                  )}
                  {event.is_featured && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                      Destacado
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEventos;
