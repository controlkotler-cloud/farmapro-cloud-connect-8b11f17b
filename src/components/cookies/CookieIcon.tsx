
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Cookie } from 'lucide-react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export const CookieIcon = () => {
  const { openSettings, hasConsent } = useCookieConsent();

  console.log('CookieIcon - hasConsent result:', hasConsent());
  console.log('CookieIcon - localStorage cookie consent:', localStorage.getItem('farmapro_cookie_consent'));

  // Solo mostrar el icono si ya se ha dado consentimiento (al menos una vez)
  if (!hasConsent()) {
    console.log('CookieIcon - Not showing icon because no consent given yet');
    return null;
  }

  console.log('CookieIcon - Rendering cookie icon');

  const handleClick = () => {
    console.log('CookieIcon - Button clicked, calling openSettings');
    openSettings();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            size="sm"
            className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 touch-manipulation select-none"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            <Cookie className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="hidden md:block">
          <p>Configurar cookies</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
