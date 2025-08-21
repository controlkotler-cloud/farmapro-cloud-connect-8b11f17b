
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Building2, MapPin, Clock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Conversation {
  id: string;
  job_id: string;
  employer_id: string;
  applicant_id: string;
  status: string;
  last_message_at: string;
  last_message_preview: string;
  created_at: string;
  job_title?: string;
  job_company_name?: string;
  job_location?: string;
  unread_count?: number;
}

const EmpleoConversaciones = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadConversations();
    }
  }, [profile]);

  const loadConversations = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      console.log('Loading user conversations...');

      const { data, error } = await supabase
        .from('job_conversations')
        .select(`
          *,
          job_listings!inner(
            title,
            company_name,
            location
          )
        `)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        toast({
          title: "Error",
          description: "Error al cargar conversaciones",
          variant: "destructive"
        });
        return;
      }

      // Enriquecer datos y calcular mensajes no leídos
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conv: any) => {
          // Contar mensajes no leídos
          const { count: unreadCount } = await supabase
            .from('job_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', profile.id)
            .is('read_at', null);

          return {
            id: conv.id,
            job_id: conv.job_id,
            employer_id: conv.employer_id,
            applicant_id: conv.applicant_id,
            status: conv.status,
            last_message_at: conv.last_message_at,
            last_message_preview: conv.last_message_preview || 'Conversación iniciada',
            created_at: conv.created_at,
            job_title: conv.job_listings?.title || 'Oferta no disponible',
            job_company_name: conv.job_listings?.company_name || '',
            job_location: conv.job_listings?.location || '',
            unread_count: unreadCount || 0
          };
        })
      );

      console.log('Conversations loaded:', enrichedConversations.length);
      setConversations(enrichedConversations);
    } catch (error: any) {
      console.error('Exception loading conversations:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar conversaciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  };

  const getConversationRole = (conversation: Conversation) => {
    return conversation.employer_id === profile?.id ? 'employer' : 'applicant';
  };

  if (!profile?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inicia sesión</h2>
          <p className="text-gray-600">Debes iniciar sesión para ver tus conversaciones.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/empleo">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a ofertas
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Conversaciones</h1>
            <p className="text-gray-600">Gestiona tus contactos de empleo</p>
          </div>
        </div>
      </div>

      {/* Lista de conversaciones */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            Conversaciones Activas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes conversaciones</h3>
              <p className="text-gray-600 mb-4">Aún no has iniciado ninguna conversación sobre ofertas de empleo.</p>
              <Button asChild>
                <Link to="/empleo">
                  Ver ofertas disponibles
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <Link 
                    to={`/empleo/conversaciones/${conversation.id}`}
                    className="block p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {conversation.job_title}
                          </h3>
                          {conversation.unread_count! > 0 && (
                            <Badge variant="default" className="bg-blue-600">
                              {conversation.unread_count} nuevo{conversation.unread_count! > 1 ? 's' : ''}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {getConversationRole(conversation) === 'employer' ? 'Como empleador' : 'Como candidato'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {conversation.job_company_name}
                          </div>
                          {conversation.job_location && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {conversation.job_location}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 truncate mb-2">
                          {conversation.last_message_preview}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end ml-4">
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(conversation.last_message_at)}
                        </div>
                        <Badge 
                          variant={conversation.status === 'open' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {conversation.status === 'open' ? 'Activa' : 'Cerrada'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmpleoConversaciones;
