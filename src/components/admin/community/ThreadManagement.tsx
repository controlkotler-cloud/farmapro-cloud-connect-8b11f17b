
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pin, 
  PinOff,
  Eye,
  Trash2,
  MessageSquare
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

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category_id: string;
  is_pinned: boolean;
  replies_count: number;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  forum_categories?: {
    name: string;
  };
}

interface ThreadManagementProps {
  threads: ForumThread[];
  onTogglePin: (threadId: string, isPinned: boolean) => Promise<void>;
  onDeleteThread: (threadId: string) => Promise<void>;
  onViewThread: (threadId: string) => void;
}

const ThreadManagement = ({ 
  threads, 
  onTogglePin, 
  onDeleteThread, 
  onViewThread 
}: ThreadManagementProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Hilos del Foro</h3>
        <p className="text-sm text-gray-600">Modera y gestiona los hilos de discusión</p>
      </div>

      <div className="space-y-4">
        {threads.map((thread) => (
          <Card key={thread.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{thread.title}</h4>
                    {thread.is_pinned && (
                      <Badge variant="secondary">
                        <Pin className="h-3 w-3 mr-1" />
                        Pinneado
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {thread.content}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Por {thread.profiles?.full_name || 'Usuario desconocido'}</span>
                    <span>•</span>
                    <span>{thread.forum_categories?.name}</span>
                    <span>•</span>
                    <span>{thread.replies_count} respuestas</span>
                    <span>•</span>
                    <span>{new Date(thread.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTogglePin(thread.id, thread.is_pinned)}
                    title={thread.is_pinned ? 'Despinnear hilo' : 'Pinnear hilo'}
                  >
                    {thread.is_pinned ? (
                      <PinOff className="h-4 w-4" />
                    ) : (
                      <Pin className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewThread(thread.id)}
                    title="Ver hilo"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" title="Eliminar hilo">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar hilo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará el hilo "{thread.title}" y todas sus {thread.replies_count} respuestas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteThread(thread.id)}
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
        {threads.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay hilos</h3>
              <p className="text-gray-600">Los hilos aparecerán aquí cuando los usuarios comiencen a crear discusiones</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ThreadManagement;
