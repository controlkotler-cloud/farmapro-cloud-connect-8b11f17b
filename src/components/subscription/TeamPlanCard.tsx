import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Calculator, Crown, AlertCircle } from 'lucide-react';
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
    const discountedPrice = basePrice * 0.85;
    return discountedPrice;
  };

  const calculateSavings = () => {
    // Sin descuento: Premium (39€) + Profesionales (29€ * cantidad)
    const regularPrice = 39 + (memberCount * 29);
    const teamPrice = calculatePrice();
    return regularPrice - teamPrice;
  };

  const handleMemberCountChange = (value: string) => {
    const count = Math.max(1, Math.min(10, parseInt(value) || 1));
    setMemberCount(count);
    
    // Ajustar array de emails
    const newEmails = Array(count).fill('').map((_, index) => 
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

        {/* Calculadora de precio */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="memberCount">Número de miembros</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calculator className="h-4 w-4 text-amber-600" />
                <Input
                  id="memberCount"
                  type="number"
                  min="1"
                  max="10"
                  value={memberCount}
                  onChange={(e) => handleMemberCountChange(e.target.value)}
                  className="border-amber-200 focus:border-amber-400"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="teamName">Nombre del equipo</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Mi Farmacia"
                className="border-amber-200 focus:border-amber-400 mt-1"
                disabled={!canContractTeamPlan}
              />
            </div>
          </div>

          {/* Emails de miembros */}
          <div>
            <Label>Emails de los miembros del equipo</Label>
            <div className="space-y-2 mt-2">
              {memberEmails.map((email, index) => (
                <Input
                  key={index}
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder={`miembro${index + 1}@farmacia.com`}
                  className="border-amber-200 focus:border-amber-400"
                  disabled={!canContractTeamPlan}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Desglose de precio */}
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-3">Desglose del precio:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>1 × Premium (titular)</span>
              <span>39€/mes</span>
            </div>
            <div className="flex justify-between">
              <span>{memberCount} × Profesional (miembros)</span>
              <span>{memberCount * 29}€/mes</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{39 + (memberCount * 29)}€/mes</span>
            </div>
            <div className="flex justify-between text-green-600 font-medium">
              <span>Descuento 15%</span>
              <span>-{calculateSavings().toFixed(2)}€/mes</span>
            </div>
            <hr className="border-amber-200" />
            <div className="flex justify-between text-lg font-bold text-amber-900">
              <span>Total</span>
              <span>{calculatePrice().toFixed(2)}€/mes</span>
            </div>
          </div>
        </div>

        {/* Beneficios incluidos */}
        <div className="space-y-2">
          <h4 className="font-semibold text-amber-900">Incluye:</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Titular con acceso Premium completo</li>
            <li>• {memberCount} miembro{memberCount > 1 ? 's' : ''} con acceso Profesional</li>
            <li>• Gestión centralizada del equipo</li>
            <li>• 15% de descuento permanente</li>
            <li>• Facturación unificada</li>
          </ul>
        </div>

        {/* Botón de acción */}
        <Button 
          onClick={handleTeamCheckout}
          disabled={loading || !canContractTeamPlan}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          {loading ? (
            'Procesando...'
          ) : needsPremiumUpgrade ? (
            'Requiere Plan Premium'
          ) : (
            `Contratar Plan Team (${calculatePrice().toFixed(2)}€/mes)`
          )}
        </Button>

        {canContractTeamPlan && (
          <p className="text-xs text-center text-amber-700">
            Ahorra {calculateSavings().toFixed(2)}€/mes vs. planes individuales
          </p>
        )}
      </CardContent>
    </Card>
  );
};
