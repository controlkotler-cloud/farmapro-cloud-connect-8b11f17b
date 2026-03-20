
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store, Plus } from 'lucide-react';

interface EmptyPharmacyStateProps {
  onCreateClick: () => void;
}

export const EmptyPharmacyState = ({ onCreateClick }: EmptyPharmacyStateProps) => {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay farmacias creadas</h3>
        <p className="text-gray-600 mb-4">Aún no se han creado farmacias en el sistema.</p>
        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Crear primera farmacia
        </Button>
      </CardContent>
    </Card>
  );
};
