
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, MapPin, Euro, Edit, Trash, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PharmacyListing {
  id: string;
  title: string;
  location: string;
  description: string;
  price: number;
  surface_area: number;
  annual_revenue: number;
  is_active: boolean;
  contact_email: string;
  created_at: string;
}

const AdminFarmacias = () => {
  const [pharmacies, setPharmacies] = useState<PharmacyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPharmacies();
  }, []);

  const loadPharmacies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pharmacy_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading pharmacies:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las farmacias",
        variant: "destructive",
      });
    } else {
      setPharmacies(data || []);
    }
    setLoading(false);
  };

  const togglePharmacyStatus = async (pharmacyId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('pharmacy_listings')
      .update({ is_active: !currentStatus })
      .eq('id', pharmacyId);

    if (error) {
      console.error('Error updating pharmacy status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la farmacia",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: `Farmacia ${!currentStatus ? 'activada' : 'desactivada'} correctamente`,
      });
      setPharmacies(prevPharmacies => 
        prevPharmacies.map(pharmacy => 
          pharmacy.id === pharmacyId 
            ? { ...pharmacy, is_active: !currentStatus }
            : pharmacy
        )
      );
    }
  };

  const deletePharmacy = async (pharmacyId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta farmacia?')) {
      const { error } = await supabase
        .from('pharmacy_listings')
        .delete()
        .eq('id', pharmacyId);

      if (error) {
        console.error('Error deleting pharmacy:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la farmacia",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Farmacia eliminada correctamente",
        });
        setPharmacies(prevPharmacies => prevPharmacies.filter(pharmacy => pharmacy.id !== pharmacyId));
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Farmacias</h1>
          <p className="text-gray-600">Gestionar directorio de farmacias en venta</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Farmacia
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
      ) : pharmacies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay farmacias disponibles</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pharmacies.map((pharmacy) => (
            <Card key={pharmacy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Store className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{pharmacy.title}</CardTitle>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        {pharmacy.location}
                      </div>
                    </div>
                  </div>
                  <Badge variant={pharmacy.is_active ? "default" : "secondary"}>
                    {pharmacy.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Precio</p>
                    <p className="text-lg font-semibold text-green-600">{formatPrice(pharmacy.price)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Superficie</p>
                      <p className="text-sm text-gray-600">{pharmacy.surface_area} m²</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Facturación</p>
                      <p className="text-sm text-gray-600">{formatPrice(pharmacy.annual_revenue)}/año</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{pharmacy.description}</p>
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => togglePharmacyStatus(pharmacy.id, pharmacy.is_active)}
                    >
                      {pharmacy.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deletePharmacy(pharmacy.id)}
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

export default AdminFarmacias;
