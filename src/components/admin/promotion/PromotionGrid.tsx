
import { PromotionCard } from './PromotionCard';

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

interface PromotionGridProps {
  promotions: Promotion[];
  onEdit: (promotion: Promotion) => void;
  onToggleStatus: (promotionId: string, currentStatus: boolean) => void;
  onDelete: (promotionId: string, promotionTitle: string) => void;
  deletingId: string | null;
}

export const PromotionGrid = ({ 
  promotions, 
  onEdit, 
  onToggleStatus, 
  onDelete, 
  deletingId 
}: PromotionGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {promotions.map((promotion) => (
        <PromotionCard
          key={promotion.id}
          promotion={promotion}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          isDeleting={deletingId === promotion.id}
        />
      ))}
    </div>
  );
};
