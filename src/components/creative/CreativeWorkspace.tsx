import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreativeChat, CreativeContext } from '@/hooks/useCreativeChat';
import { ContentTypeGrid } from './ContentTypeGrid';
import { ContentForm } from './ContentForm';
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

  const selectedInfo = CONTENT_TYPES.find(t => t.id === contentType);

  const handleSubmit = (message: string, context: CreativeContext) => {
    sendMessage(message, context);
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">¿Qué quieres crear?</h2>
        <ContentTypeGrid selected={contentType} onSelect={setContentType} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <motion.div
          className="lg:col-span-2"
          key={contentType}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white rounded-xl ring-1 ring-gray-100 shadow-sm p-6 sticky top-4">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xl">{selectedInfo?.icon}</span>
              <h3 className="font-semibold text-gray-800">{selectedInfo?.label}</h3>
            </div>

            <ContentForm
              contentType={contentType}
              isLoading={isLoading}
              onSubmit={handleSubmit}
            />

            {messages.length > 0 && (
              <Button
                variant="ghost"
                onClick={clearChat}
                className="w-full mt-4 text-red-500 hover:text-red-600 hover:bg-red-50"
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
    </div>
  );
};
