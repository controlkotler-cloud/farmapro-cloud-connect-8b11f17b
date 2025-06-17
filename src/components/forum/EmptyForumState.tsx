
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus } from 'lucide-react';

interface EmptyForumStateProps {
  onCreateThread: () => void;
}

export const EmptyForumState = ({ onCreateThread }: EmptyForumStateProps) => {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay hilos en esta categoría
        </h3>
        <p className="text-gray-600 mb-4">
          ¡Sé el primero en crear un hilo y empezar la conversación!
        </p>
        <Button onClick={onCreateThread}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Primer Hilo
        </Button>
      </CardContent>
    </Card>
  );
};
