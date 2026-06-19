import { motion } from 'framer-motion';
import { Gift, Bell, BadgePercent, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Promociones está EN CONSTRUCCIÓN: ofertas/descuentos de partners del sector.
// Por ahora mostramos un teaser "Próximamente" con captación de interés.
const Promociones = () => {
  const { toast } = useToast();

  const notifyInterest = () => {
    toast({
      title: '¡Genial!',
      description: 'Te avisaremos en cuanto las promociones del sector estén disponibles.',
    });
  };

  return (
    <div className="space-y-8">
      <motion.div
        className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-8 shadow-lg ring-1 ring-red-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-red-400 to-red-600 rounded-r-full shadow-lg"></div>
          <div className="ml-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Promociones</h1>
              <Badge className="bg-red-600">Próximamente</Badge>
            </div>
            <p className="text-gray-600">Ofertas y descuentos exclusivos del sector para tu farmacia</p>
          </div>
        </div>
      </motion.div>

      <Card className="border-dashed">
        <CardContent className="text-center py-14 px-6 space-y-5 max-w-2xl mx-auto">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 text-white flex items-center justify-center">
            <Gift className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Ofertas del sector, muy pronto</h2>
          <p className="text-muted-foreground">
            Estamos cerrando acuerdos con partners del sector para traerte ofertas y
            descuentos exclusivos: dermocosmética, parafarmacia, formación, equipamiento y
            servicios. Todo en un mismo sitio, pensado para que tu farmacia ahorre y gane.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><BadgePercent className="h-4 w-4 text-red-500" /> Descuentos exclusivos</span>
            <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-red-500" /> Partners del sector</span>
          </div>
          <Button onClick={notifyInterest} className="bg-red-600 hover:bg-red-700">
            <Bell className="h-4 w-4 mr-2" />
            ¿Te interesaría recibir ofertas del sector? Avísame
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Promociones;
