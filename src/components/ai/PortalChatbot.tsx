import { useState } from 'react';
import { MessageCircle, X, Send, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePortalChat } from '@/hooks/usePortalChat';
import { cn } from '@/lib/utils';

export const PortalChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearChat } = usePortalChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await sendMessage(input);
    setInput('');
  };

  const suggestedQuestions = [
    '¿Qué cursos tenéis disponibles?',
    '¿Cómo puedo acceder a los recursos premium?',
    '¿Hay eventos próximos?',
    '¿Qué ofertas de empleo hay?',
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 rounded-full h-14 w-14 bg-ciruela text-primary-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:bg-ciruela/90 hover:shadow-lift z-50"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[min(600px,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lift">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-card p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ciruela-soft">
                <Sparkles className="h-4 w-4 text-ciruela" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight text-foreground">Asistente farmapro</h3>
                <p className="text-xs text-muted-foreground">Te ayuda a moverte por el portal</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  aria-label="Vaciar conversación"
                  className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar el asistente"
                className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  ¡Hola! Soy tu asistente de farmapro. Puedo ayudarte con información sobre cursos, recursos, eventos y más.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Preguntas sugeridas:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(question)}
                        className="rounded-full bg-ciruela-soft px-3 py-1.5 text-xs font-medium text-ciruela ring-1 ring-ciruela/30 transition-colors hover:bg-ciruela-soft/70 active:scale-95"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg p-3 text-sm',
                        message.role === 'user'
                          ? 'bg-secondary text-foreground'
                          : 'bg-card ring-1 ring-border text-foreground'
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card ring-1 ring-border rounded-lg p-3 text-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-ciruela rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-ciruela rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-ciruela rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                aria-label="Enviar"
                className="rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
