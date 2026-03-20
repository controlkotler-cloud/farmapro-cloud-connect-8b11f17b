import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Phone, CheckCircle } from "lucide-react";

const Farmacias = () => {
  const { data: pharmacies } = useQuery({
    queryKey: ["pharmacies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pharmacy_listings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Directorio de farmacias</h1>
          <p className="text-muted-foreground">Encuentra y conecta con farmacias</p>
        </div>
        <Button>Añadir farmacia</Button>
      </div>

      {pharmacies && pharmacies.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pharmacies.map((pharmacy: any) => (
            <Card key={pharmacy.id} className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-display font-semibold">{pharmacy.name}</h3>
                  {pharmacy.is_verified && (
                    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  )}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {pharmacy.city}, {pharmacy.province}
                  </p>
                  {pharmacy.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {pharmacy.phone}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pharmacy.has_lab && <Badge variant="secondary" className="text-xs">Laboratorio</Badge>}
                  {pharmacy.has_optica && <Badge variant="secondary" className="text-xs">Óptica</Badge>}
                  {pharmacy.has_dermocosmetica && <Badge variant="secondary" className="text-xs">Dermocosmética</Badge>}
                </div>
                <Button variant="outline" size="sm" className="w-full">Ver detalle</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border border-dashed">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Sin farmacias registradas</h3>
            <p className="text-muted-foreground">Sé el primero en añadir tu farmacia</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Farmacias;
