
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  RotateCcw,
  CheckCircle,
  Clock,
  Trophy,
  User,
  BookOpen,
  MessageSquare,
  Gift
} from 'lucide-react';
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
import { Database } from '@/integrations/supabase/types';

type ChallengeType = Database['public']['Enums']['challenge_type'];

interface ChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  current_count: number;
  completed_at: string | null;
  points_earned: number;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  challenges?: {
    name: string;
    type: ChallengeType;
    points_reward: number;
    target_count: number;
  };
}

interface UserChallengeProgressProps {
  challengeProgress: ChallengeProgress[];
  loading: boolean;
  onResetProgress: (progressId: string) => Promise<void>;
  resetting: boolean;
}

export const UserChallengeProgress = ({ 
  challengeProgress, 
  loading,
  onResetProgress,
  resetting
}: UserChallengeProgressProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in_progress'>('all');

  // Filter progress based on search and status
  const filteredProgress = challengeProgress.filter(progress => {
    const matchesSearch = !searchTerm || 
      progress.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.challenges?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'completed' && progress.completed_at) ||
      (filterStatus === 'in_progress' && !progress.completed_at);
    
    return matchesSearch && matchesStatus;
  });

  const getChallengeTypeLabel = (type: ChallengeType) => {
    switch (type) {
      case 'course_completed':
        return 'Curso Completado';
      case 'course_started':
        return 'Curso Iniciado';
      case 'forum_post':
        return 'Post en Foro';
      case 'forum_reply':
        return 'Respuesta en Foro';
      case 'resource_downloaded':
        return 'Recurso Descargado';
      default:
        return type;
    }
  };

  const getChallengeTypeIcon = (type: ChallengeType) => {
    switch (type) {
      case 'course_completed':
      case 'course_started':
        return <BookOpen className="h-5 w-5" />;
      case 'forum_post':
      case 'forum_reply':
        return <MessageSquare className="h-5 w-5" />;
      case 'resource_downloaded':
        return <Gift className="h-5 w-5" />;
      default:
        return <Trophy className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Progreso de Usuarios</h3>
          <p className="text-sm text-muted-foreground">Monitorea el progreso de los usuarios en los retos</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuarios o retos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Todos
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('completed')}
            >
              Completados
            </Button>
            <Button
              variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('in_progress')}
            >
              En Progreso
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-4"></div>
                  <div className="h-2 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {filteredProgress.map((progress) => {
              const completed = progress.completed_at !== null;
              const progressPercentage = progress.challenges 
                ? Math.min((progress.current_count / progress.challenges.target_count) * 100, 100)
                : 0;
              
              return (
                <Card key={progress.id} className={completed ? 'border-success/30 bg-success/10' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`p-2 rounded-lg ${completed ? 'bg-success/10 text-success' : 'bg-miel-soft text-miel'}`}>
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium text-lg">
                              {progress.profiles?.full_name || 'Usuario desconocido'}
                            </h4>
                            <p className="text-sm text-muted-foreground">{progress.profiles?.email}</p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-muted-foreground">
                              {getChallengeTypeIcon(progress.challenges?.type || 'course_started')}
                            </span>
                            <h5 className="font-medium">{progress.challenges?.name}</h5>
                            <Badge variant="outline">
                              {getChallengeTypeLabel(progress.challenges?.type || 'course_started')}
                            </Badge>
                            {completed && (
                              <Badge className="bg-success/10 text-success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completado
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progreso:</span>
                              <span className="font-medium">
                                {progress.current_count} / {progress.challenges?.target_count || 0}
                              </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <span>Iniciado: {new Date(progress.created_at).toLocaleDateString('es-ES')}</span>
                            {completed && (
                              <span>Completado: {new Date(progress.completed_at!).toLocaleDateString('es-ES')}</span>
                            )}
                          </div>
                          {progress.points_earned > 0 && (
                            <Badge className="bg-miel-soft text-foreground">
                              +{progress.points_earned} pts
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={resetting}>
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Reiniciar progreso?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción reiniciará el progreso de {progress.profiles?.full_name || 'este usuario'} en el reto "{progress.challenges?.name}".
                                {completed && ' Se perderán los puntos ganados.'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onResetProgress(progress.id)}
                                className="bg-warning text-warning-foreground hover:bg-warning/90"
                              >
                                Reiniciar
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
            {filteredProgress.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  {searchTerm || filterStatus !== 'all' ? (
                    <>
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron resultados</h3>
                      <p className="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
                    </>
                  ) : (
                    <>
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No hay progreso de usuarios</h3>
                      <p className="text-muted-foreground">Los progresos aparecerán aquí cuando los usuarios comiencen a completar retos</p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};
