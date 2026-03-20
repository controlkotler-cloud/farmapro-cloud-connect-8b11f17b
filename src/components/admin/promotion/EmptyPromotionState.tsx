
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';
import { PromotionFormDialog } from './PromotionFormDialog';

interface EmptyPromotionStateProps {
  onPromotionUpdated: () => void;
}

export const EmptyPromotionState = ({ onPromotionUpdated }: EmptyPromotionStateProps) => {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones creadas</h3>
        <p className="text-gray-600 mb-4">Aún no se han creado promociones en el sistema.</p>
        <PromotionFormDialog 
          onPromotionUpdated={onPromotionUpdated} 
        />
      </CardContent>
    </Card>
  );
};
