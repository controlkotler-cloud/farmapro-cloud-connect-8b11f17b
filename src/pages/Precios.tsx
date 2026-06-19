import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, ImageIcon, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  PLANS,
  LAUNCH_SPOTS,
  IMAGE_ADDONS,
  FREE_LIMITS,
  type Plan,
} from "@/lib/plans";

type BillingCycle = "monthly" | "yearly";

/** Formatea un importe en euros con el estilo español (coma decimal, sin decimales si es entero). */
function formatPrice(value: number): string {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export default function Precios() {
  const { toast } = useToast();
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  const handleReserve = () => {
    toast({
      title: "Pronto podrás suscribirte",
      description:
        "Estamos activando el pago. Te avisaremos en cuanto tu plaza esté lista para reservar.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Cabecera */}
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Precio de lanzamiento · primeras {LAUNCH_SPOTS} plazas
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Planes de farmapro</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Todo el contenido, la comunidad y IAFarma en un único sitio. Elige tu
            plaza al precio de lanzamiento y consérvalo para siempre.
          </p>
          <p className="text-sm text-muted-foreground mt-3">Todos los precios con IVA incluido.</p>
        </div>

        {/* Toggle Mensual / Anual */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span
            className={`text-sm font-medium ${
              billing === "monthly" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Mensual
          </span>
          <Switch
            checked={billing === "yearly"}
            onCheckedChange={(checked) =>
              setBilling(checked ? "yearly" : "monthly")
            }
            aria-label="Cambiar entre facturación mensual y anual"
          />
          <span
            className={`text-sm font-medium ${
              billing === "yearly" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Anual
          </span>
          <Badge variant="secondary" className="text-primary border-primary/30">
            2 meses gratis
          </Badge>
        </div>

        {/* Tarjetas de planes */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              onReserve={handleReserve}
            />
          ))}
        </div>

        {/* Cómo funciona el plan gratis */}
        <div className="max-w-3xl mx-auto mt-12">
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Cómo funciona el plan gratis</h3>
              <p className="text-sm text-muted-foreground">
                Durante los primeros {FREE_LIMITS.trialDays} días disfrutas de un
                acceso limitado: unos cuantos cursos y recursos, la comunidad en
                modo lectura y unas primeras pruebas de IAFarma. Pasados los{" "}
                {FREE_LIMITS.trialDays} días tu cuenta queda en modo solo-ver: lo
                sigues viendo todo, pero para usarlo necesitas un plan de pago.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add-ons de imágenes IAFarma */}
        <div className="max-w-3xl mx-auto mt-10">
          <div className="text-center mb-5">
            <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Packs de imágenes IAFarma
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              ¿Necesitas más imágenes? Recarga cuando quieras, pago único sobre
              cualquier plan de pago.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {IMAGE_ADDONS.map((addon) => (
              <Card key={addon.credits} className="text-center">
                <CardContent className="p-5">
                  <p className="text-2xl font-bold">+{addon.credits}</p>
                  <p className="text-sm text-muted-foreground mb-2">imágenes</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatPrice(addon.price)} €
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Soporte */}
        <div className="text-center mt-14">
          <p className="text-muted-foreground">
            ¿Necesitas ayuda?{" "}
            <a
              href="mailto:soporte@farmapro.es"
              className="text-primary hover:underline"
            >
              Contacta con nosotros
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  billing: BillingCycle;
  onReserve: () => void;
}

function PlanCard({ plan, billing, onReserve }: PlanCardProps) {
  const isFree = plan.id === "gratis";
  const isHighlighted = Boolean(plan.highlight);

  // Precio vigente según el ciclo de facturación.
  const launchPrice =
    billing === "yearly" ? plan.priceYearlyLaunch : plan.priceMonthlyLaunch;
  const period = billing === "yearly" ? "/año" : "/mes";

  return (
    <Card
      className={`relative flex flex-col h-full overflow-hidden transition-shadow ${
        isHighlighted
          ? "border-primary border-2 shadow-lg ring-1 ring-primary/20"
          : ""
      }`}
    >
      {isHighlighted && (
        <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-center py-1.5 text-xs font-semibold tracking-wide">
          El más elegido
        </div>
      )}

      <CardHeader className={`text-center ${isHighlighted ? "pt-10" : "pt-6"}`}>
        <h2 className="text-2xl font-bold">{plan.name}</h2>
        <p className="text-sm text-muted-foreground">{plan.tagline}</p>

        {/* Bloque de precio */}
        <div className="mt-4 min-h-[7rem] flex flex-col items-center justify-center">
          {isFree ? (
            <span className="text-4xl font-bold">Gratis</span>
          ) : (
            <>
              {/* Precio regular tachado */}
              <span className="text-sm text-muted-foreground line-through">
                Antes {formatPrice(plan.priceMonthly)} €/mes
              </span>
              {/* Precio de lanzamiento */}
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-primary">
                  {launchPrice !== undefined ? formatPrice(launchPrice) : "—"} €
                </span>
                <span className="text-muted-foreground">{period}</span>
              </div>
              <span className="mt-2 text-xs font-medium text-primary">
                Precio de lanzamiento · primeras {LAUNCH_SPOTS} plazas, para siempre
              </span>
              {billing === "yearly" && (
                <span className="text-xs text-muted-foreground mt-1">
                  Equivale a 2 meses gratis
                </span>
              )}
            </>
          )}
        </div>

        {/* Plazas incluidas */}
        <p className="mt-3 text-sm text-muted-foreground">
          {plan.seats === 1
            ? "1 usuario incluido"
            : `Hasta ${plan.seats} usuarios`}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col flex-1">
        <ul className="space-y-3 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {isFree ? (
            <Button asChild className="w-full" variant="outline">
              <Link to="/login">{plan.cta}</Link>
            </Button>
          ) : (
            <Button
              className="w-full"
              variant={isHighlighted ? "default" : "outline"}
              onClick={onReserve}
            >
              {plan.cta}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
