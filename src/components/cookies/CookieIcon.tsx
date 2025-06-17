
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Cookie } from 'lucide-react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export const CookieIcon = () => {
  const { openSettings, hasConsent } = useCookieConsent();

  // Solo mostrar el icono si ya se ha dado consentimiento
  if (!hasConsent()) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={openSettings}
            size="sm"
            className="fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          >
            <Cookie className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Configurar cookies</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
