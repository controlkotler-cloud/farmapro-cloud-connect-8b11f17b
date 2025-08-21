
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, ArrowLeft, Building2, MapPin, User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

interface ConversationDetails {
  id: string;
  job_id: string;
  employer_id: string;
  applicant_id: string;
  status: string;
  last_message_at: string;
  job_title: string;
  job_company_name: string;
  job_location: string;
  job_description: string;
}

const EmpleoConversacion = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId && profile?.id) {
      loadConversation();
      loadMessages();
      markAsRead();
    }
  }, [conversationId, profile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    if (!conversationId) return;

    try {
      console.log('Loading conversation details:', conversationId);
      
      const { data, error } = await supabase
        .from('job_conversations')
        .select(`
          *,
          job_listings!inner(
            title,
            company_name,
            location,
            description
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error loading conversation:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la conversación",
          variant: "destructive"
        });
        return;
      }

      const conversationDetails: ConversationDetails = {
        id: data.id,
        job_id: data.job_id,
        employer_id: data.employer_id,
        applicant_id: data.applicant_id,
        status: data.status,
        last_message_at: data.last_message_at,
        job_title: data.job_listings?.title || 'Oferta no disponible',
        job_company_name: data.job_listings?.company_name || '',
        job_location: data.job_listings?.location || '',
        job_description: data.job_listings?.description || ''
      };

      console.log('Conversation loaded:', conversationDetails);
      setConversation(conversationDetails);
    } catch (error: any) {
      console.error('Exception loading conversation:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar conversación",
        variant: "destructive"
      });
    }
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      console.log('Loading messages for conversation:', conversationId);
      
      const { data, error } = await supabase
        .from('job_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error",
          description: "Error al cargar mensajes",
          variant: "destructive"
        });
        return;
      }

      console.log('Messages loaded:', data?.length || 0);
      setMessages(data || []);
    } catch (error: any) {
      console.error('Exception loading messages:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar mensajes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!conversationId) return;

    try {
      const { error } = await supabase
        .rpc('mark_conversation_read', { conversation_id_param: conversationId });

      if (error) {
        console.error('Error marking as read:', error);
      }
    } catch (error) {
      console.error('Exception marking as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!conversationId || !newMessage.trim() || sending) return;

    try {
      setSending(true);
      console.log('Sending message...');

      const { data: messageId, error } = await supabase
        .rpc('send_job_message', {
          conversation_id_param: conversationId,
          body_param: newMessage.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        
        if (error.message.includes('límite de envío')) {
          toast({
            title: "Límite alcanzado",
            description: "Has enviado demasiados mensajes. Intenta en un minuto.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      console.log('Message sent with ID:', messageId);
      
      setNewMessage('');
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido enviado correctamente",
        variant: "default"
      });

      // Recargar mensajes para mostrar el nuevo
      await loadMessages();
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  };

  const isMyMessage = (senderId: string) => {
    return senderId === profile?.id;
  };

  const getUserRole = () => {
    if (!conversation || !profile?.id) return '';
    return conversation.employer_id === profile.id ? 'employer' : 'applicant';
  };

  if (!profile?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso denegado</h2>
          <p className="text-gray-600">Debes iniciar sesión para ver esta conversación.</p>
        </div>
      </div>
    );
  }

  if (!conversation && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Conversación no encontrada</h2>
          <p className="text-gray-600">No tienes acceso a esta conversación o no existe.</p>
          <Button asChild className="mt-4">
            <Link to="/empleo/conversaciones">Volver a conversaciones</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-4xl mx-auto space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/empleo/conversaciones">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Conversaciones
            </Link>
          </Button>
          {conversation && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{conversation.job_title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                <Badge variant="outline" className="text-xs">
                  {getUserRole() === 'employer' ? 'Como empleador' : 'Como candidato'}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Conversación</CardTitle>
                </div>
                {conversation && (
                  <Badge variant={conversation.status === 'open' ? 'default' : 'secondary'}>
                    {conversation.status === 'open' ? 'Activa' : 'Cerrada'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            {/* Messages Area */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aún no hay mensajes en esta conversación</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`flex ${isMyMessage(message.sender_id) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isMyMessage(message.sender_id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                      <div className={`flex items-center justify-between mt-1 text-xs ${
                        isMyMessage(message.sender_id) ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{formatMessageTime(message.created_at)}</span>
                        {isMyMessage(message.sender_id) && (
                          <span>{message.read_at ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </CardContent>
            
            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 min-h-[60px] resize-none"
                  disabled={sending || conversation?.status !== 'open'}
                />
                <Button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim() || conversation?.status !== 'open'}
                  className="px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Presiona Enter para enviar, Shift+Enter para nueva línea
              </p>
            </div>
          </Card>
        </div>

        {/* Job Details Sidebar */}
        <div className="lg:col-span-1">
          {conversation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalles de la Oferta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Empresa</h4>
                  <p className="text-sm">{conversation.job_company_name}</p>
                </div>
                
                {conversation.job_location && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Ubicación</h4>
                    <p className="text-sm">{conversation.job_location}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Descripción</h4>
                  <p className="text-sm text-gray-600 line-clamp-6">
                    {conversation.job_description}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <Button asChild className="w-full" variant="outline">
                    <Link to={`/empleo`}>
                      Ver oferta completa
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EmpleoConversacion;
