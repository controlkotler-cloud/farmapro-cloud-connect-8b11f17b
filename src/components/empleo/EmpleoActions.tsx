
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
          <Button
            variant="brand"
            size="pill"
            onClick={onCreateJob}
          >
            <Plus className="h-4 w-4" />
            Publicar oferta
          </Button>
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
        <Button asChild variant="brand" size="pill">
          <Link to="/precios">
            Ver planes →
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
