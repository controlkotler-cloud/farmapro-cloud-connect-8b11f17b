
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Calculator, Crown, AlertCircle, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TeamPlanCard = () => {
  const { profile } = useAuth();
  const [memberCount, setMemberCount] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [memberEmails, setMemberEmails] = useState(['']);
  const [loading, setLoading] = useState(false);

  const currentPlan = profile?.subscription_role || 'freemium';

  // Verificar si el usuario puede contratar el plan team
  const canContractTeamPlan = currentPlan === 'freemium' || currentPlan === 'premium';
  const needsPremiumUpgrade = currentPlan === 'estudiante' || currentPlan === 'profesional';

  const calculatePrice = () => {
    // Premium titular (39€) + miembros profesionales (29€ cada uno)
    const basePrice = 39 + (memberCount * 29);
    // Aplicar 15% descuento
    const discount = Math.round(basePrice * 0.15);
    const finalPrice = basePrice - discount;
    return { basePrice, discount, finalPrice };
  };

  const handleMemberCountChange = (increment: boolean) => {
    const newCount = increment 
      ? Math.min(10, memberCount + 1) 
      : Math.max(1, memberCount - 1);
    
    setMemberCount(newCount);
    
    // Ajustar array de emails
    const newEmails = Array(newCount).fill('').map((_, index) => 
      memberEmails[index] || ''
    );
    setMemberEmails(newEmails);
  };

  const handleEmailChange = (index: number, email: string) => {
    const newEmails = [...memberEmails];
    newEmails[index] = email;
    setMemberEmails(newEmails);
  };

  const handleUpgradeToPremium = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: 'premium' },
      });

      if (error) throw error;

      window.open(data.url, '_blank');
      
      toast.success('Redirigiendo a actualización Premium');
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      toast.error('No se pudo procesar la actualización');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamCheckout = async () => {
    if (!teamName.trim()) {
      toast.error('Por favor, ingresa el nombre del equipo');
      return;
    }

    const validEmails = memberEmails.filter(email => email.trim() && email.includes('@'));
    if (validEmails.length !== memberCount) {
      toast.error('Por favor, completa todos los emails de los miembros');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-team-checkout', {
        body: {
          memberCount,
          teamName: teamName.trim(),
          memberEmails: validEmails
        }
      });

      if (error) throw error;

      window.open(data.url, '_blank');
      
      toast.success('Redirigiendo al checkout del equipo');
    } catch (error) {
      console.error('Error creating team checkout:', error);
      toast.error('No se pudo procesar la suscripción del equipo');
    } finally {
      setLoading(false);
    }
  };

  const { basePrice, discount, finalPrice } = calculatePrice();

  return (
    <Card className="relative border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1">
          🚀 Plan Team
        </Badge>
      </div>

      <CardHeader className="text-center pb-4 pt-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center">
          <Users className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl text-amber-900">Plan Team farmapro</CardTitle>
        <p className="text-amber-700">Perfecto para equipos de farmacia</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Restricción para usuarios que necesitan Premium */}
        {needsPremiumUpgrade && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  Actualización Requerida
                </h4>
                <p className="text-blue-800 text-sm mb-3">
                  Para acceder al Plan Team, primero necesitas actualizar a Premium. 
                  Después podrás contratar el plan para tu equipo.
                </p>
                <Button 
                  onClick={handleUpgradeToPremium}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {loading ? 'Procesando...' : 'Actualizar a Premium'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Nombre del equipo */}
        <div>
          <Label htmlFor="teamName">Nombre del equipo</Label>
          <Input
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Ej: Farmacia San Juan"
            className="border-amber-200 focus:border-amber-400 mt-1"
            disabled={!canContractTeamPlan}
          />
        </div>

        {/* Miembros del equipo */}
        <div>
          <Label>Miembros del equipo (Profesional)</Label>
          <div className="flex items-center justify-center gap-4 mt-2 p-4 border border-amber-200 rounded-lg bg-white">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMemberCountChange(false)}
              disabled={memberCount <= 1 || !canContractTeamPlan}
              className="h-12 w-12 border-amber-300"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-2xl font-bold text-amber-900 min-w-[120px] text-center">
              {memberCount} miembro{memberCount > 1 ? 's' : ''}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleMemberCountChange(true)}
              disabled={memberCount >= 10 || !canContractTeamPlan}
              className="h-12 w-12 border-amber-300"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Emails de miembros */}
        <div>
          <Label>Emails de los miembros</Label>
          <div className="space-y-2 mt-2">
            {memberEmails.map((email, index) => (
              <Input
                key={index}
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                placeholder={`Email del miembro ${index + 1}`}
                className="border-amber-200 focus:border-amber-400"
                disabled={!canContractTeamPlan}
              />
            ))}
          </div>
        </div>

        {/* Cálculo del precio */}
        <div className="bg-white rounded-lg p-4 border-2 border-amber-300">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-5 w-5 text-amber-600" />
            <h4 className="font-semibold text-amber-900">Cálculo del precio</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Crown className="h-4 w-4 text-amber-600" />
                Tú (Premium):
              </span>
              <span className="font-medium">39€</span>
            </div>
            <div className="flex justify-between">
              <span>{memberCount} × Profesional:</span>
              <span className="font-medium">{memberCount * 29}€</span>
            </div>
            <hr className="border-amber-200" />
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{basePrice}€</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Descuento (15%):</span>
              <span className="font-medium">-{discount}€</span>
            </div>
            <hr className="border-amber-200" />
            <div className="flex justify-between text-lg font-bold text-amber-900">
              <span>Total mensual:</span>
              <span className="text-2xl">{finalPrice}€</span>
            </div>
            <div className="text-center text-sm text-green-600 font-medium">
              💰 Ahorras {basePrice - finalPrice}€/mes vs planes individuales
            </div>
          </div>
        </div>

        {/* Incluye */}
        <div className="space-y-2">
          <h4 className="font-semibold text-amber-900">Incluye:</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              Tú: Acceso Premium completo + gestión del equipo
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              Miembros: Acceso Profesional completo
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              Facturación centralizada
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              15% descuento permanente
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              Gestión fácil de invitaciones
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              Soporte prioritario para equipos
            </li>
          </ul>
        </div>

        {/* Botón de acción */}
        <Button 
          onClick={handleTeamCheckout}
          disabled={loading || !canContractTeamPlan}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-12 text-lg"
        >
          {loading ? (
            'Procesando...'
          ) : needsPremiumUpgrade ? (
            'Requiere Plan Premium'
          ) : (
            `Contratar Plan Team (${finalPrice}€/mes)`
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
