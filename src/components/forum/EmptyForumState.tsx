import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus } from 'lucide-react';

interface EmptyForumStateProps {
  onCreateThread: () => void;
}

export const EmptyForumState = ({ onCreateThread }: EmptyForumStateProps) => {
  return (
    <Card className="text-center">
      <CardContent className="py-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracota-soft">
          <MessageSquare className="h-7 w-7 text-terracota" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">
          Todavía no hay hilos aquí
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Estrena esta categoría: cuenta cómo va tu farmacia esta semana.
        </p>
        <Button
          onClick={onCreateThread}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
        >
          <Plus className="h-4 w-4" />
          Crear el primer hilo
        </Button>
      </CardContent>
    </Card>
  );
};
