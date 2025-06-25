
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, MessageCircle, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
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
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
