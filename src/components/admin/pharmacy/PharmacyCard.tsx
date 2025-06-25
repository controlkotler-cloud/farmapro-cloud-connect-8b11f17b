
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, MapPin, Edit, Trash } from 'lucide-react';

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
  seller_id: string;
  created_at: string;
}

interface PharmacyCardProps {
  pharmacy: PharmacyListing;
  onEdit: (pharmacy: PharmacyListing) => void;
  onToggleStatus: (pharmacyId: string, currentStatus: boolean) => void;
  onDelete: (pharmacyId: string) => void;
}

export const PharmacyCard = ({ pharmacy, onEdit, onToggleStatus, onDelete }: PharmacyCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
          {pharmacy.price && (
            <div>
              <p className="text-sm font-medium text-gray-700">Precio</p>
              <p className="text-lg font-semibold text-green-600">{formatPrice(pharmacy.price)}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {pharmacy.surface_area && (
              <div>
                <p className="text-sm font-medium text-gray-700">Superficie</p>
                <p className="text-sm text-gray-600">{pharmacy.surface_area} m²</p>
              </div>
            )}
            {pharmacy.annual_revenue && (
              <div>
                <p className="text-sm font-medium text-gray-700">Facturación</p>
                <p className="text-sm text-gray-600">{formatPrice(pharmacy.annual_revenue)}/año</p>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-700 line-clamp-2">{pharmacy.description}</p>
          <div className="flex space-x-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onToggleStatus(pharmacy.id, pharmacy.is_active)}
            >
              {pharmacy.is_active ? 'Desactivar' : 'Activar'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(pharmacy)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onDelete(pharmacy.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
