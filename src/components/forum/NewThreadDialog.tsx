
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  is_premium: boolean;
}

interface NewThreadDialogProps {
  categories: ForumCategory[];
  selectedCategory: string;
  onCreateThread: (title: string, content: string) => Promise<void>;
}

export const NewThreadDialog = ({ categories, selectedCategory, onCreateThread }: NewThreadDialogProps) => {
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateThread = async () => {
    if (!newThreadTitle || !newThreadContent) return;
    
    setIsCreating(true);
    try {
      await onCreateThread(newThreadTitle, newThreadContent);
      setNewThreadTitle('');
      setNewThreadContent('');
      setShowDialog(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Hilo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>✍️ Crear Nuevo Hilo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Título del hilo"
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
          />
          <Textarea
            placeholder="Contenido del hilo - Comparte tu consulta, experiencia o conocimiento..."
            value={newThreadContent}
            onChange={(e) => setNewThreadContent(e.target.value)}
            rows={5}
          />
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              💰 +100 puntos por crear un hilo
            </div>
            <Button 
              onClick={handleCreateThread} 
              disabled={!newThreadTitle || !newThreadContent || isCreating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? 'Creando...' : 'Crear Hilo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
