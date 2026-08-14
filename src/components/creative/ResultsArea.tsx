import { motion, AnimatePresence } from 'framer-motion';
import { Copy, RefreshCw, MessageSquarePlus, Sparkles, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ContentType } from '@/hooks/useCreativeChat';
import { useState } from 'react';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ResultsAreaProps {
  messages: Message[];
  isLoading: boolean;
  contentType: ContentType;
  onRegenerate: () => void;
  onAdjust: (adjustment: string) => void;
  /** Salta al workspace de imagen con la sugerencia como brief precargado. */
  onCreateImage?: (brief: string) => void;
  /** Textos de prueba restantes este mes (solo plan Gratis; null = sin límite). */
  textsRemaining?: number | null;
}

/**
 * Separa la "SUGERENCIA DE IMAGEN:" del contenido principal. Así el botón
 * "Copiar contenido" copia SOLO la pieza (antes la farmacia pegaba en
 * Instagram/WhatsApp el bloque de la sugerencia) y la sugerencia se vuelve
 * accionable con el botón "Crear esta imagen".
 */
const splitImageSuggestion = (content: string): { main: string; suggestion: string | null } => {
  const match = /SUGERENCIA DE IMAGEN\s*:/i.exec(content);
  if (!match) return { main: content, suggestion: null };
  const main = content.slice(0, match.index).trimEnd();
  const suggestion = content.slice(match.index + match[0].length).trim();
  return { main, suggestion: suggestion || null };
};

export const ResultsArea = ({ messages, isLoading, contentType, onRegenerate, onAdjust, onCreateImage, textsRemaining }: ResultsAreaProps) => {
  const { toast } = useToast();
  const [adjustInput, setAdjustInput] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(splitImageSuggestion(content).main);
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
    return <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{content}</pre>;
  };

  const renderCarouselContent = (content: string) => {
    const slideRegex = /(?:slide|diapositiva)\s*(\d+)/gi;
    const parts = content.split(slideRegex);

    if (parts.length <= 1) {
      return <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{content}</pre>;
    }

    const slides: { number: string; content: string }[] = [];
    for (let i = 1; i < parts.length; i += 2) {
      slides.push({ number: parts[i], content: (parts[i + 1] || '').trim() });
    }

    return (
      <div className="space-y-3">
        {parts[0]?.trim() && (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground mb-4">{parts[0].trim()}</pre>
        )}
        {slides.map((slide) => (
          <div key={`slide-${slide.number}`} className="rounded-lg bg-ciruela-soft ring-1 ring-ciruela/20 p-4">
            <div className="text-xs font-bold text-ciruela mb-2">SLIDE {slide.number}</div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{slide.content}</pre>
          </div>
        ))}
      </div>
    );
  };

  const renderReelContent = (content: string) => {
    const sections = ['GANCHO', 'DESARROLLO', 'CIERRE'];
    const hasStructure = sections.some(s => content.toUpperCase().includes(s));

    if (!hasStructure) {
      return <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{content}</pre>;
    }

    const colors: Record<string, string> = {
      GANCHO: 'bg-ciruela-soft ring-ciruela/30 text-ciruela',
      DESARROLLO: 'bg-muted ring-border text-foreground',
      CIERRE: 'bg-secondary ring-border text-secondary-foreground',
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
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground mb-4">{parts[0].trim()}</pre>
        )}
        {result.map((section) => (
          <div key={section.label} className={`rounded-lg ring-1 p-4 ${colors[section.label] || 'bg-muted ring-border text-foreground'}`}>
            <div className="text-xs font-bold mb-2">{section.label}</div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{section.text}</pre>
          </div>
        ))}
      </div>
    );
  };

  const renderAssistantMessage = (content: string) => {
    const { main, suggestion } = splitImageSuggestion(content);
    return (
      <>
        {renderContent(main)}
        {suggestion && (
          <div className="mt-4 rounded-lg bg-ciruela-soft ring-1 ring-ciruela/20 p-4">
            <span className="text-xs font-semibold text-ciruela block mb-1.5">Sugerencia de imagen</span>
            <p className="text-sm text-muted-foreground leading-relaxed">{suggestion}</p>
            {onCreateImage && (
              <button
                type="button"
                onClick={() => onCreateImage(suggestion)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ciruela hover:text-ciruela/80 underline underline-offset-2"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Crear esta imagen con IAFarma (gasta 1 crédito)
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="min-h-[500px] rounded-lg border border-dashed border-border bg-secondary/50 flex flex-col items-center justify-center text-center p-8">
        <Sparkles className="h-12 w-12 text-ciruela/60 mb-4" />
        <p className="text-muted-foreground text-lg font-medium">Tu contenido aparecerá aquí</p>
        <p className="text-muted-foreground text-sm mt-1">Rellena el formulario y pulsa "Generar contenido"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[600px] rounded-lg border border-border bg-card p-6">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id ?? `msg-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-4 ${message.role === 'user' ? 'ml-8' : ''}`}
            >
              {message.role === 'user' ? (
                <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                  <span className="text-xs font-semibold text-muted-foreground block mb-1">Tu solicitud</span>
                  <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                </div>
              ) : (
                <div className="rounded-lg ring-1 ring-border bg-card p-5 shadow-sm">
                  <span className="text-xs font-semibold text-ciruela block mb-3">Contenido generado</span>
                  {renderAssistantMessage(message.content)}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && !lastAssistant?.content && (
          <div className="flex items-center gap-2 text-ciruela p-4">
            <div className="h-2 w-2 rounded-full bg-ciruela animate-bounce" />
            <div className="h-2 w-2 rounded-full bg-ciruela animate-bounce [animation-delay:150ms]" />
            <div className="h-2 w-2 rounded-full bg-ciruela animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </ScrollArea>

      {lastAssistant && !isLoading && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleCopy(lastAssistant.content)}
            className="text-ciruela border-ciruela/30 hover:bg-ciruela-soft"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar contenido
          </Button>
          <Button variant="outline" onClick={onRegenerate} className="text-muted-foreground">
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAdjust(!showAdjust)}
            className="text-muted-foreground"
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Ajustar
          </Button>
          {typeof textsRemaining === 'number' && (
            <span className="inline-flex items-center rounded-full bg-ciruela-soft px-3 py-1 text-xs font-bold tabular-nums text-ciruela">
              {textsRemaining > 0
                ? `Te ${textsRemaining === 1 ? 'queda' : 'quedan'} ${textsRemaining} ${textsRemaining === 1 ? 'texto' : 'textos'} gratis este mes`
                : 'Has usado tus 2 textos gratis de este mes'}
            </span>
          )}
          {textsRemaining === 0 && (
            <Button asChild variant="outline" size="sm" className="border-ciruela text-ciruela hover:bg-ciruela-soft">
              <Link to="/precios">Hazte Plus: sin límite</Link>
            </Button>
          )}
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
          <Button onClick={handleAdjust} disabled={!adjustInput.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Enviar
          </Button>
        </motion.div>
      )}
    </div>
  );
};
