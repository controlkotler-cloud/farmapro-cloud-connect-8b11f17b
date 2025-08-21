import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useJobConversations } from '@/hooks/useJobConversations';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Clock, User, Briefcase, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface JobInfo {
  title: string;
  company_name: string;
}

interface ConversationWithJob {
  id: string;
  job_id: string;
  applicant_id: string;
  employer_id: string;
  status: string;
  last_message_at: string;
  last_message_preview: string;
  created_at: string;
  job_title?: string;
  job_company?: string;
  other_user_name?: string;
}

const EmpleoConversaciones = () => {
  const { profile } = useAuth();
  const { conversations, loading } = useJobConversations();
  const [conversationsWithDetails, setConversationsWithDetails] = useState<ConversationWithJob[]>([]);

  useEffect(() => {
    if (conversations.length > 0) {
      loadConversationDetails();
    }
  }, [conversations]);

  const loadConversationDetails = async () => {
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        try {
          // Get job details
          const { data: jobData } = await supabase
            .from('job_listings_public')
            .select('title, company_name')
            .eq('id', conv.job_id)
            .single();

          // Get other user details
          const otherUserId = conv.applicant_id === profile?.id ? conv.employer_id : conv.applicant_id;
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', otherUserId)
            .single();

          return {
            ...conv,
            job_title: jobData?.title || 'Empleo eliminado',
            job_company: jobData?.company_name || '',
            other_user_name: userData?.full_name || 'Usuario'
          };
        } catch (error) {
          console.error('Error loading conversation details:', error);
          return {
            ...conv,
            job_title: 'Error al cargar',
            job_company: '',
            other_user_name: 'Usuario'
          };
        }
      })
    );

    setConversationsWithDetails(enrichedConversations);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'closed': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Activa';
      case 'closed': return 'Cerrada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center space-x-4">
          <Link to="/empleo">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Empleo
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Conversaciones</h1>
            <p className="text-gray-600">Gestiona tus conversaciones de empleo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/empleo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Empleo
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Conversaciones</h1>
          <p className="text-gray-600">Gestiona tus conversaciones de empleo</p>
        </div>
      </div>

      {/* Conversations List */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Conversaciones Activas
          </CardTitle>
          <CardDescription>
            {conversationsWithDetails.length} conversación{conversationsWithDetails.length !== 1 ? 'es' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {conversationsWithDetails.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay conversaciones</h3>
              <p className="text-gray-600 mb-4">
                Cuando contactes con empleadores o recibas mensajes, aparecerán aquí.
              </p>
              <Link to="/empleo">
                <Button>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Ver Ofertas de Empleo
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {conversationsWithDetails.map((conv, index) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/empleo/conversaciones/${conv.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{conv.job_title}</h3>
                              <Badge variant={getStatusBadgeVariant(conv.status)}>
                                {getStatusLabel(conv.status)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-1" />
                                {conv.job_company}
                              </div>
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {conv.other_user_name}
                              </div>
                            </div>
                            
                            {conv.last_message_preview && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {conv.last_message_preview}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500 ml-4">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(conv.last_message_at)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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