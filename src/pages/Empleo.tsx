
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MapPin, Clock, DollarSign, Building2, Mail, Calendar, Plus, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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
  created_at: string;
}

const Empleo = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company_name: '',
    location: '',
    description: '',
    requirements: '',
    salary_range: '',
    contact_email: '',
    expires_at: ''
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      console.log('Loading active job listings...');
      
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading job listings:', error);
        toast({
          title: "Error",
          description: "Error al cargar ofertas de empleo",
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
        description: "Error inesperado al cargar ofertas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createJob = async () => {
    if (!profile?.id || !newJob.title || !newJob.company_name || !newJob.description || !newJob.contact_email) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      console.log('Creating job listing:', newJob.title);

      const { error } = await supabase
        .from('job_listings')
        .insert([{
          ...newJob,
          employer_id: profile.id,
          expires_at: newJob.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }]);

      if (error) {
        console.error('Error creating job listing:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Oferta de empleo publicada correctamente"
      });

      setNewJob({
        title: '',
        company_name: '',
        location: '',
        description: '',
        requirements: '',
        salary_range: '',
        contact_email: '',
        expires_at: ''
      });
      setShowNewJobDialog(false);
      await loadJobs();
    } catch (error: any) {
      console.error('Error creating job listing:', error);
      toast({
        title: "Error",
        description: `No se pudo crear la oferta: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const isJobExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const canPostJobs = () => {
    return profile?.subscription_role && profile.subscription_role !== 'freemium';
  };

  const isPremium = () => {
    return profile?.subscription_role === 'premium';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bolsa de Empleo</h1>
          <p className="text-gray-600">Encuentra oportunidades laborales en el sector farmacéutico</p>
        </div>
        {canPostJobs() && (
          <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Publicar Oferta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Publicar Nueva Oferta de Trabajo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Título del puesto *"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  />
                  <Input
                    placeholder="Nombre de la empresa *"
                    value={newJob.company_name}
                    onChange={(e) => setNewJob({ ...newJob, company_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Ubicación"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  />
                  <Input
                    placeholder="Rango salarial"
                    value={newJob.salary_range}
                    onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Email de contacto *"
                  type="email"
                  value={newJob.contact_email}
                  onChange={(e) => setNewJob({ ...newJob, contact_email: e.target.value })}
                />
                <Input
                  placeholder="Fecha de expiración"
                  type="date"
                  value={newJob.expires_at}
                  onChange={(e) => setNewJob({ ...newJob, expires_at: e.target.value })}
                />
                <Textarea
                  placeholder="Descripción del puesto *"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  rows={4}
                />
                <Textarea
                  placeholder="Requisitos"
                  value={newJob.requirements}
                  onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                  rows={3}
                />
                <Button onClick={createJob} className="w-full" disabled={submitting}>
                  {submitting ? 'Publicando...' : 'Publicar Oferta'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isPremium() && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-green-800">
                <strong>Publica tu oferta de empleo</strong> con el botón "+" para encontrar a tu equipo farmacéutico ideal.
              </p>
              <Button 
                onClick={() => setShowNewJobDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Oferta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!canPostJobs() && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <p className="text-blue-800">
              <strong>¿Eres titular de una farmacia y necesitas personal?</strong> Actualiza tu perfil al plan premium para publicar ofertas y encontrar a tu equipo.{' '}
              <Link 
                to="/subscription?tab=plans" 
                className="underline hover:text-blue-900 font-medium"
              >
                Ver planes
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      ) : jobs.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay ofertas disponibles</h3>
            <p className="text-gray-600">No hay ofertas de empleo activas en este momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`h-full ${isJobExpired(job.expires_at) ? 'opacity-60' : 'hover:shadow-lg'} transition-shadow`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    {isJobExpired(job.expires_at) && (
                      <Badge variant="destructive">Expirada</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      {job.company_name}
                    </div>
                    {job.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </div>
                    )}
                  </div>
                  <CardDescription className="line-clamp-3">{job.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {job.salary_range && (
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                        <span className="font-medium">{job.salary_range}</span>
                      </div>
                    )}
                    
                    {job.requirements && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Requisitos:</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{job.requirements}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        Expira: {formatDate(job.expires_at)}
                      </div>
                      <Button 
                        size="sm" 
                        disabled={isJobExpired(job.expires_at)}
                        onClick={() => window.location.href = `mailto:${job.contact_email}?subject=Interés en ${job.title}&body=Hola,%0D%0A%0D%0AEstoy interesado/a en la oferta de ${job.title} publicada en farmapro.%0D%0A%0D%0ASaludos cordiales.`}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Contactar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Empleo;
