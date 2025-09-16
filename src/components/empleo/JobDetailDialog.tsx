import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Euro, Calendar, Briefcase, CheckCircle } from 'lucide-react';
import { JobListing } from '@/types/job';

interface JobDetailDialogProps {
  job: JobListing | null;
  isOpen: boolean;
  onClose: () => void;
  onContact: () => void;
  isExpired: boolean;
  hasApplied: boolean;
  applicationDate?: string;
}

const getJobTypeLabel = (jobType: string) => {
  const types = {
    'adjunto_farmaceutico': 'Adjunto/a Farmacéutico/a',
    'tecnico': 'Técnico',
    'auxiliar': 'Auxiliar',
    'otros': 'Otros'
  };
  return types[jobType as keyof typeof types] || 'No especificado';
};

export const JobDetailDialog = ({ 
  job, 
  isOpen, 
  onClose, 
  onContact, 
  isExpired, 
  hasApplied,
  applicationDate 
}: JobDetailDialogProps) => {
  if (!job) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl md:max-w-3xl max-w-[95vw] max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg md:text-xl lg:text-2xl font-bold text-foreground break-words">
                  {job.title}
                </DialogTitle>
              </div>
              <div className="flex flex-row gap-2 flex-shrink-0">
                {isExpired && <Badge variant="destructive">Expirada</Badge>}
                {hasApplied && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Contactado</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{job.company_name}</span>
              </div>
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              )}
              {job.province && job.province !== job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{job.province}</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6">
          {/* Job Type and Salary */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="font-medium text-sm md:text-base">Tipo de puesto:</span>
              <Badge variant="outline">{getJobTypeLabel(job.job_type || 'otros')}</Badge>
            </div>
            {job.salary_range && (
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="font-medium text-sm md:text-base">{job.salary_range}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Descripción del puesto</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Requisitos</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
              </div>
            </div>
          )}

          {/* Application Info */}
          {hasApplied && applicationDate && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Ya has contactado con esta oferta</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Fecha de contacto: {formatDate(applicationDate)}
              </p>
            </div>
          )}

          {/* Footer with expiration and contact button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">
                {isExpired ? 'Expiró el' : 'Expira el'}: {formatDate(job.expires_at)}
              </span>
            </div>
            
            <Button 
              onClick={onContact}
              disabled={isExpired || hasApplied}
              size="lg"
              className="w-full sm:w-auto sm:min-w-[140px]"
            >
              {hasApplied ? 'Ya contactado' : 'Contactar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};