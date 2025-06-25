
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, MapPin, Euro, Edit, Trash, Plus } from 'lucide-react';

const AdminFarmacias = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } else {
      setPharmacies(data || []);
    }
    setLoading(false);
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
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Gestión de directorio de farmacias disponible próximamente</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminFarmacias;
