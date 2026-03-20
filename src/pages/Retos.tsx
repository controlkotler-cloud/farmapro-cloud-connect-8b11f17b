import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, CheckCircle, Target } from "lucide-react";
import { toast } from "sonner";

const Retos = () => {
  const { user } = useAuth();

  const { data: challenges } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("type");
      return data || [];
    },
  });

  const { data: userChallenges, refetch } = useQuery({
    queryKey: ["user-challenges"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_challenges")
        .select("*");
      return data || [];
    },
  });

  const handleComplete = async (challengeId: string, points: number) => {
    if (!user) return;
    const { error } = await supabase.from("user_challenges").insert({
      user_id: user.id,
      challenge_id: challengeId,
      completed: true,
      completed_at: new Date().toISOString(),
      progress: 100,
    });
    if (error) {
      toast.error("Error al completar el reto");
    } else {
      await supabase.rpc("add_user_points", { p_user_id: user.id, p_points: points });
      toast.success(`¡Reto completado! +${points} puntos`);
      refetch();
    }
  };

  const isCompleted = (challengeId: string) =>
    userChallenges?.some((uc: any) => uc.challenge_id === challengeId && uc.completed);

  const typeLabels: Record<string, string> = {
    daily: "Diario",
    weekly: "Semanal",
    monthly: "Mensual",
    special: "Especial",
  };

  const typeColors: Record<string, string> = {
    daily: "bg-primary/10 text-primary",
    weekly: "bg-info/10 text-info",
    monthly: "bg-accent/10 text-accent",
    special: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Retos y gamificación</h1>
        <p className="text-muted-foreground">Completa retos para ganar puntos y subir de nivel</p>
      </div>

      {challenges && challenges.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {challenges.map((challenge: any) => {
            const completed = isCompleted(challenge.id);
            return (
              <Card key={challenge.id} className={`border-border ${completed ? "opacity-60" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={typeColors[challenge.type] || ""} variant="secondary">
                          {typeLabels[challenge.type] || challenge.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Zap className="w-3 h-3 mr-1" /> {challenge.points} pts
                        </Badge>
                      </div>
                      <h3 className="font-display font-semibold">{challenge.title}</h3>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    </div>
                    {completed ? (
                      <CheckCircle className="w-8 h-8 text-primary shrink-0" />
                    ) : (
                      <Button size="sm" onClick={() => handleComplete(challenge.id, challenge.points)}>
                        Completar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border border-dashed">
          <CardContent className="p-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Sin retos activos</h3>
            <p className="text-muted-foreground">Los retos estarán disponibles pronto</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Retos;
