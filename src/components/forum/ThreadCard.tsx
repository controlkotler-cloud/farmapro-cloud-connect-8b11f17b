
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Clock, Pin, Star, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThreadCardProps {
  thread: {
    id: string;
    title: string;
    content: string;
    author_id: string;
    category_id: string;
    replies_count: number;
    is_pinned: boolean;
    last_reply_at: string;
    created_at: string;
    profiles?: {
      full_name: string;
    };
    forum_categories?: {
      name: string;
    };
  };
  index: number;
  onClick: () => void;
}

export const ThreadCard = ({ thread, index, onClick }: ThreadCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    return `Hace ${Math.floor(diffInHours / 24)} días`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card 
        className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-300 group"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {thread.is_pinned && (
                <Pin className="h-4 w-4 text-blue-600 flex-shrink-0" />
              )}
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                {thread.title}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>{thread.forum_categories?.name || 'General'}</span>
                {thread.forum_categories?.name && ['Gestión Farmacéutica', 'Nuevos Medicamentos'].includes(thread.forum_categories.name) && (
                  <Star className="h-3 w-3 text-yellow-500" />
                )}
              </Badge>
            </div>
          </div>
          <CardDescription className="line-clamp-2 text-gray-600">
            {thread.content.substring(0, 150)}...
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span className="font-medium">{thread.profiles?.full_name || 'Usuario farmapro'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span>{thread.replies_count} respuestas</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{Math.floor(Math.random() * 100) + 20} vistas</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatDate(thread.last_reply_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
