import { useState } from 'react';
import { Send, Image as ImageIcon, Copy, Download, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCreativeChat } from '@/hooks/useCreativeChat';
import { useToast } from '@/hooks/use-toast';

export const CreativePanelContent = () => {
  const [input, setInput] = useState('');
  const { messages, isLoading, contentType, setContentType, sendMessage, generateImage } = useCreativeChat();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    setInput('');
  };

  const handleGenerateImage = async () => {
    if (!input.trim() || isLoading) return;
    const imageUrl = await generateImage(input);
    if (imageUrl) {
      setInput('');
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copiado',
      description: 'Contenido copiado al portapapeles',
    });
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'farmapro-creative-image.png';
    link.click();
  };

  const contentTypes = [
    { value: 'general', label: 'General' },
    { value: 'blog', label: 'Blog' },
    { value: 'social-instagram', label: 'Instagram' },
    { value: 'social-linkedin', label: 'LinkedIn' },
    { value: 'promotion', label: 'Promo' },
  ];

  return (
    <div className="space-y-3">
      <Tabs value={contentType} onValueChange={(value: any) => setContentType(value)}>
        <TabsList className="grid grid-cols-5 w-full h-8">
          {contentTypes.map((type) => (
            <TabsTrigger
              key={type.value}
              value={type.value}
              className="text-xs px-1"
            >
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {messages.length > 0 && (
        <ScrollArea className="h-48 rounded-lg border bg-white p-3">
          <div className="space-y-3">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`text-xs ${
                  message.role === 'user' ? 'text-gray-600' : 'text-gray-900'
                }`}
              >
                {message.role === 'assistant' && message.content.startsWith('http') ? (
                  <div className="space-y-2">
                    <img
                      src={message.content}
                      alt="Generada"
                      className="rounded-lg w-full"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(message.content)}
                      className="w-full"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Descargar
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(message.content)}
                        className="mt-1 h-6 text-xs"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe el contenido que necesitas..."
          className="min-h-[80px] text-sm resize-none"
          disabled={isLoading}
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-1 h-8"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Send className="h-3 w-3 mr-1" />
                Generar
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateImage}
            disabled={isLoading || !input.trim()}
            className="h-8"
            size="sm"
          >
            <ImageIcon className="h-3 w-3" />
          </Button>
        </div>
      </form>
    </div>
  );
};
