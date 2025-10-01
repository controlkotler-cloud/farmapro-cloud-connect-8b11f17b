import { useState } from 'react';
import { Wand2, X, Send, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreativeChat, ContentType } from '@/hooks/useCreativeChat';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const CreativeAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, contentType, setContentType, sendMessage, clearChat } = useCreativeChat();
  const { toast } = useToast();
  const { profile } = useAuth();

  // Check if user has access (premium, profesional, or admin)
  const allowedRoles = ['premium', 'profesional', 'admin'];
  const hasAccess = profile && allowedRoles.includes(profile.subscription_role) && profile.subscription_status === 'active';

  // Don't show the button if user doesn't have access
  if (!hasAccess) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await sendMessage(input);
    setInput('');
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copiado',
      description: 'Contenido copiado al portapapeles',
    });
  };

  const contentTemplates = {
    blog: [
      'Escribe un artículo sobre los nuevos medicamentos para la diabetes',
      'Crea un post sobre la importancia de la adherencia terapéutica',
      'Redacta sobre las últimas novedades en atención farmacéutica',
    ],
    'social-media': [
      'Crea un post para promocionar un nuevo servicio de farmacia',
      'Redacta contenido sobre consejos de salud para el verano',
      'Escribe sobre la importancia de la vacunación',
    ],
    promotion: [
      'Crea un copy para promoción de campaña de gripe',
      'Redacta una oferta especial para productos dermocosméticos',
      'Escribe una promoción de servicios de farmacia',
    ],
  };

  const templates = contentTemplates[contentType as keyof typeof contentTemplates] || [];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-24 right-6 rounded-full h-14 w-14 shadow-lg hover:scale-110 transition-transform z-50 bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          <Wand2 className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[500px] h-[700px] bg-background border rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-secondary text-secondary-foreground">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              <h3 className="font-semibold">Asistente Creativo</h3>
            </div>
            <div className="flex gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  className="h-8 w-8 text-secondary-foreground hover:bg-secondary-foreground/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-secondary-foreground hover:bg-secondary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content Type Selector */}
          <Tabs value={contentType} onValueChange={(v) => setContentType(v as ContentType)} className="border-b">
            <TabsList className="w-full justify-start rounded-none h-auto flex-wrap">
              <TabsTrigger value="blog" className="text-xs">Blog</TabsTrigger>
              <TabsTrigger value="social-media" className="text-xs">Redes Sociales</TabsTrigger>
              <TabsTrigger value="promotion" className="text-xs">Promoción</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  ¡Hola! Puedo ayudarte a crear contenido para tu farmacia: posts de blog, redes sociales, promociones e imágenes.
                </p>
                {templates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Templates sugeridos:</p>
                    {templates.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(template)}
                        className="block w-full text-left p-2 text-sm rounded-lg hover:bg-accent transition-colors"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex flex-col gap-2',
                      message.role === 'user' ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[90%] rounded-lg p-3 text-sm',
                        message.role === 'user'
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                    </div>
                    {message.role === 'assistant' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyContent(message.content)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
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
                placeholder="Describe el contenido que necesitas..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
