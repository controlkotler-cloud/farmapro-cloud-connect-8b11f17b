import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, MessageCircle, Users, TrendingUp } from 'lucide-react';

interface CommunityStatsProps {
  totalThreads: number;
  totalReplies: number;
  userForumPosts: number;
  userLevel: number;
  userPoints: number;
}

export const CommunityStats = ({
  totalThreads,
  totalReplies,
  userForumPosts,
  userLevel,
  userPoints
}: CommunityStatsProps) => {
  const stats = [
    {
      title: 'Discusiones activas',
      value: totalThreads,
      icon: MessageSquare,
      caption: 'Participación activa'
    },
    {
      title: 'Respuestas totales',
      value: totalReplies,
      icon: MessageCircle,
      caption: 'Participación activa'
    },
    {
      title: 'Tus contribuciones',
      value: userForumPosts,
      icon: Users,
      caption: 'Participación activa'
    },
    {
      title: 'Tu progreso',
      value: `Nivel ${userLevel}`,
      icon: TrendingUp,
      caption: `${userPoints} puntos totales`
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-terracota-soft">
                <stat.icon className="h-4 w-4 text-terracota" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.caption}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
