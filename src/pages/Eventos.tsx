import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Video, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Eventos = () => {
  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .order("start_date");
      return data || [];
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Eventos</h1>
        <p className="text-muted-foreground">Webinars, talleres y formaciones en vivo</p>
      </div>

      {events && events.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {events.map((event: any) => (
            <Card key={event.id} className="border-border hover:shadow-lg transition-shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-primary/40" />
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{event.event_type}</Badge>
                    {event.is_premium && <Badge className="bg-accent text-accent-foreground">Premium</Badge>}
                  </div>
                  <h3 className="font-display font-semibold">{event.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(event.start_date), "d MMM yyyy, HH:mm", { locale: es })}
                    </span>
                    {event.is_online ? (
                      <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> Online</span>
                    ) : (
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                    )}
                  </div>
                  <Button className="w-full" size="sm">Registrarse</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border border-dashed">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Sin eventos próximos</h3>
            <p className="text-muted-foreground">Los próximos eventos aparecerán aquí</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Eventos;
