
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, MessageSquare, Trophy } from 'lucide-react';

interface ActivityItem {
  type: string;
  title: string;
  date: string;
  points: number;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-5 w-5 text-foreground" />;
      case 'resource':
        return <Download className="h-5 w-5 text-foreground" />;
      case 'forum':
        return <MessageSquare className="h-5 w-5 text-foreground" />;
      case 'challenge':
        return <Trophy className="h-5 w-5 text-foreground" />;
      default:
        return <BookOpen className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Tus últimas acciones en el portal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay actividad reciente aún.</p>
                <p className="text-sm mt-2">¡Empieza completando un curso o descargando recursos!</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={`${activity.type}-${activity.date}-${activity.title}`} className="flex items-start space-x-3 p-3 rounded-lg bg-muted">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                      <Badge variant="secondary" className="text-xs">+{activity.points} pts</Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
