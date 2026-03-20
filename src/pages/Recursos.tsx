import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

const Recursos = () => {
  const { data: resources } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data } = await supabase
        .from("resources")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const typeIcons: Record<string, string> = {
    pdf: "📄", video: "🎥", infografia: "📊", plantilla: "📋", guia: "📖", otro: "📁",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Recursos</h1>
        <p className="text-muted-foreground">Material descargable para tu farmacia</p>
      </div>

      {resources && resources.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource: any) => (
            <Card key={resource.id} className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{typeIcons[resource.type] || "📁"}</span>
                  <Badge variant="secondary">{resource.category}</Badge>
                  {resource.is_premium && <Badge className="bg-accent text-accent-foreground">Premium</Badge>}
                </div>
                <h3 className="font-display font-semibold">{resource.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Download className="w-3 h-3" /> {resource.downloads_count} descargas
                  </span>
                  <Button size="sm" variant="outline">Descargar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Sin recursos disponibles</h3>
            <p className="text-muted-foreground">Los recursos aparecerán aquí</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Recursos;
