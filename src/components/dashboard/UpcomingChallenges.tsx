
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UpcomingChallengesProps {
  coursesCompleted: number;
  resourcesDownloaded: number;
}

export const UpcomingChallenges = ({ coursesCompleted, resourcesDownloaded }: UpcomingChallengesProps) => {
  console.log('UpcomingChallenges received coursesCompleted:', coursesCompleted);
  
  const challenges = [
    {
      title: "Estudiante Dedicado",
      description: "Completa 5 cursos",
      points: 500,
      progress: coursesCompleted,
      target: 5
    },
    {
      title: "Coleccionista",
      description: "Descarga 5 recursos",
      points: 300,
      progress: resourcesDownloaded,
      target: 5
    },
    {
      title: "Experto Colaborador",
      description: "Realiza 10 respuestas en el foro",
      points: 1000,
      progress: 0,
      target: 10
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Próximos Retos</CardTitle>
          <CardDescription>Objetivos que puedes completar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {challenges.map((challenge, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{challenge.title}</p>
                  <p className="text-sm text-gray-600">{challenge.description}</p>
                </div>
                <div className="text-right">
                  <Badge className="mb-1">{challenge.points} pts</Badge>
                  <p className="text-xs text-gray-500">{challenge.progress}/{challenge.target}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
