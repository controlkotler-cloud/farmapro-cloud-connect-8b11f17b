
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Calendar, Edit, Trash, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobListing {
  id: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  salary_range: string;
  is_active: boolean;
  created_at: string;
  expires_at: string;
}

const AdminEmpleo = () => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las ofertas de empleo",
        variant: "destructive",
      });
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('job_listings')
      .update({ is_active: !currentStatus })
      .eq('id', jobId);

    if (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la oferta",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: `Oferta ${!currentStatus ? 'activada' : 'desactivada'} correctamente`,
      });
      // Actualizar el trabajo específico en el estado
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId 
            ? { ...job, is_active: !currentStatus }
            : job
        )
      );
    }
  };

  const deleteJob = async (jobId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta oferta?')) {
      const { error } = await supabase
        .from('job_listings')
        .delete()
        .eq('id', jobId);

      if (error) {
        console.error('Error deleting job:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la oferta",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Oferta eliminada correctamente",
        });
        // Remover el trabajo del estado
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Ofertas de Empleo</h1>
          <p className="text-gray-600">Moderar y gestionar ofertas de trabajo</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Oferta
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
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
                    <Button size="sm" variant="outline" onClick={() => toggleJobStatus(job.id, job.is_active)}>
                      {job.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteJob(job.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {job.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Publicado: {new Date(job.created_at).toLocaleDateString()}
                  </div>
                  {job.salary_range && (
                    <div className="text-sm text-gray-600">
                      Salario: {job.salary_range}
                    </div>
                  )}
                </div>
                <p className="text-gray-700 mt-3 line-clamp-3">{job.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {jobs.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay ofertas de empleo aún</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminEmpleo;
