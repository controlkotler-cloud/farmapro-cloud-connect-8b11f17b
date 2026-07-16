import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreativeChat, CreativeContext } from '@/hooks/useCreativeChat';
import { useIAFarmaDefaults } from '@/hooks/useIAFarmaDefaults';
import { ContentTypeGrid } from './ContentTypeGrid';
import { ContentForm } from './ContentForm';
import { ImageWorkspace } from './ImageWorkspace';
import { PharmacyDefaults } from './PharmacyDefaults';
import { ResultsArea } from './ResultsArea';
import { CONTENT_TYPES } from '@/hooks/useCreativeChat';

export const CreativeWorkspace = () => {
  const {
    messages,
    isLoading,
    contentType,
    setContentType,
    sendMessage,
    regenerate,
    clearChat,
  } = useCreativeChat();

  const { defaults, updateDefault } = useIAFarmaDefaults();

  const selectedInfo = CONTENT_TYPES.find(t => t.id === contentType);

  const handleSubmit = (message: string, context: CreativeContext) => {
    sendMessage(message, context);
  };

  return (
    <div className="space-y-8">
      <PharmacyDefaults defaults={defaults} onChange={updateDefault} />

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">¿Qué quieres crear?</h2>
        <ContentTypeGrid selected={contentType} onSelect={setContentType} />
      </section>

      {contentType === 'imagen' ? (
        <ImageWorkspace defaults={defaults} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <motion.div
            className="lg:col-span-2"
            key={contentType}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-card rounded-xl ring-1 ring-border shadow-sm p-6 sticky top-4">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">{selectedInfo?.icon}</span>
                <h3 className="font-semibold text-foreground">{selectedInfo?.label}</h3>
              </div>

              <ContentForm
                contentType={contentType}
                isLoading={isLoading}
                defaults={defaults}
                onSubmit={handleSubmit}
              />

              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={clearChat}
                  className="w-full mt-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar conversación
                </Button>
              )}
            </div>
          </motion.div>

          <div className="lg:col-span-3">
            <ResultsArea
              messages={messages}
              isLoading={isLoading}
              contentType={contentType}
              onRegenerate={regenerate}
              onAdjust={(adjustment) => sendMessage(`Ajusta el contenido anterior: ${adjustment}`)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
