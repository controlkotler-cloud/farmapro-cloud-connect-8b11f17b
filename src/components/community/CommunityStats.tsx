
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      title: "Discusiones Activas",
      value: totalThreads,
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Hilos de conversación"
    },
    {
      title: "Respuestas Totales",
      value: totalReplies,
      icon: MessageCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Participaciones activas"
    },
    {
      title: "Tus Contribuciones",
      value: userForumPosts,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Tu participación"
    },
    {
      title: "Tu Progreso",
      value: `Nivel ${userLevel}`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: `${userPoints} puntos totales`
    }
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <p className="text-sm text-gray-500">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
