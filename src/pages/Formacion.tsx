import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Clock, Users, Star } from "lucide-react";

const Formacion = () => {
  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("order_index");
      return data || [];
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Formación</h1>
        <p className="text-muted-foreground">Cursos especializados para profesionales de farmacia</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border animate-pulse">
              <CardContent className="p-0">
                <div className="h-40 bg-muted rounded-t-lg" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => (
            <Card key={course.id} className="border-border overflow-hidden hover:shadow-lg transition-shadow group">
              <CardContent className="p-0">
                <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                  <GraduationCap className="w-12 h-12 text-primary/40" />
                  {course.is_premium && (
                    <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">Premium</Badge>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <Badge variant="secondary" className="text-xs">
                    {course.category}
                  </Badge>
                  <h3 className="font-display font-semibold group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {course.duration_hours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {course.students_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" /> {Number(course.rating).toFixed(1)}
                    </span>
                  </div>
                  <Button className="w-full" size="sm">
                    Ver curso
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border border-dashed">
          <CardContent className="p-12 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Próximamente</h3>
            <p className="text-muted-foreground">Los cursos estarán disponibles pronto</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Formacion;
