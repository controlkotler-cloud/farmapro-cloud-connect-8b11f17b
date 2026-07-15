
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Calendar } from 'lucide-react';
import { PromotionActions } from './PromotionActions';

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

interface PromotionCardProps {
  promotion: Promotion;
  onEdit: (promotion: Promotion) => void;
  onToggleStatus: (promotionId: string, currentStatus: boolean) => void;
  onDelete: (promotionId: string, promotionTitle: string) => void;
  isDeleting: boolean;
}

export const PromotionCard = ({ 
  promotion, 
  onEdit, 
  onToggleStatus, 
  onDelete, 
  isDeleting 
}: PromotionCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-muted p-2 rounded-full">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
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
            <p className="text-sm font-medium text-muted-foreground">Tipo de empresa</p>
            <p className="text-sm text-muted-foreground">{promotion.company_type}</p>
          </div>
          {promotion.discount_details && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Descuento</p>
              <p className="text-sm text-muted-foreground">{promotion.discount_details}</p>
            </div>
          )}
          {promotion.valid_until && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              Válida hasta: {new Date(promotion.valid_until).toLocaleDateString()}
            </div>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2">{promotion.description}</p>
          <PromotionActions
            onEdit={() => onEdit(promotion)}
            onToggleStatus={() => onToggleStatus(promotion.id, promotion.is_active)}
            onDelete={() => onDelete(promotion.id, promotion.title)}
            isActive={promotion.is_active}
            isDeleting={isDeleting}
          />
        </div>
      </CardContent>
    </Card>
  );
};
