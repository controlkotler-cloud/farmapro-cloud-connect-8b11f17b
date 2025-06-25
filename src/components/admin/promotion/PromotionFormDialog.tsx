
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Promotion {
  id: string;
  title: string;
  company_name: string;
  company_type: string;
  description: string;
  discount_details: string;
  is_active: boolean;
  valid_until: string | null;
  terms_conditions: string | null;
  image_url: string | null;
  created_at: string;
}

interface PromotionFormDialogProps {
  editingPromotion?: Promotion | null;
  onPromotionUpdated: () => void;
}

export const PromotionFormDialog = ({ editingPromotion, onPromotionUpdated }: PromotionFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    company_type: '',
    description: '',
    discount_details: '',
    is_active: true,
    valid_until: '',
    terms_conditions: '',
    image_url: ''
  });

  useEffect(() => {
    if (editingPromotion) {
      setFormData({
        title: editingPromotion.title,
        company_name: editingPromotion.company_name,
        company_type: editingPromotion.company_type,
        description: editingPromotion.description,
        discount_details: editingPromotion.discount_details || '',
        is_active: editingPromotion.is_active,
        valid_until: editingPromotion.valid_until ? editingPromotion.valid_until.split('T')[0] : '',
        terms_conditions: editingPromotion.terms_conditions || '',
        image_url: editingPromotion.image_url || ''
      });
      setOpen(true);
    }
  }, [editingPromotion]);

  const resetForm = () => {
    setFormData({
      title: '',
      company_name: '',
      company_type: '',
      description: '',
      discount_details: '',
      is_active: true,
      valid_until: '',
      terms_conditions: '',
      image_url: ''
    });
  };

  const isValidUrl = (string: string) => {
    if (!string.trim()) return true; // Empty URL is valid
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate image URL only if it's not empty
    if (formData.image_url.trim() && !isValidUrl(formData.image_url)) {
      toast({
        title: "Error",
        description: "La URL de la imagen no es válida",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const promotionData = {
        title: formData.title.trim(),
        company_name: formData.company_name.trim(),
        company_type: formData.company_type.trim(),
        description: formData.description.trim(),
        discount_details: formData.discount_details.trim() || null,
        is_active: formData.is_active,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        terms_conditions: formData.terms_conditions.trim() || null,
        image_url: formData.image_url.trim() || null
      };

      let error;

      if (editingPromotion) {
        console.log('Updating promotion with data:', promotionData);
        // Actualizar promoción existente
        const { error: updateError } = await supabase
          .from('promotions')
          .update(promotionData)
          .eq('id', editingPromotion.id);
        error = updateError;
      } else {
        console.log('Creating promotion with data:', promotionData);
        // Crear nueva promoción
        const { error: insertError } = await supabase
          .from('promotions')
          .insert([promotionData]);
        error = insertError;
      }

      if (error) {
        console.error('Error saving promotion:', error);
        toast({
          title: "Error",
          description: `No se pudo ${editingPromotion ? 'actualizar' : 'crear'} la promoción`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: `Promoción ${editingPromotion ? 'actualizada' : 'creada'} correctamente`,
        });
        setOpen(false);
        resetForm();
        onPromotionUpdated();
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDialogChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && !editingPromotion) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {editingPromotion ? (
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Promoción
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="company_name">Nombre de la empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_type">Tipo de empresa *</Label>
              <Input
                id="company_type"
                value={formData.company_type}
                onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
                placeholder="ej: Laboratorio, Distribuidora, etc."
                required
              />
            </div>
            <div>
              <Label htmlFor="discount_details">Detalles del descuento</Label>
              <Input
                id="discount_details"
                value={formData.discount_details}
                onChange={(e) => setFormData({ ...formData, discount_details: e.target.value })}
                placeholder="ej: 20% de descuento, 2x1, etc."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="terms_conditions">Términos y condiciones</Label>
            <Textarea
              id="terms_conditions"
              value={formData.terms_conditions}
              onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
              rows={2}
              placeholder="Condiciones de la promoción..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valid_until">Válida hasta</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="image_url">URL de imagen</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg (opcional)"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Promoción activa</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : editingPromotion ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
