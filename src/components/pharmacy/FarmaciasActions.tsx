
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FarmaciasActionsProps {
  canCreateListing: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  onCreateListing: () => void;
}

export const FarmaciasActions = ({ canCreateListing, isPremium, isAdmin, onCreateListing }: FarmaciasActionsProps) => {
  if (canCreateListing) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-emerald-800 font-semibold mb-1">Publica tu farmacia en venta</h3>
              <p className="text-emerald-700 text-sm">
                {isAdmin 
                  ? "Administra y publica farmacias en la plataforma"
                  : "Encuentra el comprador ideal para tu farmacia con tu plan premium"
                }
              </p>
            </div>
            <Button 
              onClick={onCreateListing}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Publicar Farmacia
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
            <h3 className="text-blue-800 font-semibold mb-1">¿Tienes una farmacia y quieres venderla?</h3>
            <p className="text-blue-700 text-sm">
              Actualiza al plan premium para poder subir todas las características y encontrar el comprador ideal
            </p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-lg">
            <Link to="/precios">
              Ver Planes
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
