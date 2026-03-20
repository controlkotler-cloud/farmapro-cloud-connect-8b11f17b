
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  MessageCircle,
  Hash,
  Users,
  Activity,
  Eye,
  Pin
} from 'lucide-react';

interface ForumStats {
  totalThreads: number;
  totalReplies: number;
  totalCategories: number;
  activeUsers: number;
}

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

interface ForumStatsProps {
  stats: ForumStats;
  threads: ForumThread[];
  onViewThread: (threadId: string) => void;
}

const ForumStatsComponent = ({ stats, threads, onViewThread }: ForumStatsProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hilos</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalThreads}</div>
            <p className="text-xs text-muted-foreground">Hilos de discusión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Respuestas</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReplies}</div>
            <p className="text-xs text-muted-foreground">Respuestas en hilos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">Categorías activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 días</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Hilos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {threads.slice(0, 5).map((thread) => (
              <div key={thread.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{thread.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Por {thread.profiles?.full_name || 'Usuario desconocido'} en {thread.forum_categories?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(thread.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {thread.is_pinned && (
                    <Badge variant="secondary">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinneado
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {thread.replies_count} respuestas
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewThread(thread.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {threads.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay hilos recientes</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForumStatsComponent;
