
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MapPin, Clock, DollarSign, Building2, Mail, Calendar, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
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
    setLoading(true);
    const { data, error } = await supabase
      .from('job_listings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading jobs:', error);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const createJob = async () => {
    if (!profile?.id || !newJob.title || !newJob.company_name) return;

    const { error } = await supabase
      .from('job_listings')
      .insert([{
        ...newJob,
        employer_id: profile.id,
        expires_at: newJob.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }]);

    if (error) {
      console.error('Error creating job:', error);
    } else {
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
      loadJobs();
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Publicar Nueva Oferta de Trabajo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Título del puesto"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  />
                  <Input
                    placeholder="Nombre de la empresa"
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
                  placeholder="Email de contacto"
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
                  placeholder="Descripción del puesto"
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
                <Button onClick={createJob} className="w-full">
                  Publicar Oferta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!canPostJobs() && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <p className="text-blue-800">
              <strong>¿Eres empleador?</strong> Actualiza a un plan premium para publicar ofertas de trabajo y conectar con profesionales farmacéuticos.
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
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>
                  </div>
                  <CardDescription>{job.description}</CardDescription>
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
                        <p className="text-sm text-gray-600">{job.requirements}</p>
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
                        onClick={() => window.location.href = `mailto:${job.contact_email}?subject=Interés en ${job.title}`}
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
