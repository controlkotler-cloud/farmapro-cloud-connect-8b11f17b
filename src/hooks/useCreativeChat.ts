import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export type ContentType =
  | 'instagram-post'
  | 'reel-script'
  | 'carousel'
  | 'google-business'
  | 'blog'
  | 'promotion'
  | 'whatsapp';

export interface ContentTypeInfo {
  id: ContentType;
  icon: string;
  label: string;
  description: string;
}

export const CONTENT_TYPES: ContentTypeInfo[] = [
  { id: 'instagram-post', icon: '📱', label: 'Post Instagram', description: 'Copy optimizado para el feed con CTA y sugerencia de imagen' },
  { id: 'reel-script', icon: '🎬', label: 'Guión de Reel', description: 'Script paso a paso: gancho, desarrollo, cierre y texto en pantalla' },
  { id: 'carousel', icon: '📖', label: 'Carrusel Instagram', description: 'Contenido slide por slide para carruseles educativos' },
  { id: 'google-business', icon: '📍', label: 'Post Google Business', description: 'Publicación para tu perfil de Google que mejora tu SEO local' },
  { id: 'blog', icon: '📝', label: 'Artículo Blog', description: 'Artículo SEO de ~800 palabras para la web de tu farmacia' },
  { id: 'promotion', icon: '🎯', label: 'Promoción', description: 'Copy promocional que cumple la normativa farmacéutica' },
  { id: 'whatsapp', icon: '💬', label: 'Mensaje WhatsApp', description: 'Mensaje para enviar a tus clientes (recordatorios, novedades)' },
];

export interface CreativeContext {
  pharmacyName?: string;
  location?: string;
  topic?: string;
  objective?: string;
  tone?: string;
  duration?: string;
  who?: string;
  slides?: number;
  style?: string;
  postType?: string;
  keywords?: string;
  length?: string;
  product?: string;
  discount?: string;
  deadline?: string;
  channel?: string;
  messageType?: string;
  extraInstructions?: string;
}

export const useCreativeChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('instagram-post');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [lastContext, setLastContext] = useState<CreativeContext>({});
  const { toast } = useToast();

  const sendMessage = useCallback(async (userMessage: string, context?: CreativeContext) => {
    if (!userMessage.trim()) return;

    const ctx = context || lastContext;
    setLastUserMessage(userMessage);
    setLastContext(ctx);

    const newUserMessage: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Sesión expirada. Por favor, vuelve a iniciar sesión.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-creative-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, newUserMessage],
            contentType,
            context: ctx,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = 'Error al procesar la solicitud';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) { /* ignore */ }

        if (response.status === 403) errorMessage = 'No tienes acceso a esta funcionalidad. Necesitas un plan Premium, Profesional o Admin activo.';
        else if (response.status === 401) errorMessage = 'Sesión expirada. Por favor, vuelve a iniciar sesión.';
        else if (response.status === 429) errorMessage = 'Límite de uso excedido. Por favor, intenta de nuevo en unos momentos.';
        else if (response.status === 402) errorMessage = 'Créditos insuficientes. Por favor, contacta con soporte.';

        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (!reader) throw new Error('No se pudo leer la respuesta');

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantMessage };
                return newMessages;
              });
            }
          } catch (e) {
            // Put back incomplete JSON
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantMessage };
                return newMessages;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al enviar el mensaje',
        variant: 'destructive',
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, contentType, toast, lastContext]);

  const regenerate = useCallback(() => {
    if (lastUserMessage) {
      setMessages(prev => prev.slice(0, -2));
      sendMessage(lastUserMessage, lastContext);
    }
  }, [lastUserMessage, lastContext, sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setLastUserMessage('');
    setLastContext({});
  }, []);

  return {
    messages,
    isLoading,
    contentType,
    setContentType,
    sendMessage,
    regenerate,
    clearChat,
    lastUserMessage,
  };
};
