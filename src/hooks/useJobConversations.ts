import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JobConversation {
  id: string;
  job_id: string;
  applicant_id: string;
  employer_id: string;
  status: string;
  last_message_at: string;
  last_message_preview: string;
  created_at: string;
  updated_at: string;
}

interface JobMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at?: string;
}

export const useJobConversations = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<JobConversation[]>([]);
  const [messages, setMessages] = useState<JobMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      loadConversations();
      loadUnreadCount();
      subscribeToConversations();
    }
  }, [profile?.id]);

  const loadConversations = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_conversations')
        .select('*')
        .or(`applicant_id.eq.${profile.id},employer_id.eq.${profile.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_unread_conversations_count', { user_id: profile.id });

      if (error) {
        console.error('Error loading unread count:', error);
        return;
      }

      setUnreadCount(data || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('job_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
      await markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createConversation = async (jobId: string, employerId: string, initialMessage: string) => {
    if (!profile?.id) return null;

    try {
      const { data, error } = await supabase
        .rpc('create_job_conversation', {
          job_id: jobId,
          applicant_id: profile.id,
          employer_id: employerId,
          initial_message: initialMessage
        });

      if (error) {
        console.error('Error creating conversation:', error);
        toast({
          title: "Error",
          description: "No se pudo iniciar la conversación",
          variant: "destructive"
        });
        return null;
      }

      await loadConversations();
      await loadUnreadCount();
      
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const sendMessage = async (conversationId: string, message: string) => {
    if (!profile?.id || !message.trim()) return false;

    try {
      const { error } = await supabase
        .rpc('send_job_message', {
          conversation_id: conversationId,
          sender_id: profile.id,
          message_body: message.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "No se pudo enviar el mensaje",
          variant: "destructive"
        });
        return false;
      }

      await loadMessages(conversationId);
      await loadConversations();
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (!profile?.id) return;

    try {
      await supabase
        .rpc('mark_conversation_as_read', {
          conversation_id: conversationId,
          user_id: profile.id
        });

      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const subscribeToConversations = () => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('job-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_conversations',
          filter: `or(applicant_id.eq.${profile.id},employer_id.eq.${profile.id})`
        },
        () => {
          loadConversations();
          loadUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_messages'
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    conversations,
    messages,
    loading,
    unreadCount,
    loadConversations,
    loadMessages,
    createConversation,
    sendMessage,
    markConversationAsRead
  };
};