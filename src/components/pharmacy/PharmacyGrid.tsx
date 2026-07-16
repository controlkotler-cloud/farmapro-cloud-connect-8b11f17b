
import { PharmacyCard } from './PharmacyCard';
import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

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
            <div className="h-48 rounded-t-lg bg-muted"></div>
            <CardContent className="p-6">
              <div className="mb-2 h-4 rounded bg-muted"></div>
              <div className="h-3 rounded bg-muted"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center">
        <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-base font-extrabold tracking-tight text-foreground">Aún no hay farmacias publicadas</h3>
        <p className="mt-1 text-sm text-muted-foreground">Vuelve pronto para ver las novedades del sector.</p>
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
