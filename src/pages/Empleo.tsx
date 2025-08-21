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
import { useToast } from '@/hooks/use-toast';
import { EmpleoHeader } from '@/components/empleo/EmpleoHeader';
import { EmpleoActions } from '@/components/empleo/EmpleoActions';
import { useJobConversations } from '@/hooks/useJobConversations';

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
  const { createConversation } = useJobConversations();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [contactMessage, setContactMessage] = useState('');
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
      
      // Always use the secure public table - both authenticated and unauthenticated users
      const { data, error } = await supabase
        .from('job_listings_public')
        .select('*')
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
      // Add empty contact_email for interface compatibility
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

  const handleContact = async (job: JobListing) => {
    // Check if user has premium access
    const hasPremiumAccess = profile?.subscription_role === 'premium' || 
                            profile?.subscription_role === 'profesional' || 
                            profile?.subscription_role === 'admin';

    if (hasPremiumAccess) {
      // Show dialog to start conversation
      setSelectedJob(job);
      setShowContactDialog(true);
    } else {
      // Use original email functionality
      try {
        const { data: contactEmail, error } = await supabase
          .rpc('get_job_contact_email_rpc', { job_id: job.id });
        
        if (error || !contactEmail) {
          toast({
            title: "Error",
            description: "No se pudo obtener la información de contacto",
            variant: "destructive"
          });
          return;
        }
        
        window.location.href = `mailto:${contactEmail}?subject=Interés en ${job.title}&body=Hola,%0D%0A%0D%0AEstoy interesado/a en la oferta de ${job.title} publicada en farmapro.%0D%0A%0D%0ASaludos cordiales.`;
      } catch (error) {
        console.error('Error getting contact email:', error);
        toast({
          title: "Error",
          description: "Error al obtener información de contacto",
          variant: "destructive"
        });
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedJob || !contactMessage.trim()) return;

    try {
      const conversationId = await createConversation(
        selectedJob.id,
        '', // employerId will be determined by the RPC function
        contactMessage
      );

      if (conversationId) {
        toast({
          title: "Éxito",
          description: "Mensaje enviado. Puedes ver la conversación en 'Conversaciones'",
        });
        setShowContactDialog(false);
        setContactMessage('');
        setSelectedJob(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    }
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

      {/* Dialog para crear ofertas */}
      <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
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

      {/* Dialog para iniciar conversación */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contactar para {selectedJob?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Envía un mensaje al empleador para iniciar una conversación en el portal.
            </p>
            <Textarea
              placeholder="Escribe tu mensaje de presentación..."
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowContactDialog(false);
                  setContactMessage('');
                  setSelectedJob(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!contactMessage.trim()}
                className="flex-1"
              >
                Enviar Mensaje
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <Card className={`h-full shadow-lg hover:shadow-xl transition-all duration-300 ${
                    isJobExpired(job.expires_at) ? 'opacity-60' : ''
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
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
                      <CardDescription className="line-clamp-3 mt-2">{job.description}</CardDescription>
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
                          {profile?.id ? (
                            <Button 
                              size="sm" 
                              disabled={isJobExpired(job.expires_at)}
                              onClick={() => handleContact(job)}
                              className="shadow-md"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Contactar
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toast({
                                title: "Inicia sesión",
                                description: "Debes iniciar sesión para ver la información de contacto",
                                variant: "default"
                              })}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Ver contacto
                            </Button>
                          )}
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
