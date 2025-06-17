
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Home, TrendingUp, Mail, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PharmacyListing {
  id: string;
  title: string;
  location: string;
  description: string;
  price: number;
  surface_area: number;
  annual_revenue: number;
  contact_email: string;
  seller_id: string;
  is_active: boolean;
  created_at: string;
}

interface PharmacyCardProps {
  listing: PharmacyListing;
  index: number;
}

const pharmacyImages = [
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1585435557343-3b092031d03d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=300&fit=crop'
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const formatRevenue = (revenue: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(revenue) + '/año';
};

const getPharmacyImage = (index: number) => {
  return pharmacyImages[index % pharmacyImages.length];
};

export const PharmacyCard = ({ listing, index }: PharmacyCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <div className="relative">
          <img
            src={getPharmacyImage(index)}
            alt={listing.title}
            className="h-48 w-full object-cover rounded-t-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center rounded-t-lg" style={{ display: 'none' }}>
            <Building2 className="h-16 w-16 text-blue-600" />
          </div>
          <Badge className="absolute top-2 right-2 bg-green-600">
            En Venta
          </Badge>
        </div>
        <CardHeader>
          <CardTitle className="text-lg">{listing.title}</CardTitle>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            {listing.location}
          </div>
          <CardDescription>{listing.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {listing.price && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Precio:</span>
                <span className="font-bold text-lg text-green-600">
                  {formatPrice(listing.price)}
                </span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {listing.surface_area && (
                <div className="flex items-center">
                  <Home className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{listing.surface_area} m²</span>
                </div>
              )}
              {listing.annual_revenue && (
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-xs">{formatRevenue(listing.annual_revenue)}</span>
                </div>
              )}
            </div>
            
            <Button 
              className="w-full mt-4"
              onClick={() => window.location.href = `mailto:${listing.contact_email}?subject=Interés en ${listing.title}`}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contactar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
