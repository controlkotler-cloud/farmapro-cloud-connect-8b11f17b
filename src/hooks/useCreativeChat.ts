import { useState, useCallback, createElement, type ReactNode } from 'react';
import { MessageSquareReply, Image, Instagram, Clapperboard, GalleryHorizontalEnd, MapPin, PenLine, BadgePercent, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
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
  | 'whatsapp'
  | 'responder-resena'
  | 'imagen';

export interface ContentTypeInfo {
  id: ContentType;
  icon: ReactNode;
  label: string;
  description: string;
}

export const CONTENT_TYPES: ContentTypeInfo[] = [
  { id: 'instagram-post', icon: createElement(Instagram, { className: 'h-6 w-6' }), label: 'Post Instagram', description: 'Copy optimizado para el feed con CTA y sugerencia de imagen' },
  { id: 'reel-script', icon: createElement(Clapperboard, { className: 'h-6 w-6' }), label: 'Guión de reel', description: 'Script paso a paso: gancho, desarrollo, cierre y texto en pantalla' },
  { id: 'carousel', icon: createElement(GalleryHorizontalEnd, { className: 'h-6 w-6' }), label: 'Carrusel Instagram', description: 'Contenido slide por slide para carruseles educativos' },
  { id: 'google-business', icon: createElement(MapPin, { className: 'h-6 w-6' }), label: 'Post Google Business', description: 'Publicación para tu perfil de Google que mejora tu SEO local' },
  { id: 'blog', icon: createElement(PenLine, { className: 'h-6 w-6' }), label: 'Artículo blog', description: 'Artículo SEO para la web de tu farmacia, con la longitud que elijas' },
  { id: 'promotion', icon: createElement(BadgePercent, { className: 'h-6 w-6' }), label: 'Promoción', description: 'Copy promocional para parafarmacia, dermo y servicios' },
  { id: 'whatsapp', icon: createElement(MessageCircle, { className: 'h-6 w-6' }), label: 'Mensaje WhatsApp', description: 'Mensaje para enviar a tus clientes (recordatorios, novedades)' },
  { id: 'responder-resena', icon: createElement(MessageSquareReply, { className: 'h-6 w-6' }), label: 'Responder reseña', description: 'Respuesta profesional y empática a una reseña de Google' },
  { id: 'imagen', icon: createElement(Image, { className: 'h-6 w-6' }), label: 'Imagen', description: 'Genera una imagen para tus publicaciones' },
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
  reviewText?: string;
  reviewStars?: string;
  reviewTone?: string;
  extraInstructions?: string;
}

// Mensajes de RESPALDO por código HTTP. Solo se usan si el servidor no envía
// su propio mensaje (errorData.error): antes machacaban siempre al servidor y
// citaban planes que ya no existen ("Premium, Profesional").
const FALLBACK_BY_STATUS: Record<number, string> = {
  401: 'Sesión expirada. Por favor, vuelve a iniciar sesión.',
  402: 'Has usado los 2 textos al mes de tu plan Gratis. Mira los planes para seguir generando.',
  403: 'Tu periodo de prueba ha terminado. Mira los planes para seguir creando contenido con IAFarma.',
  429: 'Has alcanzado el tope de uso de hoy. Inténtalo de nuevo mañana.',
};

export interface UseCreativeChatOptions {
  /** Se llama con cada texto terminado (para el historial y el contador de cupo). */
  onGenerated?: (contentType: ContentType, brief: string, output: string) => void;
  /** Se llama cuando el servidor rechaza por cupo (402/429): la UI enseña el estado, no un toast rojo. */
  onQuotaExceeded?: () => void;
}

export const useCreativeChat = (options: UseCreativeChatOptions = {}) => {
  const { onGenerated, onQuotaExceeded } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('instagram-post');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [lastContext, setLastContext] = useState<CreativeContext>({});
  /** Textos de prueba que quedan este mes (solo plan Gratis; null = ilimitado/desconocido). */
  const [textsRemaining, setTextsRemaining] = useState<number | null>(null);
  const { toast } = useToast();

  /**
   * Envía un mensaje. `baseMessages` permite fijar explícitamente el historial
   * sobre el que se construye la petición (lo usa `regenerate` para no arrastrar
   * la respuesta anterior por culpa del closure obsoleto).
   */
  const sendMessage = useCallback(async (userMessage: string, context?: CreativeContext, baseMessages?: Message[]) => {
    if (!userMessage.trim()) return;

    const ctx = context || lastContext;
    const history = baseMessages ?? messages;
    setLastUserMessage(userMessage);
    setLastContext(ctx);

    const newUserMessage: Message = { id: crypto.randomUUID(), role: 'user', content: userMessage };
    setMessages([...history, newUserMessage]);
    setIsLoading(true);

    // Se declara FUERA del try: el catch necesita saber si el hueco del
    // asistente llegó a crearse. Si el error salta antes (sesión caducada, 402,
    // 429), no hay nada que retirar y el `slice(0, -1)` de la v1 borraba el
    // mensaje del propio usuario (fix 07-09-2026).
    let assistantId: string | null = null;
    let quotaExceeded = false;

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
            messages: [...history, newUserMessage].map(({ role, content }) => ({ role, content })),
            contentType,
            context: ctx,
          }),
        }
      );

      if (!response.ok) {
        // Prioridad: el mensaje del servidor (es específico y actualizado);
        // el mapa por estado es solo el respaldo si no llega JSON.
        let errorMessage = FALLBACK_BY_STATUS[response.status] || 'Error al procesar la solicitud';
        try {
          const errorData = await response.json();
          if (errorData?.error) errorMessage = errorData.error;
        } catch (e) { /* sin cuerpo JSON: se queda el respaldo */ }
        if (response.status === 402) setTextsRemaining(0);
        if (response.status === 402 || response.status === 429) {
          // Cupo agotado: no es un error del sistema. La UI (contador, formulario
          // bloqueado con CTA) ya lo explica; un toast rojo "Error" asustaba
          // (lo vio Francesc 08-09-2026).
          quotaExceeded = true;
          onQuotaExceeded?.();
        }
        throw new Error(errorMessage);
      }

      // Contador de textos de la prueba (cabecera solo presente en free_trial).
      const remainingHeader = response.headers.get('x-iafarma-texts-remaining');
      if (remainingHeader !== null) {
        const parsed = Number(remainingHeader);
        if (Number.isFinite(parsed)) setTextsRemaining(parsed);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (!reader) throw new Error('No se pudo leer la respuesta');

      assistantId = crypto.randomUUID();
      setMessages(prev => [...prev, { id: assistantId as string, role: 'assistant', content: '' }]);

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
                newMessages[newMessages.length - 1] = { id: assistantId, role: 'assistant', content: assistantMessage };
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
                newMessages[newMessages.length - 1] = { id: assistantId, role: 'assistant', content: assistantMessage };
                return newMessages;
              });
            }
          } catch { /* ignore */ }
        }
      }

      if (assistantMessage.trim()) onGenerated?.(contentType, userMessage, assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      if (quotaExceeded) {
        toast({
          title: 'Has usado los textos de tu plan',
          description: error instanceof Error ? error.message : 'Mira los planes para seguir generando.',
        });
      } else {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Error al enviar el mensaje',
          variant: 'destructive',
        });
      }
      // Retira SOLO el hueco vacío del asistente, y solo si existe y sigue vacío.
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (assistantId && last?.id === assistantId && !last.content) return prev.slice(0, -1);
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, contentType, toast, lastContext, onGenerated, onQuotaExceeded]);

  const regenerate = useCallback(() => {
    if (!lastUserMessage) return;
    // Recorta el último intercambio Y pásalo explícitamente como base: la v1
    // solo recortaba la UI, pero el closure de sendMessage seguía enviando al
    // modelo su respuesta anterior + la misma pregunta duplicada, con lo que
    // tendía a repetirse.
    const base = messages.slice(0, -2);
    sendMessage(lastUserMessage, lastContext, base);
  }, [lastUserMessage, lastContext, sendMessage, messages]);

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
    textsRemaining,
  };
};
