
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  showFullNameDefault: boolean;
  onCreateThread: (title: string, content: string, showFullName: boolean) => Promise<void>;
}

export const NewThreadDialog = ({ categories, selectedCategory, showFullNameDefault, onCreateThread }: NewThreadDialogProps) => {
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [showFullName, setShowFullName] = useState(showFullNameDefault);
  const [showDialog, setShowDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateThread = async () => {
    if (!newThreadTitle || !newThreadContent) return;

    setIsCreating(true);
    try {
      await onCreateThread(newThreadTitle, newThreadContent, showFullName);
      setNewThreadTitle('');
      setNewThreadContent('');
      setShowDialog(false);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (showDialog) setShowFullName(showFullNameDefault);
  }, [showDialog, showFullNameDefault]);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
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
          <div className="flex items-center space-x-2">
            <Switch id="thread-show-full-name" checked={showFullName} onCheckedChange={setShowFullName} />
            <Label htmlFor="thread-show-full-name" className="text-sm text-muted-foreground cursor-pointer">
              {showFullName
                ? 'Publicar con mi nombre completo'
                : 'Publicar con iniciales (ej. E.M. Farmacia en tu ciudad)'}
            </Label>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-terracota">
              💰 +100 puntos por crear un hilo
            </div>
            <Button 
              onClick={handleCreateThread} 
              disabled={!newThreadTitle || !newThreadContent || isCreating}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isCreating ? 'Creando...' : 'Crear Hilo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
