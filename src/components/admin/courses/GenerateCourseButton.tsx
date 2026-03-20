import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const GenerateCourseButton = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('basico');
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      toast({
        title: "Generando formación...",
        description: "Esto puede tomar 1-2 minutos",
      });

      const { data, error } = await supabase.functions.invoke('generate-daily-course', {
        body: { 
          manual: true,
          level: selectedLevel,
          customTopic: customTopic.trim() || null
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "¡Formación generada exitosamente!",
          description: `Se ha creado: "${data.title}"`,
        });
        setIsDialogOpen(false);
        setCustomTopic('');
        setSelectedLevel('basico');
      } else {
        throw new Error(data?.error || 'Error generando la formación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error generando la formación',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Generar Formación con IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generar Formación con IA</DialogTitle>
          <DialogDescription>
            Especifica un tema personalizado o deja vacío para usar el sistema automático
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Tema personalizado (opcional)</Label>
            <Input
              id="topic"
              placeholder="Ej: Gestión del estrés en farmacia"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              Si está vacío, se usará el próximo tema del ciclo automático
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="level">Nivel del curso</Label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basico">Básico</SelectItem>
                <SelectItem value="intermedio">Intermedio</SelectItem>
                <SelectItem value="avanzado">Avanzado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
            disabled={isGenerating}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGenerating ? 'Generando...' : 'Generar Formación'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};