import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Crown, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeamPlanCardProps {
  onPlanSelect?: () => void;
}

export const TeamPlanCard = ({ onPlanSelect }: TeamPlanCardProps) => {
  const [memberCount, setMemberCount] = useState(10);
  const [loading, setLoading] = useState(false);

  // Precio base: 39€ (premium titular) + 29€ por cada miembro adicional
  // Con 15% de descuento
  const calculatePrice = (members: number) => {
    const basePrice = 3900; // 39€ en centavos
    const memberPrice = 2900; // 29€ en centavos por miembro
    const totalPrice = basePrice + (members * memberPrice);
    const discountedPrice = Math.round(totalPrice * 0.85); // 15% descuento
    return discountedPrice / 100; // Convertir a euros
  };

  const totalPrice = calculatePrice(memberCount);
  const savings = (calculatePrice(memberCount) / 0.85) - calculatePrice(memberCount);

  const handleCreateTeam = async () => {
    if (memberCount < 2 || memberCount > 50) {
      toast.error('El número de miembros debe estar entre 2 y 50');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-team-checkout', {
        body: { 
          memberCount,
          returnUrl: window.location.origin + '/perfil?tab=team'
        }
      });
      
      if (error) throw error;
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating team checkout:', error);
      toast.error('Error al procesar la suscripción de equipo. Contacta con soporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl text-amber-800">Plan Team</CardTitle>
        <CardDescription className="text-amber-700">
          Solución completa para equipos de farmacia
        </CardDescription>
        <Badge className="bg-amber-600 text-white w-fit mx-auto">
          15% Descuento incluido
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Calculadora de precio */}
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <Label htmlFor="memberCount" className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4" />
            Número de miembros del equipo
          </Label>
          <Input
            id="memberCount"
            type="number"
            min="2"
            max="50"
            value={memberCount}
            onChange={(e) => setMemberCount(Math.max(2, Math.min(50, parseInt(e.target.value) || 2)))}
            className="mb-3"
          />
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Plan Premium (titular):</span>
              <span>39€</span>
            </div>
            <div className="flex justify-between">
              <span>Miembros ({memberCount} × 29€):</span>
              <span>{memberCount * 29}€</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Descuento (15%):</span>
              <span>-{savings.toFixed(2)}€</span>
            </div>
            <hr className="border-amber-200" />
            <div className="flex justify-between font-bold text-amber-800">
              <span>Total mensual:</span>
              <span>{totalPrice.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {/* Características incluidas */}
        <div>
          <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" />
            ¿Qué incluye?
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
              <span>Plan Premium para el titular</span>
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
              <span>Plan Profesional para todos los miembros</span>
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
              <span>Panel de gestión de equipo</span>
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
              <span>Reportes de progreso grupal</span>
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
              <span>Facturación centralizada</span>
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
              <span>Soporte dedicado</span>
            </li>
          </ul>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          onClick={handleCreateTeam}
          disabled={loading}
        >
          {loading ? 'Procesando...' : `Crear Equipo - ${totalPrice.toFixed(2)}€/mes`}
        </Button>

        <p className="text-xs text-center text-amber-700">
          Facturación mensual. Cancela en cualquier momento.
        </p>
      </CardContent>
    </Card>
  );
};