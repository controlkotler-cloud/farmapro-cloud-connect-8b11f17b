
import ReactMarkdown from 'react-markdown';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, Users, Clock, Heart, Reply, Pin, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Reply {
  id: string;
  content: string;
  author_id: string;
  likes_count: number;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface ThreadViewProps {
  threadId: string;
  onBack: () => void;
}

export const ThreadView = ({ threadId, onBack }: ThreadViewProps) => {
  const { profile } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThread();
    loadReplies();
  }, [threadId]);

  const loadThread = async () => {
    const { data, error } = await supabase
      .from('forum_threads')
      .select(`
        *,
        profiles(full_name),
        forum_categories(name)
      `)
      .eq('id', threadId)
      .single();

    if (error) {
      console.error('Error loading thread:', error);
    } else {
      setThread(data);
    }
  };

  const loadReplies = async () => {
    const { data, error } = await supabase
      .from('forum_replies')
      .select(`
        *,
        profiles(full_name)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading replies:', error);
    } else {
      setReplies(data || []);
    }
    setLoading(false);
  };

  const createReply = async () => {
    if (!profile?.id || !newReply.trim()) return;

    const { error } = await supabase
      .from('forum_replies')
      .insert([{
        thread_id: threadId,
        author_id: profile.id,
        content: newReply
      }]);

    if (error) {
      console.error('Error creating reply:', error);
    } else {
      // Update challenge progress for forum reply
      const { updateChallengeProgress } = await import('@/utils/challengeUtils');
      await updateChallengeProgress(profile.id, 'forum_reply', 1);

      // Update thread reply count
      await supabase
        .from('forum_threads')
        .update({ 
          replies_count: replies.length + 1,
          last_reply_at: new Date().toISOString()
        })
        .eq('id', threadId);

      setNewReply('');
      loadReplies();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !thread) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">Cargando hilo...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al foro
      </Button>

      {/* Thread Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {thread.is_pinned && <Pin className="h-5 w-5 text-blue-600" />}
              <CardTitle className="text-2xl">{thread.title}</CardTitle>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <span>{thread.forum_categories?.name}</span>
              {['Gestión Farmacéutica', 'Nuevos Medicamentos'].includes(thread.forum_categories?.name) && (
                <Star className="h-3 w-3 text-yellow-500" />
              )}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{thread.profiles?.full_name || 'Usuario farmapro'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatDate(thread.created_at)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-4 w-4" />
              <span>{replies.length} respuestas</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none text-gray-700 leading-relaxed">
            <ReactMarkdown>{thread.content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">💬 Respuestas ({replies.length})</h3>
        
        {replies.map((reply, index) => (
          <motion.div
            key={reply.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">{reply.profiles?.full_name || 'Usuario farmapro'}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Heart className="h-4 w-4" />
                      <span>{reply.likes_count}</span>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(reply.created_at)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Reply Form */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Reply className="h-5 w-5" />
              <span>💭 Escribir respuesta</span>
            </CardTitle>
            <CardDescription>
              Comparte tu experiencia y conocimiento con la comunidad farmapro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Escribe tu respuesta aquí..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                💰 +50 puntos por participar en el foro
              </div>
              <Button 
                onClick={createReply}
                disabled={!newReply.trim()}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Responder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
