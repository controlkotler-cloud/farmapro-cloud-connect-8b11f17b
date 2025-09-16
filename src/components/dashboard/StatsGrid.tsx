
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Download, MessageSquare, Target } from 'lucide-react';

interface StatsGridProps {
  coursesCompleted: number;
  resourcesDownloaded: number;
  forumPosts: number;
  challengesCompleted: number;
}

export const StatsGrid = ({ 
  coursesCompleted, 
  resourcesDownloaded, 
  forumPosts, 
  challengesCompleted 
}: StatsGridProps) => {
  const statsCards = [
    {
      title: 'Cursos Completados',
      value: coursesCompleted,
      icon: BookOpen,
      gradient: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-100',
      delay: 0.1
    },
    {
      title: 'Recursos Descargados',
      value: resourcesDownloaded,
      icon: Download,
      gradient: 'from-green-500 to-green-600',
      textColor: 'text-green-100',
      delay: 0.2
    },
    {
      title: 'Posts en Foros',
      value: forumPosts,
      icon: MessageSquare,
      gradient: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-100',
      delay: 0.3
    },
    {
      title: 'Retos Completados',
      value: challengesCompleted,
      icon: Target,
      gradient: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-100',
      delay: 0.4
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: stat.delay }}
        >
          <Card className={`bg-gradient-to-r ${stat.gradient} text-white h-32`}>
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <stat.icon className="h-8 w-8 text-white" />
                <div className="ml-4">
                  <p className={`text-sm font-medium ${stat.textColor}`}>{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
