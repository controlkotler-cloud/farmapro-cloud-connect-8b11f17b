
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Calendar, Edit, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PromotionFormDialog } from '@/components/admin/promotion/PromotionFormDialog';

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

const AdminPromociones = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPromotions();
  }, []);

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

  const handleEdit = (promotion: Promotion) => {
    console.log('Editing promotion:', promotion.id);
    setEditingPromotion(promotion);
  };

  const handlePromotionUpdated = () => {
    setEditingPromotion(null);
    loadPromotions();
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Promociones</h1>
          <p className="text-gray-600">Gestionar ofertas y descuentos para usuarios</p>
        </div>
        <PromotionFormDialog 
          editingPromotion={editingPromotion} 
          onPromotionUpdated={handlePromotionUpdated} 
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay promociones creadas</h3>
            <p className="text-gray-600 mb-4">Aún no se han creado promociones en el sistema.</p>
            <PromotionFormDialog 
              onPromotionUpdated={handlePromotionUpdated} 
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promotion) => (
            <Card key={promotion.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Megaphone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{promotion.title}</CardTitle>
                      <CardDescription>{promotion.company_name}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={promotion.is_active ? "default" : "secondary"}>
                    {promotion.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Tipo de empresa</p>
                    <p className="text-sm text-gray-600">{promotion.company_type}</p>
                  </div>
                  {promotion.discount_details && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Descuento</p>
                      <p className="text-sm text-gray-600">{promotion.discount_details}</p>
                    </div>
                  )}
                  {promotion.valid_until && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      Válida hasta: {new Date(promotion.valid_until).toLocaleDateString()}
                    </div>
                  )}
                  <p className="text-sm text-gray-700 line-clamp-2">{promotion.description}</p>
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => togglePromotionStatus(promotion.id, promotion.is_active)}
                    >
                      {promotion.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(promotion)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deletePromotion(promotion.id, promotion.title)}
                      disabled={deletingId === promotion.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
                      {deletingId === promotion.id && <span className="ml-1">...</span>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPromociones;
