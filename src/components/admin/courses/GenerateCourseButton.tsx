import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';

export const GenerateCourseButton = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      toast({
        title: "Generando formación...",
        description: "Esto puede tomar 1-2 minutos",
      });

      const { data, error } = await supabase.functions.invoke('generate-daily-course', {
        body: { manual: true }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "¡Formación generada exitosamente!",
          description: `Se ha creado: "${data.title}"`,
        });
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
      {isGenerating ? 'Generando...' : 'Generar Formación con IA'}
    </Button>
  );
};