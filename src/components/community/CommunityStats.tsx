
import { motion } from 'framer-motion';
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
      icon: MessageSquare
    },
    {
      title: "Respuestas Totales",
      value: totalReplies,
      icon: MessageCircle
    },
    {
      title: "Tus Contribuciones",
      value: userForumPosts,
      icon: Users
    },
    {
      title: "Tu Progreso",
      value: `Nivel ${userLevel}`,
      icon: TrendingUp
    }
  ];

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-terracota shadow-lg">
                  <stat.icon className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground">
                {stat.title === "Tu Progreso" ? `${userPoints} puntos totales` : "Participación activa"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};
