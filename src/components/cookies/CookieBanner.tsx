
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Settings, Shield, BarChart3, Target, User } from 'lucide-react';
import { useCookieConsent, CookiePreferences } from '@/hooks/useCookieConsent';

export const CookieBanner = () => {
  const {
    showBanner,
    preferences,
    acceptAll,
    acceptNecessary,
    savePreferences,
    setShowBanner,
  } = useCookieConsent();

  const [showDetails, setShowDetails] = useState(false);
  const [tempPreferences, setTempPreferences] = useState<CookiePreferences>(preferences);

  if (!showBanner) return null;

  const handleSaveCustom = () => {
    savePreferences(tempPreferences);
  };

  const handleToggle = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // No se pueden desactivar las necesarias
    setTempPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Configuración de Cookies</CardTitle>
              <CardDescription className="mt-2">
                Utilizamos cookies para mejorar tu experiencia en farmapro. 
                Puedes gestionar tus preferencias de cookies aquí.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBanner(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showDetails ? (
            <>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  De acuerdo con la legislación española y europea (GDPR), necesitamos tu consentimiento 
                  para usar cookies no esenciales. Las cookies nos ayudan a:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Analizar el uso del sitio web</li>
                  <li>Personalizar contenido y anuncios</li>
                  <li>Recordar tus preferencias</li>
                  <li>Mejorar la funcionalidad del sitio</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={acceptAll} className="flex-1">
                  Aceptar todas
                </Button>
                <Button onClick={acceptNecessary} variant="outline" className="flex-1">
                  Solo necesarias
                </Button>
                <Button 
                  onClick={() => setShowDetails(true)} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Personalizar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Cookies Necesarias</h4>
                      <p className="text-sm text-gray-600">
                        Esenciales para el funcionamiento básico del sitio web.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Requeridas</Badge>
                    <Switch checked={true} disabled />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Cookies de Análisis</h4>
                      <p className="text-sm text-gray-600">
                        Nos ayudan a entender cómo interactúas con el sitio web.
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={tempPreferences.analytics}
                    onCheckedChange={() => handleToggle('analytics')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Cookies de Marketing</h4>
                      <p className="text-sm text-gray-600">
                        Utilizadas para mostrar anuncios relevantes y medir su efectividad.
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={tempPreferences.marketing}
                    onCheckedChange={() => handleToggle('marketing')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Cookies de Preferencias</h4>
                      <p className="text-sm text-gray-600">
                        Guardan tus preferencias y configuraciones personalizadas.
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={tempPreferences.preferences}
                    onCheckedChange={() => handleToggle('preferences')}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleSaveCustom} className="flex-1">
                  Guardar preferencias
                </Button>
                <Button 
                  onClick={() => setShowDetails(false)} 
                  variant="outline"
                  className="flex-1"
                >
                  Volver
                </Button>
              </div>
            </>
          )}

          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>
              Para más información sobre nuestro uso de cookies, consulta nuestra{' '}
              <a href="/politica-cookies" className="text-primary hover:underline">
                Política de Cookies
              </a>{' '}
              y{' '}
              <a href="/politica-privacidad" className="text-primary hover:underline">
                Política de Privacidad
              </a>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
