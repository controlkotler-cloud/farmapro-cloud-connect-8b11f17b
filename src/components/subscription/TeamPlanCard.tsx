import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Crown, Calculator, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeamPlanCardProps {
  onPlanSelect?: () => void;
}

export const TeamPlanCard = ({ onPlanSelect }: TeamPlanCardProps) => {
  const [memberCount, setMemberCount] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  // Precio base: 39€ (premium titular) + 29€ por cada miembro adicional
  // Con 15% de descuento
  const calculatePrice = (members: number) => {
    const basePrice = 39; // 39€ titular premium
    const memberPrice = 29; // 29€ por miembro profesional
    const subtotal = basePrice + (members * memberPrice);
    const discount = Math.round(subtotal * 0.15); // 15% descuento
    const total = subtotal - discount;
    return { subtotal, discount, total };
  };

  const { subtotal, discount, total } = calculatePrice(memberCount);

  const handleMemberCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > 50) return;
    
    setMemberCount(newCount);
    
    // Ajustar array de emails
    const newEmails = [...memberEmails];
    if (newCount > memberEmails.length) {
      // Agregar campos vacíos
      for (let i = memberEmails.length; i < newCount; i++) {
        newEmails.push('');
      }
    } else {
      // Recortar array
      newEmails.splice(newCount);
    }
    setMemberEmails(newEmails);
  };

  const updateEmail = (index: number, email: string) => {
    const newEmails = [...memberEmails];
    newEmails[index] = email;
    setMemberEmails(newEmails);
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error('El nombre del equipo es obligatorio');
      return;
    }

    // Validar emails
    const filledEmails = memberEmails.filter(email => email.trim());
    if (filledEmails.length !== memberCount) {
      toast.error(`Debes proporcionar exactamente ${memberCount} emails de miembros`);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = filledEmails.filter(email => !emailRegex.test(email.trim()));
    if (invalidEmails.length > 0) {
      toast.error(`Emails inválidos: ${invalidEmails.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-team-checkout', {
        body: { 
          memberCount,
          teamName: teamName.trim(),
          memberEmails: filledEmails.map(email => email.trim())
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
        <Badge className="bg-amber-600 text-white w-fit mx-auto mb-2">
          Plan Team
        </Badge>
        <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl text-amber-800">Plan Team farmapro</CardTitle>
        <CardDescription className="text-amber-700">
          Perfecto para equipos de farmacia
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Nombre del equipo */}
        <div>
          <Label htmlFor="teamName" className="text-sm font-medium text-gray-700 mb-2 block">
            Nombre del equipo
          </Label>
          <Input
            id="teamName"
            type="text"
            placeholder="Ej: Farmacia San Juan"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="border-amber-200"
          />
        </div>

        {/* Miembros del equipo */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Miembros del equipo (Profesional)
          </Label>
          <div className="flex items-center justify-center border border-amber-200 rounded-lg p-4 bg-amber-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMemberCountChange(memberCount - 1)}
              disabled={memberCount <= 1}
              className="h-10 w-10 rounded-l-lg border-amber-200"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center px-4">
              <span className="text-lg font-medium">
                {memberCount} miembro{memberCount !== 1 ? 's' : ''}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMemberCountChange(memberCount + 1)}
              disabled={memberCount >= 50}
              className="h-10 w-10 rounded-r-lg border-amber-200"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Emails de los miembros */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Emails de los miembros
          </Label>
          <div className="space-y-2">
            {memberEmails.map((email, index) => (
              <Input
                key={index}
                type="email"
                placeholder={`Email del miembro ${index + 1}`}
                value={email}
                onChange={(e) => updateEmail(index, e.target.value)}
                className="border-amber-200"
              />
            ))}
          </div>
        </div>

        {/* Calculadora de precio */}
        <div className="bg-white rounded-lg p-4 border-2 border-amber-300">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-amber-600" />
            <h4 className="font-semibold text-amber-800">Cálculo del precio</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-600" />
                Tú (Premium):
              </span>
              <span className="font-medium">39€</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>{memberCount} x Profesional:</span>
              <span className="font-medium">{memberCount * 29}€</span>
            </div>
            
            <hr className="border-amber-200" />
            
            <div className="flex justify-between items-center">
              <span>Subtotal:</span>
              <span className="font-medium">{subtotal}€</span>
            </div>
            
            <div className="flex justify-between items-center text-green-600">
              <span>Descuento (15%):</span>
              <span className="font-medium">-{discount}€</span>
            </div>
            
            <hr className="border-amber-200" />
            
            <div className="flex justify-between items-center text-lg font-bold text-amber-800">
              <span>Total mensual:</span>
              <span>{total}€</span>
            </div>
            
            <div className="text-center mt-3 py-2 bg-green-50 rounded text-green-700 text-sm font-medium">
              💰 Ahorras {discount}€/mes vs planes individuales
            </div>
          </div>
        </div>

        {/* Incluye */}
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-3">Incluye:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Tú: Acceso Premium completo + gestión del equipo</span>
            </li>
            <li className="flex items-center">
              <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Miembros: Acceso Profesional completo</span>
            </li>
            <li className="flex items-center">
              <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Facturación centralizada</span>
            </li>
            <li className="flex items-center">
              <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>15% descuento permanente</span>
            </li>
            <li className="flex items-center">
              <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Gestión fácil de invitaciones</span>
            </li>
            <li className="flex items-center">
              <div className="w-5 h-5 bg-green-500 rounded-full mr-3 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Soporte prioritario para equipos</span>
            </li>
          </ul>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 text-lg"
          onClick={handleCreateTeam}
          disabled={loading}
        >
          {loading ? 'Procesando...' : `Contratar Plan Team (${total}€/mes)`}
        </Button>
      </CardContent>
    </Card>
  );
};