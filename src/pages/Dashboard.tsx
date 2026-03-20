import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap,
  MessageSquare,
  Trophy,
  Briefcase,
  TrendingUp,
  Star,
  Flame,
  Target,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const { profile } = useAuth();

  const { data: enrollments } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_enrollments")
        .select("*, courses(title, thumbnail_url)")
        .order("enrolled_at", { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [coursesRes, threadsRes, challengesRes] = await Promise.all([
        supabase.from("course_enrollments").select("id", { count: "exact", head: true }),
        supabase.from("forum_threads").select("id", { count: "exact", head: true }),
        supabase.from("user_challenges").select("id", { count: "exact", head: true }).eq("completed", true),
      ]);
      return {
        courses: coursesRes.count || 0,
        threads: threadsRes.count || 0,
        challenges: challengesRes.count || 0,
      };
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          ¡Hola, {profile?.full_name?.split(" ")[0] || "Profesional"}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido de vuelta a FarmaPro
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{profile?.points || 0}</p>
                <p className="text-xs text-muted-foreground">Puntos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{profile?.streak_days || 0}</p>
                <p className="text-xs text-muted-foreground">Racha</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">Nv.{profile?.level || 1}</p>
                <p className="text-xs text-muted-foreground">Nivel</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stats?.courses || 0}</p>
                <p className="text-xs text-muted-foreground">Cursos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent courses */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4">Mis cursos recientes</h2>
        {enrollments && enrollments.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {enrollments.map((enrollment: any) => (
              <Card key={enrollment.id} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-2">{enrollment.courses?.title}</h3>
                  <Progress value={Number(enrollment.progress)} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">{Math.round(Number(enrollment.progress))}% completado</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border border-dashed">
            <CardContent className="p-8 text-center">
              <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aún no te has inscrito en ningún curso</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: GraduationCap, label: "Ver cursos", path: "/formacion", color: "text-primary" },
            { icon: MessageSquare, label: "Comunidad", path: "/comunidad", color: "text-info" },
            { icon: Trophy, label: "Retos diarios", path: "/retos", color: "text-accent" },
            { icon: Briefcase, label: "Ofertas empleo", path: "/empleo", color: "text-primary" },
          ].map((action) => (
            <a
              key={action.path}
              href={action.path}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <action.icon className={`w-6 h-6 ${action.color}`} />
              <span className="text-sm font-medium">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
