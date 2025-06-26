
import { useState, useEffect } from 'react';
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

export const usePromotionManagement = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadPromotions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading promotions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las promociones",
        variant: "destructive",
      });
    } else {
      setPromotions(data || []);
    }
    setLoading(false);
  };

  const togglePromotionStatus = async (promotionId: string, currentStatus: boolean) => {
    console.log('Toggling promotion status:', promotionId, 'from', currentStatus, 'to', !currentStatus);
    
    const { error } = await supabase
      .from('promotions')
      .update({ is_active: !currentStatus })
      .eq('id', promotionId);

    if (error) {
      console.error('Error updating promotion status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la promoción",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: `Promoción ${!currentStatus ? 'activada' : 'desactivada'} correctamente`,
      });
      setPromotions(prevPromotions => 
        prevPromotions.map(promotion => 
          promotion.id === promotionId 
            ? { ...promotion, is_active: !currentStatus }
            : promotion
        )
      );
    }
  };

  const deletePromotion = async (promotionId: string, promotionTitle: string) => {
    if (deletingId) return;
    
    const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar la promoción "${promotionTitle}"? Esta acción no se puede deshacer.`);
    
    if (!confirmed) {
      console.log('Delete cancelled by user');
      return;
    }

    console.log('User confirmed deletion, proceeding with promotion:', promotionId);
    setDeletingId(promotionId);
    
    try {
      // Verificar si el usuario es admin antes de intentar eliminar
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('subscription_role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userProfile || userProfile.subscription_role !== 'admin') {
        toast({
          title: "Error de permisos",
          description: "No tienes permisos para eliminar promociones",
          variant: "destructive",
        });
        return;
      }

      const { error, count } = await supabase
        .from('promotions')
        .delete({ count: 'exact' })
        .eq('id', promotionId);

      if (error) {
        console.error('Error deleting promotion:', error);
        toast({
          title: "Error",
          description: `No se pudo eliminar la promoción: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log(`Promotion deleted successfully, rows affected: ${count}`);
        toast({
          title: "Éxito",
          description: "Promoción eliminada correctamente",
        });
        setPromotions(prevPromotions => prevPromotions.filter(promotion => promotion.id !== promotionId));
      }
    } catch (error) {
      console.error('Unexpected error deleting promotion:', error);
      toast({
        title: "Error",
        description: "Error inesperado al eliminar la promoción",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  return {
    promotions,
    loading,
    deletingId,
    loadPromotions,
    togglePromotionStatus,
    deletePromotion
  };
};
