import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Calendar, User, Mail, Briefcase, Building2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JobApplication } from '@/types/job';

interface JobWithApplications {
  id: string;
  title: string;
  company_name: string;
  location: string;
  province: string;
  job_type: string;
  applications: JobApplication[];
}

export const JobApplicationsView = () => {
  const { toast } = useToast();
  const [jobsWithApplications, setJobsWithApplications] = useState<JobWithApplications[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobsWithApplications();
  }, []);

  const loadJobsWithApplications = async () => {
    try {
      setLoading(true);

      // Get all jobs created by the current user (employer)
      const { data: jobs, error: jobsError } = await supabase
        .from('job_listings')
        .select(`
          id,
          title,
          company_name,
          location,
          province,
          job_type
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Error loading jobs:', jobsError);
        return;
      }

      if (!jobs || jobs.length === 0) {
        setJobsWithApplications([]);
        return;
      }

      // Get applications for these jobs
      const jobIds = jobs.map(job => job.id);
      const { data: applications, error: applicationsError } = await supabase
        .from('job_applications')
        .select('*')
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false });

      if (applicationsError) {
        console.error('Error loading applications:', applicationsError);
        return;
      }

      // Group applications by job
      const jobsWithApps = jobs.map(job => ({
        ...job,
        applications: (applications || []).filter(app => app.job_id === job.id)
      })).filter(job => job.applications.length > 0);

      setJobsWithApplications(jobsWithApps);
    } catch (error) {
      console.error('Exception loading jobs with applications:', error);
      toast({
        title: "Error",
        description: "Error al cargar las solicitudes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadResume = async (resumeUrl: string, applicantName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('job-resumes')
        .download(resumeUrl);

      if (error) {
        console.error('Error downloading resume:', error);
        toast({
          title: "Error",
          description: "No se pudo descargar el currículum",
          variant: "destructive"
        });
        return;
      }

      // Create download link
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CV_${applicantName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Éxito",
        description: "Currículum descargado correctamente"
      });
    } catch (error) {
      console.error('Exception downloading resume:', error);
      toast({
        title: "Error",
        description: "Error inesperado al descargar el currículum",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getJobTypeLabel = (jobType: string) => {
    const types = {
      'adjunto_farmaceutico': 'Adjunto/a Farmacéutico/a',
      'tecnico': 'Técnico',
      'auxiliar': 'Auxiliar',
      'otros': 'Otros'
    };
    return types[jobType as keyof typeof types] || 'No especificado';
  };

  const handleViewApplication = (application: JobApplication, jobTitle: string) => {
    setSelectedApplication(application);
    setSelectedJobTitle(jobTitle);
    setShowDetailDialog(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (jobsWithApplications.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay solicitudes</h3>
        <p className="text-gray-600">
          Aún no has recibido solicitudes para tus ofertas de empleo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {jobsWithApplications.map((job) => (
        <Card key={job.id} className="shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl font-bold">{job.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{job.company_name}</span>
                  </div>
                  {(job.location || job.province) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location || job.province}</span>
                    </div>
                  )}
                  <Badge variant="outline">
                    {getJobTypeLabel(job.job_type || 'otros')}
                  </Badge>
                </CardDescription>
              </div>
              <Badge className="text-sm">
                {job.applications.length} solicitud{job.applications.length !== 1 ? 'es' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {job.applications.map((application, index) => (
                <div key={application.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{application.applicant_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">{application.applicant_email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Aplicó el {formatDate(application.applied_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {application.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {application.resume_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadResume(application.resume_url!, application.applicant_name)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          CV
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleViewApplication(application, job.title)}
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Application Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solicitud para {selectedJobTitle}</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nombre completo</label>
                  <p className="font-medium">{selectedApplication.applicant_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="font-medium">{selectedApplication.applicant_email}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Fecha de solicitud</label>
                  <p className="font-medium">{formatDate(selectedApplication.applied_at)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">Resumen personal</label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedApplication.summary}</p>
                </div>
              </div>

              {selectedApplication.resume_url && (
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="font-medium">Currículum Vitae</p>
                      <p className="text-sm text-gray-600">CV_{selectedApplication.applicant_name.replace(/\s+/g, '_')}.pdf</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => downloadResume(selectedApplication.resume_url!, selectedApplication.applicant_name)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar CV
                  </Button>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailDialog(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};