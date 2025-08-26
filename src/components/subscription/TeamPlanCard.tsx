import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Crown, Calculator, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeamPlanCardProps {
  onPlanSelect?: () => void;
}

export const TeamPlanCard = ({ onPlanSelect }: TeamPlanCardProps) => {
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
      <CardHeader className="text-center pb-4">
        <Badge className="bg-amber-600 text-white w-fit mx-auto mb-2">
          Plan Team
        </Badge>
        <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl text-amber-800">Plan Team farmapro</CardTitle>
        <CardDescription className="text-amber-700">
          Ideal para equipos de farmacia. Combina múltiples planes Premium y Profesional con 15% de descuento.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6 p-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Plan de Equipo
            </h3>
            <p className="text-sm text-muted-foreground">
              Ideal para equipos de farmacia. Combina múltiples planes Premium y Profesional con 15% de descuento.
            </p>
          </div>

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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p><strong>Total del equipo:</strong> {totalSeats} miembros ({totalSeats <= 11 ? '✓' : '✗'} Máximo 11)</p>
              <p><strong>Premium:</strong> {premiumCount} × 39€ = {premiumCount * 39}€</p>
              <p><strong>Profesional:</strong> {professionalCount} × 29€ = {professionalCount * 29}€</p>
            </div>

            {premiumMemberEmails.length > 0 && (
              <div>
                <Label className="text-sm font-medium">
                  Emails miembros Premium (además de ti)
                </Label>
                <div className="space-y-2 mt-2">
                  {premiumMemberEmails.map((email, index) => (
                    <Input
                      key={`premium-${index}`}
                      type="email"
                      placeholder={`Email Premium ${index + 1}`}
                      value={email}
                      onChange={(e) => updatePremiumEmail(index, e.target.value)}
                      className="text-sm"
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
                <div className="space-y-2 mt-2">
                  {professionalMemberEmails.map((email, index) => (
                    <Input
                      key={`professional-${index}`}
                      type="email"
                      placeholder={`Email Profesional ${index + 1}`}
                      value={email}
                      onChange={(e) => updateProfessionalEmail(index, e.target.value)}
                      className="text-sm"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg">
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
          </div>

          <Button 
            onClick={handleCreateTeam}
            disabled={loading || !teamName.trim() || totalSeats > 11 || 
              premiumMemberEmails.some(email => !email.trim()) || 
              professionalMemberEmails.some(email => !email.trim())}
            className="w-full"
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

          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-3">¿Qué incluye?</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Combina planes Premium y Profesional según necesites</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>15% descuento permanente sobre el total</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>El titular siempre obtiene plan Premium</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Facturación centralizada y gestión simple</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Máximo 11 usuarios total por equipo</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};