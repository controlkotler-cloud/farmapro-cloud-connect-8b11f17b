
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
      <Card className="border-green-200 bg-green-50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-green-800 font-semibold mb-1">Publica tu oferta de empleo</h3>
              <p className="text-green-700 text-sm">
                {isAdmin 
                  ? "Administra y publica ofertas de empleo en la plataforma"
                  : "Encuentra a tu equipo farmacéutico ideal con tu plan premium"
                }
              </p>
            </div>
            <Button 
              onClick={onCreateJob}
              className="bg-green-600 hover:bg-green-700 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Publicar Oferta
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-blue-800 font-semibold mb-1">¿Necesitas personal para tu farmacia?</h3>
            <p className="text-blue-700 text-sm">
              Actualiza tu perfil al plan premium para publicar ofertas y encontrar a tu equipo
            </p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-lg">
            <Link to="/subscription?tab=plans">
              Ver Planes
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
