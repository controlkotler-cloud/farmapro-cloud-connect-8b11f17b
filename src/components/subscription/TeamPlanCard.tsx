import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Crown, Calculator, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface TeamPlanCardProps {
  onPlanSelect?: () => void;
}

export const TeamPlanCard = ({ onPlanSelect }: TeamPlanCardProps) => {
  const isMobile = useIsMobile();
  const [premiumCount, setPremiumCount] = useState(1); // Includes owner
  const [professionalCount, setProfessionalCount] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [premiumMemberEmails, setPremiumMemberEmails] = useState<string[]>([]);
  const [professionalMemberEmails, setProfessionalMemberEmails] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  // Calculate price based on premium and professional counts
  const calculatePrice = (premiumMembers: number, professionalMembers: number) => {
    const premiumPrice = 39;
    const professionalPrice = 29;
    const subtotal = (premiumMembers * premiumPrice) + (professionalMembers * professionalPrice);
    const discount = Math.round(subtotal * 0.15);
    const total = subtotal - discount;
    
    return { subtotal, discount, total };
  };

  const currentPrice = calculatePrice(premiumCount, professionalCount);
  const totalSeats = premiumCount + professionalCount;

  // Handle premium count changes (minimum 1, includes owner)
  const handlePremiumCountChange = (newCount: number) => {
    const validCount = Math.max(1, newCount); // Owner is always premium
    setPremiumCount(validCount);
    
    // Adjust premium emails array (excluding owner)
    const premiumEmailsNeeded = validCount - 1; // Subtract 1 for owner
    const currentEmails = [...premiumMemberEmails];
    if (premiumEmailsNeeded > currentEmails.length) {
      const emailsToAdd = premiumEmailsNeeded - currentEmails.length;
      for (let i = 0; i < emailsToAdd; i++) {
        currentEmails.push('');
      }
    } else if (premiumEmailsNeeded < currentEmails.length) {
      currentEmails.splice(premiumEmailsNeeded);
    }
    setPremiumMemberEmails(currentEmails);
  };

  // Handle professional count changes
  const handleProfessionalCountChange = (newCount: number) => {
    const validCount = Math.max(0, newCount);
    setProfessionalCount(validCount);
    
    // Adjust professional emails array
    const currentEmails = [...professionalMemberEmails];
    if (validCount > currentEmails.length) {
      const emailsToAdd = validCount - currentEmails.length;
      for (let i = 0; i < emailsToAdd; i++) {
        currentEmails.push('');
      }
    } else if (validCount < currentEmails.length) {
      currentEmails.splice(validCount);
    }
    setProfessionalMemberEmails(currentEmails);
  };

  // Update premium email at specific index
  const updatePremiumEmail = (index: number, email: string) => {
    const updatedEmails = [...premiumMemberEmails];
    updatedEmails[index] = email;
    setPremiumMemberEmails(updatedEmails);
  };

  // Update professional email at specific index
  const updateProfessionalEmail = (index: number, email: string) => {
    const updatedEmails = [...professionalMemberEmails];
    updatedEmails[index] = email;
    setProfessionalMemberEmails(updatedEmails);
  };

  // Handle team creation and checkout
  const handleCreateTeam = async () => {
    // Basic validation
    if (!teamName.trim()) {
      toast.error("El nombre del equipo es obligatorio");
      return;
    }

    if (totalSeats > 11) {
      toast.error("Máximo 11 usuarios por equipo (incluyéndote)");
      return;
    }

    // Validate premium emails (excluding owner)
    for (let i = 0; i < premiumMemberEmails.length; i++) {
      const email = premiumMemberEmails[i].trim();
      if (!email) {
        toast.error(`Email del miembro Premium ${i + 1} es obligatorio`);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error(`Email del miembro Premium ${i + 1} no es válido`);
        return;
      }
    }

    // Validate professional emails
    for (let i = 0; i < professionalMemberEmails.length; i++) {
      const email = professionalMemberEmails[i].trim();
      if (!email) {
        toast.error(`Email del miembro Profesional ${i + 1} es obligatorio`);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error(`Email del miembro Profesional ${i + 1} no es válido`);
        return;
      }
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-team-checkout', {
        body: {
          premiumCount,
          professionalCount,
          teamName: teamName.trim(),
          premiumMemberEmails: premiumMemberEmails.map(email => email.trim()),
          professionalMemberEmails: professionalMemberEmails.map(email => email.trim())
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onPlanSelect?.();
      } else {
        throw new Error('No se recibió URL de checkout');
      }
    } catch (error) {
      console.error('Error creating team checkout:', error);
      toast.error('Error al crear el checkout del equipo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className={`text-center ${isMobile ? 'pb-2' : 'pb-4'}`}>
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center`}>
            <Users className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />
          </div>
          <Badge className="bg-amber-600 text-white text-xs">
            Plan Team
          </Badge>
        </div>
        <CardTitle className={`${isMobile ? 'text-xl' : 'text-2xl'} text-amber-800`}>Plan Team farmapro</CardTitle>
        {!isMobile && (
          <CardDescription className="text-amber-700">
            Ideal para equipos de farmacia. Combina múltiples planes Premium y Profesional con 15% de descuento.
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className={isMobile ? 'p-3' : 'p-6'}>
        <div className={isMobile ? 'space-y-4' : 'space-y-6'}>

          <div className="space-y-4">
            <div>
              <Label htmlFor="teamName" className="text-sm font-medium">
                Nombre del equipo
              </Label>
              <Input
                id="teamName"
                type="text"
                placeholder="Ej: Farmacia San Juan"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
              <div>
                <Label htmlFor="premiumCount" className="text-sm font-medium">
                  Miembros Premium (incluido tú)
                </Label>
                <Input
                  id="premiumCount"
                  type="number"
                  min="1"
                  max="11"
                  value={premiumCount}
                  onChange={(e) => handlePremiumCountChange(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tú serás Premium automáticamente
                </p>
              </div>

              <div>
                <Label htmlFor="professionalCount" className="text-sm font-medium">
                  Miembros Profesional
                </Label>
                <Input
                  id="professionalCount"
                  type="number"
                  min="0"
                  max={11 - premiumCount}
                  value={professionalCount}
                  onChange={(e) => handleProfessionalCountChange(parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Acceso profesional completo
                </p>
              </div>
            </div>

            <div className={`text-sm bg-muted ${isMobile ? 'p-2 text-xs' : 'p-3'} rounded-lg`}>
              {isMobile ? (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Equipo:</span>
                    <span className="font-medium">{totalSeats} miembros {totalSeats <= 11 ? '✓' : '✗'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Premium:</span>
                    <span>{premiumCount} × 39€ = {premiumCount * 39}€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Profesional:</span>
                    <span>{professionalCount} × 29€ = {professionalCount * 29}€</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p><strong>Total del equipo:</strong> {totalSeats} miembros ({totalSeats <= 11 ? '✓' : '✗'} Máximo 11)</p>
                  <p><strong>Premium:</strong> {premiumCount} × 39€ = {premiumCount * 39}€</p>
                  <p><strong>Profesional:</strong> {professionalCount} × 29€ = {professionalCount * 29}€</p>
                </div>
              )}
            </div>

            {premiumMemberEmails.length > 0 && (
              <div>
                <Label className="text-sm font-medium">
                  Emails miembros Premium (además de ti)
                </Label>
                <div className={`${isMobile ? 'space-y-2 mt-2' : 'space-y-2 mt-2'}`}>
                  {premiumMemberEmails.map((email, index) => (
                    <Input
                      key={`premium-${index}`}
                      type="email"
                      placeholder={`Email Premium ${index + 1}`}
                      value={email}
                      onChange={(e) => updatePremiumEmail(index, e.target.value)}
                      className={`${isMobile ? 'text-sm h-10' : 'text-sm'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {professionalMemberEmails.length > 0 && (
              <div>
                <Label className="text-sm font-medium">
                  Emails miembros Profesional
                </Label>
                <div className={`${isMobile ? 'space-y-2 mt-2' : 'space-y-2 mt-2'}`}>
                  {professionalMemberEmails.map((email, index) => (
                    <Input
                      key={`professional-${index}`}
                      type="email"
                      placeholder={`Email Profesional ${index + 1}`}
                      value={email}
                      onChange={(e) => updateProfessionalEmail(index, e.target.value)}
                      className={`${isMobile ? 'text-sm h-10' : 'text-sm'}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={`bg-gradient-to-r from-primary/10 to-secondary/10 ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
            {isMobile ? (
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-bold text-foreground">{currentPrice.total}€<span className="text-sm font-normal text-muted-foreground">/mes</span></div>
                  <div className="text-xs text-primary font-medium">15% descuento aplicado</div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Subtotal: {currentPrice.subtotal}€</div>
                  <div>Descuento: -{currentPrice.discount}€</div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {currentPrice.total}€
                </div>
                <div className="text-sm text-muted-foreground">por mes</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Subtotal: {currentPrice.subtotal}€ - Descuento: {currentPrice.discount}€
                </div>
                <div className="text-xs text-primary font-medium mt-1">
                  15% de descuento aplicado
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleCreateTeam}
            disabled={loading || !teamName.trim() || totalSeats > 11 || 
              premiumMemberEmails.some(email => !email.trim()) || 
              professionalMemberEmails.some(email => !email.trim())}
            className={`w-full ${isMobile ? 'h-12 text-base' : ''}`}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              `Crear Equipo - ${currentPrice.total}€/mes`
            )}
          </Button>

          <div className={`bg-white rounded-lg ${isMobile ? 'p-3' : 'p-4'} border border-amber-200`}>
            <h4 className={`font-semibold text-amber-800 ${isMobile ? 'text-sm mb-3' : 'mb-3'}`}>¿Qué incluye?</h4>
            <ul className={`${isMobile ? 'space-y-2 text-xs' : 'space-y-2 text-sm'}`}>
              <li className="flex items-start">
                <div className={`${isMobile ? 'w-4 h-4 mt-0.5 mr-2' : 'w-5 h-5 mr-3'} bg-green-500 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className={isMobile ? 'leading-tight' : ''}>Combina planes Premium y Profesional según necesites</span>
              </li>
              <li className="flex items-start">
                <div className={`${isMobile ? 'w-4 h-4 mt-0.5 mr-2' : 'w-5 h-5 mr-3'} bg-green-500 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className={isMobile ? 'leading-tight' : ''}>15% descuento permanente sobre el total</span>
              </li>
              <li className="flex items-start">
                <div className={`${isMobile ? 'w-4 h-4 mt-0.5 mr-2' : 'w-5 h-5 mr-3'} bg-green-500 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className={isMobile ? 'leading-tight' : ''}>El titular siempre obtiene plan Premium</span>
              </li>
              <li className="flex items-start">
                <div className={`${isMobile ? 'w-4 h-4 mt-0.5 mr-2' : 'w-5 h-5 mr-3'} bg-green-500 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className={isMobile ? 'leading-tight' : ''}>Facturación centralizada y gestión simple</span>
              </li>
              <li className="flex items-start">
                <div className={`${isMobile ? 'w-4 h-4 mt-0.5 mr-2' : 'w-5 h-5 mr-3'} bg-green-500 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className={isMobile ? 'leading-tight' : ''}>Máximo 11 usuarios total por equipo</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};