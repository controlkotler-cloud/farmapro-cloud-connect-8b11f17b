import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const Empleo = () => {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("job_listings")
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
          <h1 className="text-2xl font-display font-bold">Bolsa de empleo</h1>
          <p className="text-muted-foreground">Ofertas de trabajo en el sector farmacéutico</p>
        </div>
        <Button>Publicar oferta</Button>
      </div>

      <div className="space-y-4">
        {jobs && jobs.length > 0 ? (
          jobs.map((job: any) => (
            <Card key={job.id} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold">{job.title}</h3>
                      {job.is_featured && <Badge className="bg-accent text-accent-foreground">Destacado</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> {job.company_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                      </span>
                      <Badge variant="secondary">{job.job_type}</Badge>
                    </div>
                    {job.salary_range && (
                      <p className="text-sm font-medium text-primary">{job.salary_range}</p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Ver oferta</Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-border border-dashed">
            <CardContent className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">Sin ofertas activas</h3>
              <p className="text-muted-foreground">Las ofertas de empleo aparecerán aquí</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Empleo;
