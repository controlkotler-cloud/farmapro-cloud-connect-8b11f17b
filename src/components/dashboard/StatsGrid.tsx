
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
  // Tarjetas claras con chip de color por métrica (canon: nunca texto blanco
  // sobre brand; el acento distingue, la tinta lee).
  const statsCards = [
    {
      title: 'Cursos Completados',
      value: coursesCompleted,
      icon: BookOpen,
      chip: 'bg-brand-soft text-brand-dark',
      delay: 0.1
    },
    {
      title: 'Recursos Descargados',
      value: resourcesDownloaded,
      icon: Download,
      chip: 'bg-salvia-soft text-salvia',
      delay: 0.2
    },
    {
      title: 'Posts en Foros',
      value: forumPosts,
      icon: MessageSquare,
      chip: 'bg-terracota-soft text-terracota',
      delay: 0.3
    },
    {
      title: 'Retos Completados',
      value: challengesCompleted,
      icon: Target,
      chip: 'bg-miel-soft text-miel',
      delay: 0.4
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: stat.delay }}
        >
          <Card className="h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <div className={`flex h-12 w-12 flex-none items-center justify-center rounded-full ${stat.chip}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
