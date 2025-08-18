
import { PharmacyCard } from './PharmacyCard';
import { Card, CardContent } from '@/components/ui/card';

interface PublicPharmacyListing {
  id: string;
  title: string;
  location: string;
  description: string;
  price: number;
  surface_area: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images_urls: string[] | null;
}

interface PharmacyGridProps {
  listings: PublicPharmacyListing[];
  loading: boolean;
  onContactClick?: (pharmacyId: string, title: string) => void;
}

export const PharmacyGrid = ({ listings, loading, onContactClick }: PharmacyGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing, index) => (
        <PharmacyCard key={listing.id} listing={listing} index={index} onContactClick={onContactClick} />
      ))}
    </div>
  );
};
