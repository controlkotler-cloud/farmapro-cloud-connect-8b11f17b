
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Hash
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  is_premium: boolean;
  created_at: string;
  _count?: {
    threads: number;
  };
}

interface CategoryManagementProps {
  categories: ForumCategory[];
  onCreateCategory: (data: { name: string; description: string; is_premium: boolean }) => Promise<void>;
  onUpdateCategory: (id: string, data: { name: string; description: string; is_premium: boolean }) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const CategoryManagement = ({ 
  categories, 
  onCreateCategory, 
  onUpdateCategory, 
  onDeleteCategory 
}: CategoryManagementProps) => {
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    is_premium: false
  });
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);

  const openCategoryDialog = (category?: ForumCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        is_premium: category.is_premium
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', is_premium: false });
    }
    setShowCategoryDialog(true);
  };

  const handleSubmit = async () => {
    if (!categoryForm.name.trim()) {
      return;
    }

    setSubmittingCategory(true);
    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, categoryForm);
      } else {
        await onCreateCategory(categoryForm);
      }
      setCategoryForm({ name: '', description: '', is_premium: false });
      setEditingCategory(null);
      setShowCategoryDialog(false);
    } finally {
      setSubmittingCategory(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Categorías del Foro</h3>
          <p className="text-sm text-gray-600">Gestiona las categorías disponibles en el foro</p>
        </div>
        <Button onClick={() => openCategoryDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    {category.is_premium && (
                      <Badge variant="default" className="bg-yellow-100 text-yellow-800">Premium</Badge>
                    )}
                    <Badge variant="outline">
                      {category._count?.threads || 0} hilos
                    </Badge>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Creada el {new Date(category.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCategoryDialog(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará la categoría "{category.name}".
                          {category._count && category._count.threads > 0 && (
                            <span className="block mt-2 text-red-600 font-medium">
                              ⚠️ Esta categoría tiene {category._count.threads} hilo(s) asociado(s).
                            </span>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteCategory(category.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Hash className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
              <p className="text-gray-600 mb-4">Crea la primera categoría para organizar los hilos del foro</p>
              <Button onClick={() => openCategoryDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Categoría
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nombre *</Label>
              <Input
                id="categoryName"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Nombre de la categoría"
                disabled={submittingCategory}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Descripción</Label>
              <Textarea
                id="categoryDescription"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Descripción de la categoría (opcional)"
                rows={3}
                disabled={submittingCategory}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isPremium"
                checked={categoryForm.is_premium}
                onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_premium: checked })}
                disabled={submittingCategory}
              />
              <Label htmlFor="isPremium">Categoría Premium</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowCategoryDialog(false)}
              disabled={submittingCategory}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submittingCategory || !categoryForm.name.trim()}
            >
              {submittingCategory ? 'Guardando...' : (editingCategory ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagement;
