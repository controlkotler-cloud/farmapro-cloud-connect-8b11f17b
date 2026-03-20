import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Eye, MessageCircle } from "lucide-react";

const Comunidad = () => {
  const { data: categories } = useQuery({
    queryKey: ["forum-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("forum_categories")
        .select("*")
        .eq("is_active", true)
        .order("order_index");
      return data || [];
    },
  });

  const { data: threads } = useQuery({
    queryKey: ["forum-threads-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("forum_threads")
        .select("*, forum_categories(name, color)")
        .order("last_reply_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Comunidad</h1>
          <p className="text-muted-foreground">Comparte conocimiento con otros profesionales</p>
        </div>
        <Button>Nuevo tema</Button>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories?.map((cat: any) => (
          <Card key={cat.id} className="border-border hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <div
                className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <MessageSquare className="w-5 h-5" style={{ color: cat.color }} />
              </div>
              <p className="font-medium text-sm">{cat.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Threads */}
      <div className="space-y-3">
        <h2 className="text-lg font-display font-semibold">Temas recientes</h2>
        {threads && threads.length > 0 ? (
          threads.map((thread: any) => (
            <Card key={thread.id} className="border-border hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold text-sm">{thread.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{thread.content}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">
                        {thread.forum_categories?.name}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {thread.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> {thread.replies_count}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-border border-dashed">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Sé el primero en crear un tema</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Comunidad;
