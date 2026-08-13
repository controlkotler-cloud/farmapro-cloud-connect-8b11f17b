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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Ajusta título y placeholder del diálogo según la intención con la que se abrió (accesos rápidos del foro). */
  intent?: 'duda' | 'idea' | null;
}

const INTENT_COPY = {
  duda: { dialogTitle: 'Plantea tu duda', contentPlaceholder: 'Describe tu duda a la comunidad...' },
  idea: { dialogTitle: 'Comparte tu idea', contentPlaceholder: 'Cuenta qué te funciona en tu farmacia...' },
} as const;

export const NewThreadDialog = ({ categories, selectedCategory, showFullNameDefault, onCreateThread, open, onOpenChange, intent }: NewThreadDialogProps) => {
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [showFullName, setShowFullName] = useState(showFullNameDefault);
  const [internalShowDialog, setInternalShowDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Controlado desde fuera si se pasan open/onOpenChange (ej. abrir desde el estado vacío del foro); si no, se maneja solo.
  const showDialog = open ?? internalShowDialog;
  const setShowDialog = onOpenChange ?? setInternalShowDialog;

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
        <Button
          variant="brand"
          size="pill"
        >
          <Plus className="h-4 w-4" />
          Nuevo hilo
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{intent ? INTENT_COPY[intent].dialogTitle : 'Crear nuevo hilo'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Título del hilo"
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
          />
          <Textarea
            placeholder={
              intent
                ? INTENT_COPY[intent].contentPlaceholder
                : 'Contenido del hilo - Comparte tu consulta, experiencia o conocimiento...'
            }
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
            <span className="inline-flex rounded-full bg-terracota-soft px-2.5 py-0.5 text-xs font-bold text-terracota">
              +100 puntos por crear un hilo
            </span>
            <Button
              onClick={handleCreateThread}
              disabled={!newThreadTitle || !newThreadContent || isCreating}
            >
              {isCreating ? 'Creando...' : 'Crear hilo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
