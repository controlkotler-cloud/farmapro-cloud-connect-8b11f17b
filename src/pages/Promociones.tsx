import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Percent } from "lucide-react";

const Promociones = () => {
  const { data: promotions } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Promociones</h1>
        <p className="text-muted-foreground">Ofertas y descuentos exclusivos para profesionales</p>
      </div>

      {promotions && promotions.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo: any) => (
            <Card key={promo.id} className="border-border hover:shadow-lg transition-shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="h-36 bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
                  {promo.discount_percentage ? (
                    <div className="text-center">
                      <span className="text-3xl font-display font-bold text-accent">{promo.discount_percentage}%</span>
                      <p className="text-xs text-muted-foreground">DESCUENTO</p>
                    </div>
                  ) : (
                    <Tag className="w-10 h-10 text-accent/40" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  {promo.is_featured && <Badge className="bg-accent text-accent-foreground">Destacado</Badge>}
                  <h3 className="font-display font-semibold">{promo.title}</h3>
                  {promo.company_name && (
                    <p className="text-sm text-muted-foreground">{promo.company_name}</p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">{promo.description}</p>
                  {promo.promo_code && (
                    <div className="bg-muted rounded-lg px-3 py-2 text-center">
                      <span className="text-xs text-muted-foreground">Código: </span>
                      <span className="font-mono font-semibold text-primary">{promo.promo_code}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border border-dashed">
          <CardContent className="p-12 text-center">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Sin promociones activas</h3>
            <p className="text-muted-foreground">Las promociones aparecerán aquí</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Promociones;
