import { motion, AnimatePresence } from 'framer-motion';
import { Copy, RefreshCw, MessageSquarePlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ContentType } from '@/hooks/useCreativeChat';
import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ResultsAreaProps {
  messages: Message[];
  isLoading: boolean;
  contentType: ContentType;
  onRegenerate: () => void;
  onAdjust: (adjustment: string) => void;
}

export const ResultsArea = ({ messages, isLoading, contentType, onRegenerate, onAdjust }: ResultsAreaProps) => {
  const { toast } = useToast();
  const [adjustInput, setAdjustInput] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copiado', description: 'Contenido copiado al portapapeles' });
  };

  const handleAdjust = () => {
    if (adjustInput.trim()) {
      onAdjust(adjustInput);
      setAdjustInput('');
      setShowAdjust(false);
    }
  };

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');

  const renderContent = (content: string) => {
    if (contentType === 'carousel') return renderCarouselContent(content);
    if (contentType === 'reel-script') return renderReelContent(content);
    return <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">{content}</pre>;
  };

  const renderCarouselContent = (content: string) => {
    const slideRegex = /(?:slide|diapositiva)\s*(\d+)/gi;
    const parts = content.split(slideRegex);

    if (parts.length <= 1) {
      return <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">{content}</pre>;
    }

    const slides: { number: string; content: string }[] = [];
    for (let i = 1; i < parts.length; i += 2) {
      slides.push({ number: parts[i], content: (parts[i + 1] || '').trim() });
    }

    return (
      <div className="space-y-3">
        {parts[0]?.trim() && (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700 mb-4">{parts[0].trim()}</pre>
        )}
        {slides.map((slide, i) => (
          <div key={i} className="rounded-lg bg-green-50 ring-1 ring-green-200 p-4">
            <div className="text-xs font-bold text-green-600 mb-2">SLIDE {slide.number}</div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">{slide.content}</pre>
          </div>
        ))}
      </div>
    );
  };

  const renderReelContent = (content: string) => {
    const sections = ['GANCHO', 'DESARROLLO', 'CIERRE'];
    const hasStructure = sections.some(s => content.toUpperCase().includes(s));

    if (!hasStructure) {
      return <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">{content}</pre>;
    }

    const colors: Record<string, string> = {
      GANCHO: 'bg-amber-50 ring-amber-200 text-amber-700',
      DESARROLLO: 'bg-blue-50 ring-blue-200 text-blue-700',
      CIERRE: 'bg-green-50 ring-green-200 text-green-700',
    };

    const regex = /(GANCHO|DESARROLLO|CIERRE)[:\s]*/gi;
    const parts = content.split(regex);
    const result: { label: string; text: string }[] = [];

    for (let i = 1; i < parts.length; i += 2) {
      result.push({ label: parts[i].toUpperCase(), text: (parts[i + 1] || '').trim() });
    }

    return (
      <div className="space-y-3">
        {parts[0]?.trim() && (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700 mb-4">{parts[0].trim()}</pre>
        )}
        {result.map((section, i) => (
          <div key={i} className={`rounded-lg ring-1 p-4 ${colors[section.label] || 'bg-gray-50 ring-gray-200 text-gray-700'}`}>
            <div className="text-xs font-bold mb-2">{section.label}</div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">{section.text}</pre>
          </div>
        ))}
      </div>
    );
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="min-h-[500px] rounded-xl border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-center p-8">
        <Sparkles className="h-12 w-12 text-green-300 mb-4" />
        <p className="text-gray-400 text-lg font-medium">Tu contenido aparecerá aquí</p>
        <p className="text-gray-400 text-sm mt-1">Rellena el formulario y pulsa "Generar contenido"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="min-h-[500px] max-h-[600px] rounded-xl border border-green-100 bg-white p-6">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-4 ${message.role === 'user' ? 'ml-8' : ''}`}
            >
              {message.role === 'user' ? (
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                  <span className="text-xs font-semibold text-gray-400 block mb-1">Tu solicitud</span>
                  <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                </div>
              ) : (
                <div className="rounded-xl ring-1 ring-green-100 bg-white p-5 shadow-sm">
                  <span className="text-xs font-semibold text-green-600 block mb-3">✨ Contenido generado</span>
                  {renderContent(message.content)}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && !lastAssistant?.content && (
          <div className="flex items-center gap-2 text-green-500 p-4">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-bounce" />
            <div className="h-2 w-2 rounded-full bg-green-400 animate-bounce [animation-delay:150ms]" />
            <div className="h-2 w-2 rounded-full bg-green-400 animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </ScrollArea>

      {lastAssistant && !isLoading && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => handleCopy(lastAssistant.content)}
            className="text-green-700 border-green-200 hover:bg-green-50"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar contenido
          </Button>
          <Button variant="outline" onClick={onRegenerate} className="text-gray-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAdjust(!showAdjust)}
            className="text-gray-600"
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Ajustar
          </Button>
        </div>
      )}

      {showAdjust && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex gap-2"
        >
          <Input
            value={adjustInput}
            onChange={e => setAdjustInput(e.target.value)}
            placeholder="Describe los cambios que quieres..."
            onKeyDown={e => e.key === 'Enter' && handleAdjust()}
          />
          <Button onClick={handleAdjust} disabled={!adjustInput.trim()} className="bg-green-500 hover:bg-green-600 text-white">
            Enviar
          </Button>
        </motion.div>
      )}
    </div>
  );
};
