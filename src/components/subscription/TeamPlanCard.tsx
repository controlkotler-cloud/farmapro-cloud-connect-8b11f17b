
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Users, Crown, Calculator, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TeamPlanCard = () => {
  const [memberCount, setMemberCount] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [memberEmails, setMemberEmails] = useState(['']);
  const [loading, setLoading] = useState(false);

  // Calcular precios
  const premiumPrice = 39;
  const professionalPrice = 29;
  const subtotal = premiumPrice + (memberCount * professionalPrice);
  const discount = Math.round(subtotal * 0.15);
  const totalPrice = subtotal - discount;
  const individualPricesTotal = premiumPrice + (memberCount * premiumPrice);
  const savings = individualPricesTotal - totalPrice;

  const handleMemberCountChange = (increment: boolean) => {
    const newCount = increment ? memberCount + 1 : memberCount - 1;
    if (newCount >= 1 && newCount <= 10) {
      setMemberCount(newCount);
      // Ajustar array de emails
      if (increment) {
        setMemberEmails([...memberEmails, '']);
      } else {
        setMemberEmails(memberEmails.slice(0, -1));
      }
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...memberEmails];
    newEmails[index] = value;
    setMemberEmails(newEmails);
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error('Por favor ingresa el nombre del equipo');
      return;
    }

    const validEmails = memberEmails.filter(email => email.trim() && email.includes('@'));
    if (validEmails.length !== memberCount) {
      toast.error('Por favor completa todos los emails válidos');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-team-checkout', {
        body: { 
          memberCount,
          teamName: teamName.trim(),
          memberEmails: validEmails
        },
      });

      if (error) throw error;

      window.open(data.url, '_blank');
      
      toast.success('Redirigiendo a Stripe para el pago del equipo');
    } catch (error) {
      console.error('Error creating team checkout:', error);
      toast.error('No se pudo procesar el Plan Team. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full"
    >
      <Card className="h-full relative transition-all duration-200 hover:shadow-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-600 text-white px-4 py-1">
          ¡Nuevo! Plan Team
        </Badge>
        
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center">
            <Users className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-amber-900">Plan Team</CardTitle>
          <CardDescription className="text-amber-700">
            Perfecto para equipos de farmacia
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col flex-1 space-y-6">
          {/* Configuración del equipo */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="teamName">Nombre del equipo</Label>
              <Input
                id="teamName"
                placeholder="Ej: Farmacia San Juan"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>

            <div>
              <Label>Miembros del equipo (Profesional)</Label>
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMemberCountChange(false)}
                  disabled={memberCount <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-semibold">{memberCount} miembro{memberCount > 1 ? 's' : ''}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMemberCountChange(true)}
                  disabled={memberCount >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Emails de miembros */}
            <div className="space-y-2">
              <Label>Emails de los miembros</Label>
              {memberEmails.map((email, index) => (
                <Input
                  key={index}
                  placeholder={`Email del miembro ${index + 1}`}
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  type="email"
                />
              ))}
            </div>
          </div>

          {/* Calculadora de precio */}
          <div className="bg-white rounded-lg p-4 border border-amber-200">
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
                <span>{premiumPrice}€</span>
              </div>
              <div className="flex justify-between">
                <span>{memberCount} × Profesional:</span>
                <span>{memberCount * professionalPrice}€</span>
              </div>
              <hr className="border-amber-200" />
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{subtotal}€</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Descuento (15%):</span>
                <span>-{discount}€</span>
              </div>
              <hr className="border-amber-200" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total mensual:</span>
                <span className="text-amber-600">{totalPrice}€</span>
              </div>
              <div className="text-center text-green-600 font-medium">
                💰 Ahorras {savings}€/mes vs planes individuales
              </div>
            </div>
          </div>

          {/* Características */}
          <div className="space-y-3">
            <h4 className="font-semibold text-amber-900">Incluye:</h4>
            <ul className="space-y-2">
              {[
                'Tú: Acceso Premium completo + gestión del equipo',
                'Miembros: Acceso Profesional completo',
                'Facturación centralizada',
                '15% descuento permanente',
                'Gestión fácil de invitaciones',
                'Soporte prioritario para equipos'
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-auto">
            <Button 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleCreateTeam}
              disabled={loading}
            >
              {loading ? 'Procesando...' : `Crear Equipo - ${totalPrice}€/mes`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
