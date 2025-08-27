import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { JobListing } from '@/types/job';

interface JobApplicationDialogProps {
  job: JobListing | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JobApplicationDialog = ({ job, isOpen, onClose, onSuccess }: JobApplicationDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "Solo se permiten archivos PDF",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error", 
          description: "El archivo no puede superar los 5MB",
          variant: "destructive"
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const uploadResume = async (file: File): Promise<string | null> => {
    try {
      const fileName = `${profile?.id}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('job-resumes')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading resume:', uploadError);
        return null;
      }

      return fileName;
    } catch (error) {
      console.error('Exception uploading resume:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!job || !profile?.id) return;

    if (!summary.trim()) {
      toast({
        title: "Error",
        description: "El resumen es obligatorio",
        variant: "destructive"
      });
      return;
    }

    if (!consentGiven) {
      toast({
        title: "Error",
        description: "Debes aceptar compartir tu información",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);

      let resumeUrl = null;
      if (resumeFile) {
        resumeUrl = await uploadResume(resumeFile);
        if (!resumeUrl) {
          toast({
            title: "Error",
            description: "No se pudo subir el currículum",
            variant: "destructive"
          });
          return;
        }
      }

      const { data, error } = await supabase
        .rpc('submit_job_application', {
          job_id_param: job.id,
          summary_param: summary.trim(),
          resume_url_param: resumeUrl
        });

      if (error) {
        console.error('Error submitting application:', error);
        toast({
          title: "Error",
          description: error.message || "No se pudo enviar la solicitud",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Éxito",
        description: "Tu solicitud ha sido enviada correctamente"
      });

      // Reset form
      setSummary('');
      setResumeFile(null);
      setConsentGiven(false);
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Exception submitting application:', error);
      toast({
        title: "Error",
        description: "Error inesperado al enviar la solicitud",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setSummary('');
      setResumeFile(null);
      setConsentGiven(false);
      onClose();
    }
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contactar para {job.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Empresa:</strong> {job.company_name}<br />
              <strong>Ubicación:</strong> {job.location || job.province || 'No especificada'}
            </p>
          </div>

          <div>
            <Label htmlFor="summary" className="text-base font-medium">
              Resumen personal *
            </Label>
            <Textarea
              id="summary"
              placeholder="Cuéntanos sobre ti, tu experiencia y por qué te interesa este puesto..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {summary.length}/500 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="resume" className="text-base font-medium">
              Currículum (PDF, opcional)
            </Label>
            <div className="mt-2">
              <Input
                id="resume"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="resume"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              >
                <div className="text-center">
                  {resumeFile ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{resumeFile.name}</p>
                        <p className="text-sm text-green-600">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Haz clic para subir tu currículum</p>
                      <p className="text-sm text-gray-500">PDF, máximo 5MB</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="consent" className="text-sm font-medium cursor-pointer">
                  Acepto compartir mi información personal y currículum con la empresa que ha publicado esta oferta de empleo
                </Label>
                <div className="flex items-start gap-2 mt-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800">
                    Esta información se guardará en tu perfil para futuras consultas. 
                    Sin tu consentimiento no podremos procesar tu solicitud.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !consentGiven || !summary.trim()}
              className="flex-1"
            >
              {submitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};