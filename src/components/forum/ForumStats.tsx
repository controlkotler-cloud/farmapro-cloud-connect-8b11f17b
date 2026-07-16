import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, TrendingUp, Award, Target } from 'lucide-react';

interface ForumStatsProps {
  totalThreads: number;
  totalReplies: number;
  userForumPosts: number;
  userLevel: number;
  userPoints: number;
}

export const ForumStats = ({
  totalThreads,
  totalReplies,
  userForumPosts,
  userLevel,
  userPoints
}: ForumStatsProps) => {
  const forumChallenges = [
    {
      title: "Participación Activa",
      description: "Responde a 5 hilos diferentes",
      progress: Math.min(userForumPosts, 5),
      target: 5,
      points: 250,
      completed: userForumPosts >= 5
    },
    {
      title: "Experto Colaborador",
      description: "Crea 3 hilos nuevos",
      progress: Math.min(Math.floor(userForumPosts / 3), 3),
      target: 3,
      points: 500,
      completed: userForumPosts >= 9
    }
  ];

  const stats = [
    { title: 'Total hilos', value: totalThreads, icon: MessageSquare },
    { title: 'Total respuestas', value: totalReplies, icon: Users },
    { title: 'Tus participaciones', value: userForumPosts, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Community Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-terracota-soft">
                <stat.icon className="h-5 w-5 text-terracota" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-terracota" />
            <span>Tu estado en la comunidad</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="outline" className="text-lg px-3 py-1">
              Nivel {userLevel}
            </Badge>
            <span className="text-sm text-muted-foreground">{userPoints} puntos farmapro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Sigue participando para subir de nivel y desbloquear beneficios
          </p>
        </CardContent>
      </Card>

      {/* Forum Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-terracota" />
            <span>Retos del foro</span>
          </CardTitle>
          <CardDescription>
            Completa estos retos para ganar puntos extra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forumChallenges.map((challenge, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  challenge.completed
                    ? 'bg-secondary border-success'
                    : 'bg-secondary border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{challenge.title}</h4>
                    {challenge.completed && (
                      <Badge className="bg-success text-success-foreground">Completado</Badge>
                    )}
                  </div>
                  <Badge variant="outline">+{challenge.points} pts</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{challenge.description}</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        challenge.completed ? 'bg-success' : 'bg-terracota'
                      }`}
                      style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {challenge.progress}/{challenge.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
