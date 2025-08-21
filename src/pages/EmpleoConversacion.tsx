import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useJobConversations } from '@/hooks/useJobConversations';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, User, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface ConversationDetails {
  id: string;
  job_id: string;
  job_title: string;
  job_company: string;
  other_user_name: string;
  other_user_id: string;
}

const EmpleoConversacion = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { messages, loadMessages, sendMessage } = useJobConversations();
  const { toast } = useToast();
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadConversationDetails();
      loadMessages(id);
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationDetails = async () => {
    if (!id || !profile?.id) return;

    try {
      setLoading(true);
      
      // Get conversation details
      const { data: convData, error: convError } = await supabase
        .from('job_conversations')
        .select('*')
        .eq('id', id)
        .single();

      if (convError || !convData) {
        console.error('Error loading conversation:', convError);
        return;
      }

      // Get job details
      const { data: jobData } = await supabase
        .from('job_listings_public')
        .select('title, company_name')
        .eq('id', convData.job_id)
        .single();

      // Get other user details
      const otherUserId = convData.applicant_id === profile.id ? convData.employer_id : convData.applicant_id;
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', otherUserId)
        .single();

      setConversationDetails({
        id: convData.id,
        job_id: convData.job_id,
        job_title: jobData?.title || 'Empleo eliminado',
        job_company: jobData?.company_name || '',
        other_user_name: userData?.full_name || 'Usuario',
        other_user_id: otherUserId
      });
    } catch (error) {
      console.error('Error loading conversation details:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la conversación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!id || !newMessage.trim() || sending) return;

    setSending(true);
    const success = await sendMessage(id, newMessage);
    
    if (success) {
      setNewMessage('');
    }
    
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Link to="/empleo/conversaciones">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        
        <Card className="h-96 animate-pulse">
          <div className="h-full bg-gray-200 rounded"></div>
        </Card>
      </div>
    );
  }

  if (!conversationDetails) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Link to="/empleo/conversaciones">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Conversación no encontrada</h3>
          <p className="text-gray-600">La conversación que buscas no existe o no tienes acceso a ella.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/empleo/conversaciones">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{conversationDetails.job_title}</h1>
          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 mr-1" />
              {conversationDetails.job_company}
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              {conversationDetails.other_user_name}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Conversación
          </CardTitle>
        </CardHeader>
        
        {/* Messages */}
        <CardContent className="p-0">
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No hay mensajes aún. ¡Inicia la conversación!
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwnMessage = message.sender_id === profile?.id;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.body}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Escribe tu mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 min-h-[40px] max-h-32 resize-none"
                disabled={sending}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmpleoConversacion;