
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
        return <BookOpen className="h-5 w-5 text-blue-600" />;
      case 'resource':
        return <Download className="h-5 w-5 text-green-600" />;
      case 'forum':
        return <MessageSquare className="h-5 w-5 text-purple-600" />;
      case 'challenge':
        return <Trophy className="h-5 w-5 text-yellow-600" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />;
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
              <div className="text-center py-8 text-gray-500">
                <p>No hay actividad reciente aún.</p>
                <p className="text-sm mt-2">¡Empieza completando un curso o descargando recursos!</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-500">{activity.date}</p>
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
