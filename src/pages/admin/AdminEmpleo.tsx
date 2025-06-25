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
import { Briefcase, MapPin, Calendar, Edit, Trash, Plus, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface JobListing {
  id: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  requirements: string;
  salary_range: string;
  contact_email: string;
  expires_at: string;
  is_active: boolean;
  employer_id: string;
  created_at: string;
  updated_at: string;
}

const AdminEmpleo = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      title: '',
      company_name: '',
      location: '',
      description: '',
      requirements: '',
      salary_range: '',
      contact_email: '',
      expires_at: '',
      is_active: true
    }
  });

  useEffect(() => {
    if (isAdmin) {
      loadJobs();
    }
  }, [isAdmin]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      console.log('Loading job listings from database...');
      
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading job listings:', error);
        toast({
          title: "Error",
          description: `Error al cargar ofertas de empleo: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Job listings loaded:', data?.length || 0);
      setJobs(data || []);
    } catch (error: any) {
      console.error('Exception loading job listings:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar ofertas de empleo",
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
    if (!form.getValues('company_name').trim()) {
      toast({
        title: "Error", 
        description: "El nombre de la empresa es obligatorio",
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
        description: "Debes estar autenticado para crear ofertas",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      console.log('Saving job listing:', values);

      const jobData = {
        title: values.title.trim(),
        company_name: values.company_name.trim(),
        location: values.location?.trim() || '',
        description: values.description.trim(),
        requirements: values.requirements?.trim() || '',
        salary_range: values.salary_range?.trim() || '',
        contact_email: values.contact_email.trim(),
        expires_at: values.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: values.is_active
      };

      if (editingJob) {
        const { error } = await supabase
          .from('job_listings')
          .update(jobData)
          .eq('id', editingJob.id);
        
        if (error) {
          console.error('Error updating job listing:', error);
          throw error;
        }

        toast({
          title: "Éxito",
          description: "Oferta de empleo actualizada correctamente"
        });
      } else {
        const { error } = await supabase
          .from('job_listings')
          .insert([{
            ...jobData,
            employer_id: user.id // Usar el ID real del usuario autenticado
          }]);
        
        if (error) {
          console.error('Error creating job listing:', error);
          throw error;
        }

        toast({
          title: "Éxito", 
          description: "Oferta de empleo creada correctamente"
        });
      }
      
      resetForm();
      await loadJobs();
    } catch (error: any) {
      console.error('Error saving job listing:', error);
      toast({
        title: "Error",
        description: `No se pudo guardar la oferta: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta oferta?')) return;

    try {
      console.log('Deleting job listing:', jobId);
      
      const { error } = await supabase
        .from('job_listings')
        .delete()
        .eq('id', jobId);

      if (error) {
        console.error('Error deleting job listing:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Oferta eliminada correctamente"
      });
      await loadJobs();
    } catch (error: any) {
      console.error('Error deleting job listing:', error);
      toast({
        title: "Error",
        description: `No se pudo eliminar la oferta: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      console.log('Toggling job status:', jobId, !currentStatus);
      
      const { error } = await supabase
        .from('job_listings')
        .update({ is_active: !currentStatus })
        .eq('id', jobId);

      if (error) {
        console.error('Error updating job status:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: `Oferta ${!currentStatus ? 'activada' : 'desactivada'} correctamente`
      });
      await loadJobs();
    } catch (error: any) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (job: JobListing) => {
    console.log('Editing job listing:', job.id);
    setEditingJob(job);
    form.reset({
      title: job.title,
      company_name: job.company_name,
      location: job.location || '',
      description: job.description,
      requirements: job.requirements || '',
      salary_range: job.salary_range || '',
      contact_email: job.contact_email,
      expires_at: job.expires_at?.slice(0, 10) || '',
      is_active: job.is_active
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    form.reset({
      title: '',
      company_name: '',
      location: '',
      description: '',
      requirements: '',
      salary_range: '',
      contact_email: '',
      expires_at: '',
      is_active: true
    });
    setEditingJob(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Ofertas de Empleo</h1>
          <p className="text-gray-600">Crear y gestionar ofertas de trabajo</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Oferta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingJob ? 'Editar Oferta' : 'Crear Nueva Oferta'}
              </DialogTitle>
              <DialogDescription>
                Completa la información de la oferta de empleo
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Puesto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Farmacéutico/a, Técnico en Farmacia..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Empresa *</FormLabel>
                      <FormControl>
                        <Input placeholder="Farmacia XYZ, Laboratorios ABC..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Madrid, Barcelona, Valencia..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salary_range"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rango Salarial</FormLabel>
                        <FormControl>
                          <Input placeholder="25.000€ - 35.000€ anuales" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de Contacto *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="rrhh@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expires_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Expiración</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Puesto *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe las responsabilidades y tareas del puesto..." 
                          rows={4} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requisitos</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Experiencia requerida, formación, competencias..." 
                          rows={3} 
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
                  <Label htmlFor="active">Oferta Activa</Label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Guardando...' : (editingJob ? 'Actualizar' : 'Crear')} Oferta
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Cargando ofertas...</span>
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay ofertas creadas</h3>
            <p className="text-gray-600 mb-4">Aún no se han creado ofertas de empleo en el sistema.</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera oferta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <CardDescription>{job.company_name}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={job.is_active ? "default" : "secondary"}>
                      {job.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => toggleJobStatus(job.id, job.is_active)}
                    >
                      {job.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(job)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteJob(job.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {job.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {job.location}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Creada: {new Date(job.created_at).toLocaleDateString('es-ES')}
                  </div>
                  {job.salary_range && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {job.salary_range}
                    </div>
                  )}
                </div>
                <p className="text-gray-700 line-clamp-2">{job.description}</p>
                {job.expires_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Expira: {new Date(job.expires_at).toLocaleDateString('es-ES')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEmpleo;
