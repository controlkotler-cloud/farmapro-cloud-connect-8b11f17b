
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmpleoActionsProps {
  canPostJobs: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  onCreateJob: () => void;
}

export const EmpleoActions = ({ canPostJobs, isPremium, isAdmin, onCreateJob }: EmpleoActionsProps) => {
  if (canPostJobs) {
    return (
      <Card className="bg-gradient-to-br from-salvia-soft to-card shadow-soft">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h3 className="mb-1 font-extrabold tracking-tight text-foreground">Publica tu oferta de empleo</h3>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Administra y publica ofertas de empleo en la plataforma"
                : "Encuentra a tu equipo farmacéutico ideal con tu plan premium"
              }
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateJob}
            className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <Plus className="h-4 w-4" />
            Publicar oferta
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-salvia-soft to-card shadow-soft">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h3 className="mb-1 font-extrabold tracking-tight text-foreground">¿Necesitas personal para tu farmacia?</h3>
          <p className="text-sm text-muted-foreground">
            Actualiza tu perfil al plan premium para publicar ofertas y encontrar a tu equipo
          </p>
        </div>
        <Link
          to="/precios"
          className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
        >
          Ver planes →
        </Link>
      </CardContent>
    </Card>
  );
};
