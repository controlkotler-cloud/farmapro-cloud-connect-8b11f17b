
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Calendar, Edit, Trash, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Promotion {
  id: string;
  title: string;
  company_name: string;
  company_type: string;
  description: string;
  discount_details: string;
  is_active: boolean;
  valid_until: string;
  created_at: string;
}

const AdminPromociones = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
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

  const togglePromotionStatus = async (promotionId: string, currentStatus: boolean) => {
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

  const deletePromotion = async (promotionId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta promoción?')) {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promotionId);

      if (error) {
        console.error('Error deleting promotion:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la promoción",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Promoción eliminada correctamente",
        });
        setPromotions(prevPromotions => prevPromotions.filter(promotion => promotion.id !== promotionId));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Promociones</h1>
          <p className="text-gray-600">Gestionar ofertas y descuentos para usuarios</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Promoción
        </Button>
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
            <p className="text-gray-600">No hay promociones disponibles</p>
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
                  <div>
                    <p className="text-sm font-medium text-gray-700">Descuento</p>
                    <p className="text-sm text-gray-600">{promotion.discount_details || 'No especificado'}</p>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    Válida hasta: {promotion.valid_until ? new Date(promotion.valid_until).toLocaleDateString() : 'Sin límite'}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{promotion.description}</p>
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => togglePromotionStatus(promotion.id, promotion.is_active)}
                    >
                      {promotion.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deletePromotion(promotion.id)}
                    >
                      <Trash className="h-4 w-4" />
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
