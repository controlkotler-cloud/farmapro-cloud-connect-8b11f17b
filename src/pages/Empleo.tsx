import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MapPin, Euro, Building2, Mail, Calendar, Plus, Briefcase, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { EmpleoHeader } from '@/components/empleo/EmpleoHeader';
import { EmpleoActions } from '@/components/empleo/EmpleoActions';
import { JobFilters } from '@/components/empleo/JobFilters';
import { JobDetailDialog } from '@/components/empleo/JobDetailDialog';
import { JobApplicationDialog } from '@/components/empleo/JobApplicationDialog';
import { JobListing } from '@/types/job';

const Empleo = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [applicationDates, setApplicationDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [showJobDetailDialog, setShowJobDetailDialog] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [newJob, setNewJob] = useState({
    title: '',
    company_name: '',
    location: '',
    description: '',
    requirements: '',
    salary_range: '',
    contact_email: '',
    expires_at: '',
    job_type: 'otros',
    province: ''
  });

  useEffect(() => {
    loadJobs();
    if (profile?.id) {
      loadUserApplications();
    }
  }, [profile?.id]);

  useEffect(() => {
    loadJobs();
  }, [jobTypeFilter, provinceFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      console.log('Loading active job listings...');
      
      let query = supabase
        .from('job_listings_public')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (jobTypeFilter !== 'all') {
        query = query.eq('job_type', jobTypeFilter);
      }
      if (provinceFilter !== 'all') {
        query = query.eq('province', provinceFilter);
      }

      const { data, error } = await query;

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
      const jobsWithContactEmail = (data || []).map(job => ({
        ...job,
        contact_email: '', // Will be fetched separately when needed
        requirements: job.requirements || ''
      }));
      setJobs(jobsWithContactEmail);
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

  const loadUserApplications = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('job_id, applied_at')
        .eq('applicant_id', profile.id);

      if (error) {
        console.error('Error loading applications:', error);
        return;
      }

      const jobIds = (data || []).map(app => app.job_id);
      const dates = (data || []).reduce((acc, app) => {
        acc[app.job_id] = app.applied_at;
        return acc;
      }, {} as Record<string, string>);

      setApplications(jobIds);
      setApplicationDates(dates);
    } catch (error) {
      console.error('Exception loading applications:', error);
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
        expires_at: '',
        job_type: 'otros',
        province: ''
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
    return profile?.subscription_role === 'premium' || profile?.subscription_role === 'admin';
  };

  const isPremium = () => {
    return profile?.subscription_role === 'premium';
  };

  const isAdmin = () => {
    return profile?.subscription_role === 'admin';
  };

  const handleCreateJob = () => {
    setShowNewJobDialog(true);
  };

  const handleJobClick = (job: JobListing) => {
    setSelectedJob(job);
    setShowJobDetailDialog(true);
  };

  const handleContact = (job: JobListing) => {
    setSelectedJob(job);
    setShowApplicationDialog(true);
  };

  const handleApplicationSuccess = () => {
    loadUserApplications();
    loadJobs();
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <EmpleoHeader />

      <EmpleoActions 
        canPostJobs={canPostJobs()}
        isPremium={isPremium()}
        isAdmin={isAdmin()}
        onCreateJob={handleCreateJob}
      />

      <JobFilters
        jobType={jobTypeFilter}
        province={provinceFilter}
        onJobTypeChange={setJobTypeFilter}
        onProvinceChange={setProvinceFilter}
      />

      {/* Dialog para crear ofertas */}
      <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
        <DialogContent className="max-w-2xl md:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publicar Nueva Oferta de Trabajo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Ubicación"
                value={newJob.location}
                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
              />
              <Input
                placeholder="Provincia"
                value={newJob.province}
                onChange={(e) => setNewJob({ ...newJob, province: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Rango salarial"
                value={newJob.salary_range}
                onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
              />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newJob.job_type}
                onChange={(e) => setNewJob({ ...newJob, job_type: e.target.value })}
              >
                <option value="adjunto_farmaceutico">Adjunto/a Farmacéutico/a</option>
                <option value="tecnico">Técnico</option>
                <option value="auxiliar">Auxiliar</option>
                <option value="otros">Otros</option>
              </select>
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

      {/* Job Detail Dialog */}
      <JobDetailDialog
        job={selectedJob}
        isOpen={showJobDetailDialog}
        onClose={() => {
          setShowJobDetailDialog(false);
          setSelectedJob(null);
        }}
        onContact={() => {
          setShowJobDetailDialog(false);
          handleContact(selectedJob!);
        }}
        isExpired={selectedJob ? isJobExpired(selectedJob.expires_at) : false}
        hasApplied={selectedJob ? applications.includes(selectedJob.id) : false}
        applicationDate={selectedJob ? applicationDates[selectedJob.id] : undefined}
      />

      {/* Job Application Dialog */}
      <JobApplicationDialog
        job={selectedJob}
        isOpen={showApplicationDialog}
        onClose={() => {
          setShowApplicationDialog(false);
          setSelectedJob(null);
        }}
        onSuccess={handleApplicationSuccess}
      />

      {/* Lista de ofertas */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Ofertas de Empleo Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
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
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay ofertas disponibles</h3>
              <p className="text-gray-600">No hay ofertas de empleo activas en este momento.</p>
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
                  <Card 
                    className={`h-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                      isJobExpired(job.expires_at) ? 'opacity-60' : ''
                    }`}
                    onClick={() => handleJobClick(job)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          {applications.includes(job.id) && (
                            <Badge variant="secondary" className="text-xs">Contactado</Badge>
                          )}
                          {isJobExpired(job.expires_at) && (
                            <Badge variant="destructive">Expirada</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {job.company_name}
                        </div>
                        {(job.location || job.province) && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location || job.province}
                          </div>
                        )}
                      </div>
                      <CardDescription className="line-clamp-3 mt-2">{job.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {job.salary_range && (
                          <div className="flex items-center text-sm">
                            <Euro className="h-4 w-4 mr-2 text-green-600" />
                            <span className="font-medium">{job.salary_range}</span>
                          </div>
                        )}
                        
                        {applications.includes(job.id) && applicationDates[job.id] && (
                          <div className="text-xs text-green-600 font-medium">
                            Contactado el {formatDate(applicationDates[job.id])}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            Expira: {formatDate(job.expires_at)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJobClick(job);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver más
                            </Button>
                            {profile?.id && (
                              <Button 
                                size="sm" 
                                disabled={isJobExpired(job.expires_at) || applications.includes(job.id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContact(job);
                                }}
                                className="shadow-md"
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                {applications.includes(job.id) ? 'Contactado' : 'Contactar'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Empleo;
