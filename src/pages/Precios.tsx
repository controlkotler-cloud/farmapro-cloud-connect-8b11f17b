import { useEffect, useState } from "react";
import { extractFunctionErrorMessage } from "@/lib/functionsError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Check, ImageIcon, Sparkles, Flame, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTeamManagement } from "@/hooks/useTeamManagement";
import { supabase } from "@/integrations/supabase/client";
import { useLaunchStatus } from "@/hooks/useLaunchStatus";
import {
  PLANS,
  LAUNCH,
  ANNUAL_REGULAR_AVAILABLE,
  IMAGE_ADDONS,
  FREE_LIMITS,
  getAccessState,
  type Plan,
  type PlanId,
} from "@/lib/plans";

export type BillingCycle = "monthly" | "yearly";

/** Formatea un importe en euros con el estilo español (coma decimal, sin decimales si es entero). */
function formatPrice(value: number): string {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export default function Precios() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isTeamOwner, isTeamMember, loading: teamLoading } = useTeamManagement();
  // Plan de pago que ya tiene el usuario: la tarjeta de ese plan se marca como
  // actual y la del otro ofrece el cambio (Plus → "Pasar a Equipo"). Antes las
  // tres tarjetas se pintaban igual y "Hazte Plus" mandaba a un Plus al portal
  // de Stripe sin nada que cambiar.
  const role = profile?.subscription_role as string | undefined;
  const currentPlan: PlanId | null =
    isTeamOwner || role === "equipo" ? "equipo" : role === "plus" ? "plus" : null;
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  // Plan cuyo checkout está en curso (deshabilita su botón e ignora dobles clics).
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  // Pack de imágenes cuyo checkout está en curso.
  const [packLoading, setPackLoading] = useState<number | null>(null);
  // Los packs se cobran sobre un plan de pago (create-checkout lo exige por rol):
  // titular Plus/Equipo o miembro de un equipo.
  const canBuyPacks = currentPlan !== null || (isTeamMember && !teamLoading);
  // Vuelta al portal para quien ya tiene cuenta. El gratis caducado no la ve:
  // la app lo reenvía a /precios y el enlace solo haría un bucle.
  const accessState = user
    ? getAccessState(role ?? null, profile?.created_at ?? null)
    : null;
  const showBackToPortal = Boolean(user) && accessState !== "free_locked";
  // Estado del lanzamiento con el recuento REAL de plazas (vista founder_count).
  const { launch } = useLaunchStatus();
  // El anual solo se ofrece si sigue el lanzamiento o ya existen los precios anuales regulares.
  const annualAvailable = launch.active || ANNUAL_REGULAR_AVAILABLE;
  // Miembro de un equipo (no titular): ya tiene acceso completo, sin CTAs de compra.
  // isTeamMember (señal viva) en vez de profile.subscription_role (cacheado).
  const showTeamMemberBanner = isTeamMember && !teamLoading && !isTeamOwner;
  const takenPct = Math.min(
    100,
    Math.round(((LAUNCH.spots - launch.spotsLeft) / LAUNCH.spots) * 100),
  );

  // Si el anual deja de estar disponible, vuelve a mensual.
  useEffect(() => {
    if (!annualAvailable && billing === "yearly") setBilling("monthly");
  }, [annualAvailable, billing]);

  const handleSubscribe = async (planId: PlanId) => {
    if (planId === "gratis") return;

    if (!user) {
      // Alta directa (no login) y vuelta a Precios al confirmar: sin el next
      // el comprador acababa en el dashboard y tenia que buscar el plan otra vez.
      navigate(`/login?modo=registro&next=${encodeURIComponent("/precios")}`);
      return;
    }

    setCheckoutLoading(planId);
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { plan: planId, cycle: billing },
    });
    setCheckoutLoading(null);

    // Ya está en ese plan: no hay nada que cambiar ni a dónde ir.
    if (!error && data?.mode === "current") {
      toast({
        title: "Este ya es tu plan",
        description: "Tu suscripción actual ya es la que has elegido. Puedes gestionarla desde Perfil → Facturación.",
      });
      return;
    }

    if (error || !data?.url) {
      const detail =
        (await extractFunctionErrorMessage(error)) ??
        (typeof data?.error === "string" ? data.error : undefined);
      toast({
        title: "No se ha podido iniciar el pago",
        description:
          detail ??
          "Inténtalo de nuevo en unos segundos. Si persiste, escríbenos a soporte@farmapro.es.",
        variant: "destructive",
      });
      return;
    }

    if (data.mode === "portal") {
      toast({
        title: "Cambio de plan",
        description:
          "Te llevamos a la pantalla segura de Stripe para confirmar el cambio. Verás el importe exacto antes de aceptar.",
      });
    }

    window.location.href = data.url;
  };

  // Recarga de packs de imágenes desde esta página (antes solo se pintaban
  // los precios, sin botón: había que ir a Perfil → Plan para comprarlos).
  const handleBuyPack = async (credits: number) => {
    if (!user) {
      navigate(`/login?modo=registro&next=${encodeURIComponent("/precios")}`);
      return;
    }
    if (!canBuyPacks) {
      toast({
        title: "Los packs van sobre un plan de pago",
        description: "Elige primero Plus o Equipo. Los créditos del pack se suman a los del plan y no caducan.",
      });
      return;
    }
    setPackLoading(credits);
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { pack: credits },
    });
    setPackLoading(null);
    if (error || !data?.url) {
      const detail =
        (await extractFunctionErrorMessage(error)) ??
        (typeof data?.error === "string" ? data.error : undefined);
      toast({
        title: "No se ha podido iniciar el pago",
        description:
          detail ??
          "Inténtalo de nuevo en unos segundos. Si persiste, escríbenos a soporte@farmapro.es.",
        variant: "destructive",
      });
      return;
    }
    window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {showBackToPortal && (
          <div className="mb-6 -mt-6">
            <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Volver al portal
              </Link>
            </Button>
          </div>
        )}
        {/* Cabecera */}
        <div className="text-center mb-10">
          {showTeamMemberBanner ? (
            <div className="mx-auto mb-5 max-w-xl rounded-lg border border-brand-soft bg-brand-soft p-4 text-center">
              <p className="text-sm font-semibold text-brand-dark">
                Ya tienes acceso completo con el plan Equipo de tu farmacia
              </p>
            </div>
          ) : launch.active ? (
            <div className="mx-auto mb-5 max-w-xl rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                {launch.almostGone ? (
                  <Flame className="h-4 w-4 text-destructive" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
                <span className={launch.almostGone ? "text-destructive" : "text-primary"}>
                  {launch.almostGone
                    ? "¡Últimas plazas a este precio!"
                    : "Precio de lanzamiento"}
                </span>
              </div>
              {/* El contador solo se enseña con altas reales suficientes (fases en plans.ts). */}
              {launch.showCounter && (
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full border border-border bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all ${
                      launch.almostGone ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${takenPct}%` }}
                  />
                </div>
              )}
              <div className="mt-2.5 text-center text-xs text-muted-foreground">
                {launch.almostGone ? (
                  <>
                    Solo quedan <strong className="text-foreground">{launch.spotsLeft}</strong> de{" "}
                    {LAUNCH.spots} plazas a este precio
                  </>
                ) : launch.showCounter ? (
                  <>
                    <strong className="text-foreground">{launch.spotsTaken}</strong> de {LAUNCH.spots}{" "}
                    plazas fundador ya ocupadas
                  </>
                ) : (
                  <>
                    Las primeras <strong className="text-foreground">{LAUNCH.spots} plazas</strong>{" "}
                    conservan este precio mientras mantengan la suscripción activa
                  </>
                )}
              </div>
            </div>
          ) : (
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Planes de farmapro
            </Badge>
          )}
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl [text-wrap:balance]">
            Planes <em className="italic-display">de farmapro</em>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {launch.active
              ? "Todo el contenido, la comunidad y IAFarma en un único sitio. Elige tu plaza al precio de lanzamiento y consérvalo mientras mantengas la suscripción activa."
              : "Todo el contenido, la comunidad y IAFarma en un único sitio, por una cuota mensual."}
          </p>
          <p className="text-sm text-muted-foreground mt-3">Todos los precios con IVA incluido.</p>
        </div>

        {/* Toggle Mensual / Anual (el anual solo si Stripe puede cobrarlo) */}
        {annualAvailable && (
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
              onCheckedChange={(checked) => setBilling(checked ? "yearly" : "monthly")}
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
        )}
        {!annualAvailable && <div className="mb-12" />}


        {/* Tarjetas de planes */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              launchActive={launch.active}
              onSubscribe={handleSubscribe}
              loading={checkoutLoading === plan.id}
              hideCta={showTeamMemberBanner}
              currentPlan={currentPlan}
            />
          ))}
        </div>

        {/* Cómo funciona el plan gratis */}
        <div className="max-w-3xl mx-auto mt-12">
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Cómo funciona el plan gratis</h3>
              <p className="text-sm text-muted-foreground">
                Durante los primeros {FREE_LIMITS.trialDays} días disfrutas de un acceso
                limitado: unos cuantos cursos y recursos, la comunidad en modo lectura y
                unas primeras pruebas de IAFarma. Pasados los {FREE_LIMITS.trialDays} días
                tu cuenta queda en modo solo-ver: lo sigues viendo todo, pero para usarlo
                necesitas un plan de pago.
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
              ¿Necesitas más imágenes? Recarga cuando quieras, pago único sobre cualquier
              plan de pago. Los créditos no caducan: quedan en tu cuenta hasta que los usas.
              {canBuyPacks && " También puedes verlos y recargarlos desde Perfil → Plan."}
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
                  {canBuyPacks ? (
                    <Button
                      size="sm"
                      className="mt-3 w-full rounded-full"
                      disabled={packLoading !== null}
                      onClick={() => handleBuyPack(addon.credits)}
                    >
                      {packLoading === addon.credits ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Recargar"
                      )}
                    </Button>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">Disponible con Plus o Equipo</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Soporte */}
        <div className="text-center mt-14">
          <p className="text-muted-foreground">
            ¿Necesitas ayuda?{" "}
            <a href="mailto:soporte@farmapro.es" className="text-primary hover:underline">
              Contacta con nosotros
            </a>
          </p>
          {showBackToPortal && (
            <p className="mt-3 text-sm">
              <Link to="/dashboard" className="text-primary hover:underline">
                Volver al portal
              </Link>
            </p>
          )}
        </div>

        {/* Condiciones de contratación y enlaces legales. El Aviso Legal remite
            a esta página para las condiciones de cada plan, así que tienen que
            estar aquí, visibles en el momento de contratar (LSSI art. 27 y
            normativa de consumo). Es una página pública sin sidebar ni footer:
            sin este bloque no había ningún enlace legal a la vista. */}
        <section
          aria-labelledby="condiciones-contratacion"
          className="mx-auto mt-16 max-w-3xl border-t border-border pt-8 text-xs leading-relaxed text-muted-foreground"
        >
          <h2 id="condiciones-contratacion" className="mb-3 text-sm font-semibold text-foreground">
            Condiciones de contratación
          </h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Los planes Plus y Equipo son suscripciones que se renuevan automáticamente al final de cada
              periodo (mensual o anual, según lo elegido) por el precio vigente para tu suscripción. El plan
              Gratis no requiere tarjeta.
            </li>
            <li>
              Puedes cancelar en cualquier momento desde tu perfil, en la pestaña de facturación. La
              cancelación surte efecto al final del periodo ya pagado: mantienes el acceso hasta entonces y
              no se cobran renovaciones posteriores.
            </li>
            <li>
              El precio de fundador se conserva mientras la suscripción se mantenga activa. Si se cancela,
              la plaza se libera y una nueva suscripción se contrata al precio vigente en ese momento.
            </li>
            <li>
              Todos los precios incluyen IVA. El cobro se realiza a través de Stripe y la factura la emite
              Mkpro Kotler SL (CIF B99554446), titular del portal. Los packs de créditos de IAFarma son
              pagos únicos, no suscripciones.
            </li>
            <li>
              Al suscribirte aceptas el{" "}
              <Link to="/aviso-legal" className="text-primary hover:underline">Aviso Legal</Link> y la{" "}
              <Link to="/politica-privacidad" className="text-primary hover:underline">Política de Privacidad</Link>{" "}
              del portal.
            </li>
          </ul>
          <nav aria-label="Enlaces legales" className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>© {new Date().getFullYear()} farmapro</span>
            <Link to="/aviso-legal" className="hover:text-foreground">Aviso Legal</Link>
            <Link to="/politica-privacidad" className="hover:text-foreground">Política de Privacidad</Link>
            <Link to="/politica-cookies" className="hover:text-foreground">Política de Cookies</Link>
            <Link to="/contacto-soporte" className="hover:text-foreground">Contacto y soporte</Link>
            <a href="https://farmapro.es" className="hover:text-foreground">farmapro.es</a>
          </nav>
        </section>
      </div>
    </div>
  );
}

export interface PlanCardProps {
  plan: Plan;
  billing: BillingCycle;
  /** Si el lanzamiento sigue activo, se muestra el precio de lanzamiento; si no, el normal. */
  launchActive: boolean;
  onSubscribe: (planId: PlanId) => void;
  /** Checkout en curso para este plan concreto: deshabilita el botón y muestra spinner. */
  loading?: boolean;
  /** Oculta el botón de compra (quien ya tiene acceso completo vía plan Equipo de su farmacia). */
  hideCta?: boolean;
  /**
   * Plan de pago que el usuario ya tiene (null/undefined = ninguno). Marca su
   * tarjeta como "Tu plan actual" y convierte la del plan superior en cambio.
   */
  currentPlan?: PlanId | null;
}

/** Exportada para reutilizarla tal cual en la landing de la Rebotica (mismos precios, cero duplicación). */
export function PlanCard({ plan, billing, launchActive, onSubscribe, loading, hideCta, currentPlan }: PlanCardProps) {
  const isFree = plan.id === "gratis";
  const isHighlighted = Boolean(plan.highlight);
  const period = billing === "yearly" ? "/año" : "/mes";
  // Estado del CTA respecto al plan que ya paga el usuario.
  const hasPaidPlan = currentPlan === "plus" || currentPlan === "equipo";
  const isCurrent = hasPaidPlan && currentPlan === plan.id;
  const includedInCurrent = currentPlan === "equipo" && plan.id === "plus";
  const isUpgrade = currentPlan === "plus" && plan.id === "equipo";
  const showCta = !hideCta && !(isFree && hasPaidPlan);

  // Precio regular vigente (sin lanzamiento). Anual = 10x mensual (2 meses gratis).
  // El anual regular solo se muestra si Stripe ya puede cobrarlo.
  const regularAnnualShown = billing !== "yearly" || ANNUAL_REGULAR_AVAILABLE;
  const regularPriceRaw = billing === "yearly" ? plan.priceMonthly * 10 : plan.priceMonthly;
  const regularPrice = regularAnnualShown ? regularPriceRaw : undefined;
  const launchPrice =
    billing === "yearly" ? plan.priceYearlyLaunch : plan.priceMonthlyLaunch;
  // Precio que se cobra realmente ahora mismo.
  const currentPrice = launchActive ? launchPrice : regularPrice;


  return (
    <Card
      className={`relative flex flex-col h-full overflow-hidden transition-shadow ${
        isHighlighted ? "border-primary border-2 shadow-lift" : ""
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
              {/* Precio regular tachado (solo durante el lanzamiento y si es cobrable) */}
              {launchActive && regularPrice !== undefined && (
                <span className="text-sm text-muted-foreground line-through">
                  Antes {formatPrice(regularPrice)} €{period}
                </span>
              )}
              {/* Precio vigente */}
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-primary">
                  {currentPrice !== undefined ? formatPrice(currentPrice) : "—"} €
                </span>
                <span className="text-muted-foreground">{period}</span>
              </div>
              {launchActive && (
                <span className="mt-2 text-xs font-medium text-primary">
                  Precio de lanzamiento · {LAUNCH.spots} primeras plazas. No sube mientras mantengas la suscripción activa
                </span>
              )}
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
          {plan.seats === 1 ? "1 usuario incluido" : `Hasta ${plan.seats} usuarios`}
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

        {showCta && (
          <div className="mt-6">
            {isFree ? (
              <Button asChild className="w-full rounded-full" variant="outline">
                <Link to="/login">{plan.cta}</Link>
              </Button>
            ) : isCurrent ? (
              <Button className="w-full rounded-full gap-2" variant="secondary" disabled>
                <Check className="h-4 w-4" />
                Tu plan actual
              </Button>
            ) : includedInCurrent ? (
              <Button className="w-full rounded-full" variant="secondary" disabled>
                Incluido en tu plan Equipo
              </Button>
            ) : (
              <>
                <Button
                  className="w-full rounded-full"
                  variant={isHighlighted || isUpgrade ? "default" : "outline"}
                  onClick={() => onSubscribe(plan.id)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isUpgrade ? (
                    "Pasar a Equipo"
                  ) : (
                    plan.cta
                  )}
                </Button>
                {isUpgrade && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Solo pagas la diferencia proporcional del periodo en curso. Confirmas el importe exacto en Stripe.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
