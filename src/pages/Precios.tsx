import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, GraduationCap, Briefcase, Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PaymentLinks {
  student: string;
  professional: string;
  premium: string;
}

export default function Precios() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinks>({
    student: '',
    professional: '',
    premium: ''
  });

  useEffect(() => {
    const fetchPaymentLinks = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['stripe_student_payment_link', 'stripe_professional_payment_link', 'stripe_premium_payment_link']);

      if (data) {
        const links: PaymentLinks = {
          student: '',
          professional: '',
          premium: ''
        };
        
        data.forEach(setting => {
          const value = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
          if (setting.key === 'stripe_student_payment_link') links.student = value;
          if (setting.key === 'stripe_professional_payment_link') links.professional = value;
          if (setting.key === 'stripe_premium_payment_link') links.premium = value;
        });
        
        setPaymentLinks(links);
      }
    };

    fetchPaymentLinks();
  }, []);

  const handlePlanSelect = (link: string) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Planes de farmapro</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades profesionales
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Plan Freemium */}
          <Card className="relative overflow-hidden">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Freemium</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">Gratis</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Acceso a 1 curso</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Máximo 2 descargas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Ver comunidad (solo lectura)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Retos básicos</span>
                </li>
              </ul>
              <Button asChild className="w-full" variant="outline">
                <Link to="/login">
                  Empezar Gratis
                </Link>
              </Button>
            </CardContent>
          </Card>
          {/* Plan Estudiante */}
          <Card className="relative overflow-hidden">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Estudiante</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">5€</span>
                <span className="text-muted-foreground">/mes</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>1 curso al mes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>2 descargas al mes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Acceso a bolsa de trabajo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Farmacias en venta</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Verificación de matrícula requerida</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => handlePlanSelect(paymentLinks.student)}
                disabled={!paymentLinks.student}
              >
                Suscribirse
              </Button>
            </CardContent>
          </Card>

          {/* Plan Profesional */}
          <Card className="relative overflow-hidden border-primary">
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 text-sm font-medium">
              Más Popular
            </div>
            <CardHeader className="text-center pt-12">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Profesional</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">29€</span>
                <span className="text-muted-foreground">/mes</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Acceso completo a formación</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Descargas ilimitadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Comunidad completa</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Retos avanzados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Eventos exclusivos</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => handlePlanSelect(paymentLinks.professional)}
                disabled={!paymentLinks.professional}
              >
                Suscribirse
              </Button>
            </CardContent>
          </Card>

          {/* Plan Premium */}
          <Card className="relative overflow-hidden">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">39€</span>
                <span className="text-muted-foreground">/mes</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Todo lo anterior</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Promociones exclusivas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Publicar ofertas de empleo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Formaciones premium</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Soporte prioritario</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                onClick={() => handlePlanSelect(paymentLinks.premium)}
                disabled={!paymentLinks.premium}
              >
                Suscribirse
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground">
            ¿Necesitas ayuda? <a href="mailto:soporte@farmapro.es" className="text-primary hover:underline">Contacta con nosotros</a>
          </p>
        </div>
      </div>
    </div>
  );
}