import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCreativeChat } from '@/hooks/useCreativeChat';
import { Copy, Download, ImageIcon, Send, Trash2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const CreativeWorkspace = () => {
  const [input, setInput] = useState('');
  const { toast } = useToast();
  const {
    messages,
    isLoading,
    contentType,
    setContentType,
    sendMessage,
    generateImage,
    clearChat,
  } = useCreativeChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleGenerateImage = async () => {
    if (input.trim()) {
      await generateImage(input);
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
    link.download = 'imagen-generada.png';
    link.click();
  };

  const getContentInfo = () => {
    switch (contentType) {
      case 'blog':
        return {
          title: 'Redacta un post para el blog de tu web',
          description: 'Para que sea más personalizado debes indicar el nombre de tu farmacia, la población y el tema sobre el que quieres escribir.',
          gradient: 'from-purple-500 to-purple-600',
          items: [
            'Nombre de la farmacia',
            'Población/ubicación',
            'Tema específico (ej: temporada de gripe, productos naturales)',
            'Tono deseado (profesional, cercano, educativo)',
          ],
        };
      case 'social-media':
        return {
          title: 'Crea contenido atractivo para tus redes sociales',
          description: 'Genera posts llamativos que conecten con tu comunidad local y promuevan tus servicios farmacéuticos.',
          gradient: 'from-pink-500 to-pink-600',
          items: [
            'Red social específica (Instagram, Facebook, etc.)',
            'Nombre de la farmacia',
            'Producto/servicio a destacar',
          ],
        };
      case 'promotion':
        return {
          title: 'Diseña promociones que impulsen tus ventas',
          description: 'Crea copy promocional persuasivo que destaque tus ofertas y genere urgencia en tus clientes.',
          gradient: 'from-orange-500 to-orange-600',
          items: [
            'Producto/servicio en promoción',
            'Descuento o beneficio específico',
            'Fecha límite de la oferta',
            'Público objetivo',
            'Ubicación de la farmacia',
          ],
        };
      default:
        return null;
    }
  };

  const contentInfo = getContentInfo();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Panel de control */}
      <Card className="lg:col-span-1 p-6 bg-white/80 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-4">Tipo de Contenido</h2>
        
        <Tabs value={contentType} onValueChange={(value) => setContentType(value as any)}>
          <TabsList className="grid grid-cols-1 gap-2 h-auto bg-transparent">
            <TabsTrigger 
              value="blog" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              📝 Blog Post
            </TabsTrigger>
            <TabsTrigger 
              value="social-media"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              📱 Redes Sociales
            </TabsTrigger>
            <TabsTrigger 
              value="promotion"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              🎯 Promoción
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-sm mb-2">💡 Sugerencias</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Sé específico sobre tu audiencia</li>
            <li>• Menciona productos concretos</li>
            <li>• Define el tono deseado</li>
            <li>• Indica el objetivo del contenido</li>
          </ul>
        </div>

        {messages.length > 0 && (
          <Button
            variant="outline"
            onClick={clearChat}
            className="w-full mt-4 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Conversación
          </Button>
        )}
      </Card>

      {/* Sección informativa dinámica */}
      {contentInfo && (
        <Card className="lg:col-span-1 p-6 bg-white/80 backdrop-blur-sm">
          <div className={`bg-gradient-to-r ${contentInfo.gradient} text-white p-4 rounded-lg mb-4`}>
            <h2 className="text-lg font-bold mb-2">{contentInfo.title}</h2>
            <p className="text-sm opacity-90">{contentInfo.description}</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Información necesaria:</h3>
            <ul className="space-y-2">
              {contentInfo.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-purple-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Área de trabajo */}
      <Card className="lg:col-span-2 p-6 bg-white/80 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-4">Contenido Generado</h2>
        
        <ScrollArea className="h-[400px] mb-4 rounded-lg border bg-gray-50 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="h-16 w-16 text-purple-300 mb-4" />
              <p className="text-muted-foreground text-lg">
                Escribe tu solicitud abajo para comenzar a generar contenido
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                La IA generará contenido profesional adaptado a tu farmacia
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 ml-8'
                      : 'bg-white shadow-sm mr-8'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {message.role === 'user' ? '👤 Tú' : '🤖 Asistente IA'}
                    </span>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(message.content)}
                        className="h-6 px-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {message.content.startsWith('data:image') ? (
                    <div className="space-y-2">
                      <img
                        src={message.content}
                        alt="Generated"
                        className="rounded-lg max-w-full shadow-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(message.content)}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar Imagen
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe el contenido que necesitas generar..."
            className="min-h-[120px] resize-none"
            disabled={isLoading}
          />
          
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generar Contenido
                </>
              )}
            </Button>
            
            <Button
              type="button"
              onClick={handleGenerateImage}
              disabled={isLoading || !input.trim()}
              variant="outline"
              className="border-purple-300 hover:bg-purple-50"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Generar Imagen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
