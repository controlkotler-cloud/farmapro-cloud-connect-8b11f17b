
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Trophy,
  MessageSquare,
  BookOpen,
  Gift,
  Users
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

type ChallengeType = 'course_started' | 'course_completed' | 'forum_post' | 'forum_reply' | 'resource_downloaded' | 'community_engagement';

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  points_reward: number;
  target_count: number;
  is_active: boolean;
  created_at: string;
}

interface ChallengeManagementProps {
  challenges: Challenge[];
  loading: boolean;
  onCreateChallenge: (data: Omit<Challenge, 'id' | 'created_at'>) => Promise<void>;
  onUpdateChallenge: (id: string, data: Partial<Challenge>) => Promise<void>;
  onDeleteChallenge: (id: string) => Promise<void>;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

const challengeTypes = [
  { value: 'course_started' as ChallengeType, label: 'Curso Iniciado', icon: BookOpen, emoji: '📚' },
  { value: 'course_completed' as ChallengeType, label: 'Curso Completado', icon: BookOpen, emoji: '🎓' },
  { value: 'forum_post' as ChallengeType, label: 'Post en Foro', icon: MessageSquare, emoji: '💬' },
  { value: 'forum_reply' as ChallengeType, label: 'Respuesta en Foro', icon: MessageSquare, emoji: '💭' },
  { value: 'resource_downloaded' as ChallengeType, label: 'Recurso Descargado', icon: Gift, emoji: '📁' },
  { value: 'community_engagement' as ChallengeType, label: 'Participación Comunitaria', icon: Users, emoji: '👥' }
];

export const ChallengeManagement = ({ 
  challenges, 
  loading,
  onCreateChallenge, 
  onUpdateChallenge, 
  onDeleteChallenge,
  creating,
  updating,
  deleting
}: ChallengeManagementProps) => {
  const [challengeForm, setChallengeForm] = useState({
    name: '',
    description: '',
    type: '' as ChallengeType | '',
    points_reward: 100,
    target_count: 1,
    is_active: true
  });
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);

  const openChallengeDialog = (challenge?: Challenge) => {
    if (challenge) {
      setEditingChallenge(challenge);
      setChallengeForm({
        name: challenge.name,
        description: challenge.description || '',
        type: challenge.type,
        points_reward: challenge.points_reward,
        target_count: challenge.target_count,
        is_active: challenge.is_active
      });
    } else {
      setEditingChallenge(null);
      setChallengeForm({
        name: '',
        description: '',
        type: '',
        points_reward: 100,
        target_count: 1,
        is_active: true
      });
    }
    setShowChallengeDialog(true);
  };

  const handleSubmit = async () => {
    if (!challengeForm.name.trim() || !challengeForm.type) {
      return;
    }

    try {
      if (editingChallenge) {
        await onUpdateChallenge(editingChallenge.id, challengeForm as Partial<Challenge>);
      } else {
        await onCreateChallenge(challengeForm as Omit<Challenge, 'id' | 'created_at'>);
      }
      setChallengeForm({
        name: '',
        description: '',
        type: '',
        points_reward: 100,
        target_count: 1,
        is_active: true
      });
      setEditingChallenge(null);
      setShowChallengeDialog(false);
    } catch (error) {
      console.error('Error submitting challenge:', error);
    }
  };

  const getChallengeTypeInfo = (type: ChallengeType) => {
    return challengeTypes.find(ct => ct.value === type) || { 
      label: type, 
      icon: Trophy, 
      emoji: '🏆' 
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Retos</h3>
          <p className="text-sm text-gray-600">Crea y gestiona los retos de la plataforma</p>
        </div>
        <Button onClick={() => openChallengeDialog()} disabled={creating}>
          <Plus className="h-4 w-4 mr-2" />
          {creating ? 'Creando...' : 'Nuevo Reto'}
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {challenges.map((challenge) => {
              const typeInfo = getChallengeTypeInfo(challenge.type);
              const IconComponent = typeInfo.icon;
              
              return (
                <Card key={challenge.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg flex items-center space-x-2">
                              <span>{typeInfo.emoji}</span>
                              <span>{challenge.name}</span>
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline">{typeInfo.label}</Badge>
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                                {challenge.points_reward} pts
                              </Badge>
                              <Badge variant={challenge.is_active ? "default" : "secondary"}>
                                {challenge.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {challenge.description && (
                          <p className="text-gray-600 mb-3">{challenge.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Meta: {challenge.target_count}</span>
                          <span>•</span>
                          <span>Creado: {new Date(challenge.created_at).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openChallengeDialog(challenge)}
                          disabled={updating}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={deleting}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar reto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará el reto "{challenge.name}" y todo el progreso asociado de los usuarios.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteChallenge(challenge.id)}
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
              );
            })}
            {challenges.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay retos</h3>
                  <p className="text-gray-600 mb-4">Crea el primer reto para motivar a los usuarios</p>
                  <Button onClick={() => openChallengeDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Reto
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Challenge Dialog */}
      <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingChallenge ? 'Editar Reto' : 'Nuevo Reto'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="challengeName">Nombre del Reto *</Label>
              <Input
                id="challengeName"
                value={challengeForm.name}
                onChange={(e) => setChallengeForm({ ...challengeForm, name: e.target.value })}
                placeholder="Ej: Primer Curso Completado"
                disabled={creating || updating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="challengeDescription">Descripción</Label>
              <Textarea
                id="challengeDescription"
                value={challengeForm.description}
                onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                placeholder="Descripción del reto (opcional)"
                rows={3}
                disabled={creating || updating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="challengeType">Tipo de Reto *</Label>
              <Select 
                value={challengeForm.type} 
                onValueChange={(value: ChallengeType) => setChallengeForm({ ...challengeForm, type: value })}
                disabled={creating || updating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de reto" />
                </SelectTrigger>
                <SelectContent>
                  {challengeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <span>{type.emoji}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetCount">Meta</Label>
                <Input
                  id="targetCount"
                  type="number"
                  min="1"
                  value={challengeForm.target_count}
                  onChange={(e) => setChallengeForm({ ...challengeForm, target_count: parseInt(e.target.value) || 1 })}
                  disabled={creating || updating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pointsReward">Puntos de Recompensa</Label>
                <Input
                  id="pointsReward"
                  type="number"
                  min="1"
                  value={challengeForm.points_reward}
                  onChange={(e) => setChallengeForm({ ...challengeForm, points_reward: parseInt(e.target.value) || 100 })}
                  disabled={creating || updating}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={challengeForm.is_active}
                onCheckedChange={(checked) => setChallengeForm({ ...challengeForm, is_active: checked })}
                disabled={creating || updating}
              />
              <Label htmlFor="isActive">Reto Activo</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowChallengeDialog(false)}
              disabled={creating || updating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={creating || updating || !challengeForm.name.trim() || !challengeForm.type}
            >
              {creating || updating 
                ? (editingChallenge ? 'Actualizando...' : 'Creando...') 
                : (editingChallenge ? 'Actualizar' : 'Crear')
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
