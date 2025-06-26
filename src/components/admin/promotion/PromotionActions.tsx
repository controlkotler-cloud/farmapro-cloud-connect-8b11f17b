
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';

interface PromotionActionsProps {
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  isActive: boolean;
  isDeleting: boolean;
}

export const PromotionActions = ({ 
  onEdit, 
  onToggleStatus, 
  onDelete, 
  isActive, 
  isDeleting 
}: PromotionActionsProps) => {
  return (
    <div className="flex space-x-2 pt-2">
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onToggleStatus}
      >
        {isActive ? 'Desactivar' : 'Activar'}
      </Button>
      <Button size="sm" variant="outline" onClick={onEdit}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onDelete}
        disabled={isDeleting}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash className="h-4 w-4" />
        {isDeleting && <span className="ml-1">...</span>}
      </Button>
    </div>
  );
};
