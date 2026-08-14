import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
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
    textsRemaining,
  } = useCreativeChat();

  const { profile } = useAuth();
  const { defaults, updateDefault } = useIAFarmaDefaults();

  // Semilla del workspace de imagen cuando el usuario pulsa "Crear esta
  // imagen" sobre una sugerencia del asistente de texto: brief (la sugerencia),
  // la publicación completa como contexto y el tipo de pieza más coherente.
  const [imageSeed, setImageSeed] = useState<{ brief: string; sourceText: string; piece: 'promo' | 'post' } | null>(null);

  // Pre-rellena desde el perfil la primera vez (localStorage vacío), para no
  // pedir dos veces el mismo dato. Si ya hay algo guardado aquí (editado a
  // mano en IAFarma), no lo tocamos. El tono también viene del perfil
  // (profiles.iafarma_tone) desde que sincroniza entre dispositivos.
  useEffect(() => {
    if (!defaults.farmacia && profile?.pharmacy_name) {
      updateDefault('farmacia', profile.pharmacy_name);
    }
    if (!defaults.localidad && profile?.pharmacy_city) {
      updateDefault('localidad', profile.pharmacy_city);
    }
    if (!defaults.tono && profile?.iafarma_tone) {
      updateDefault('tono', profile.iafarma_tone);
    }
    if (!defaults.colorPrimario && profile?.iafarma_brand_primary) {
      updateDefault('colorPrimario', profile.iafarma_brand_primary);
    }
    if (!defaults.colorSecundario && profile?.iafarma_brand_secondary) {
      updateDefault('colorSecundario', profile.iafarma_brand_secondary);
    }
    if (!defaults.logoUrl && profile?.iafarma_logo_url) {
      updateDefault('logoUrl', profile.iafarma_logo_url);
    }
  }, [defaults.farmacia, defaults.localidad, defaults.tono, defaults.colorPrimario, defaults.colorSecundario, defaults.logoUrl, profile?.pharmacy_name, profile?.pharmacy_city, profile?.iafarma_tone, profile?.iafarma_brand_primary, profile?.iafarma_brand_secondary, profile?.iafarma_logo_url, updateDefault]);

  const selectedInfo = CONTENT_TYPES.find(t => t.id === contentType);

  const handleSubmit = (message: string, context: CreativeContext) => {
    sendMessage(message, context);
  };

  // Puente texto → imagen: la sugerencia deja de ser un callejón sin salida.
  // Se lleva también la publicación completa para que el copy de la pieza sea
  // coherente con lo ya escrito (no una pieza genérica a partir de una frase).
  const handleCreateImage = (suggestion: string, sourceText: string) => {
    setImageSeed({
      brief: suggestion.slice(0, 200),
      sourceText: sourceText.slice(0, 1500),
      piece: contentType === 'promotion' ? 'promo' : 'post',
    });
    setContentType('imagen');
  };

  return (
    <div className="space-y-8">
      <PharmacyDefaults defaults={defaults} onChange={updateDefault} />

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">¿Qué quieres crear?</h2>
        <ContentTypeGrid selected={contentType} onSelect={setContentType} />
      </section>

      {contentType === 'imagen' ? (
        <ImageWorkspace defaults={defaults} seed={imageSeed} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <motion.div
            className="lg:col-span-2"
            key={contentType}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-card rounded-lg ring-1 ring-border shadow-sm p-6 sticky top-4">
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
              onCreateImage={handleCreateImage}
              textsRemaining={textsRemaining}
              defaults={defaults}
            />
          </div>
        </div>
      )}
    </div>
  );
};
