import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, BookOpen, Download, MessageSquare, Star } from 'lucide-react';

export const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalPoints: 0,
    level: 1,
    coursesCompleted: 0,
    resourcesDownloaded: 0,
    forumPosts: 0,
    challengesCompleted: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadUserStats();
    loadRecentActivity();
  }, []);

  const loadUserStats = async () => {
    if (!profile?.id) return;

    // Get user points
    const { data: points } = await supabase
      .from('user_points')
      .select('total_points, level')
      .eq('user_id', profile.id)
      .single();

    // Get courses completed
    const { data: courses } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', profile.id)
      .not('completed_at', 'is', null);

    // Get resources downloaded
    const { data: resources } = await supabase
      .from('resource_downloads')
      .select('id')
      .eq('user_id', profile.id);

    // Get forum posts
    const { data: posts } = await supabase
      .from('forum_threads')
      .select('id')
      .eq('author_id', profile.id);

    // Get challenges completed
    const { data: challenges } = await supabase
      .from('user_challenge_progress')
      .select('id')
      .eq('user_id', profile.id)
      .not('completed_at', 'is', null);

    setStats({
      totalPoints: points?.total_points || 0,
      level: points?.level || 1,
      coursesCompleted: courses?.length || 0,
      resourcesDownloaded: resources?.length || 0,
      forumPosts: posts?.length || 0,
      challengesCompleted: challenges?.length || 0,
    });
  };

  const loadRecentActivity = async () => {
    // This would load recent user activity
    setRecentActivity([
      { type: 'course', title: 'Completaste "DAFO para tu Farmacia"', date: '2 horas ago', points: 100 },
      { type: 'resource', title: 'Descargaste "Protocolo de Atención al Cliente"', date: '1 día ago', points: 50 },
      { type: 'forum', title: 'Creaste un nuevo hilo en Gestión', date: '3 días ago', points: 100 },
    ]);
  };

  const getNextLevelProgress = () => {
    const pointsForNextLevel = stats.level * 1000;
    const currentLevelPoints = stats.totalPoints % 1000;
    return (currentLevelPoints / pointsForNextLevel) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))/90] text-white">
          <CardHeader>
            <CardTitle className="text-2xl">
              ¡Bienvenido de nuevo, {profile?.full_name}!
            </CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Continúa tu desarrollo profesional en el sector farmacéutico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-yellow-300" />
                <span className="text-xl font-bold">Nivel {stats.level}</span>
              </div>
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-sm mb-1">
                  <span>{stats.totalPoints} puntos</span>
                  <span>Siguiente nivel: {(stats.level + 1) * 1000}</span>
                </div>
                <Progress value={getNextLevelProgress()} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <BookOpen className="h-8 w-8 text-white" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-100">Cursos Completados</p>
                  <p className="text-2xl font-bold text-white">{stats.coursesCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <Download className="h-8 w-8 text-white" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-100">Recursos Descargados</p>
                  <p className="text-2xl font-bold text-white">{stats.resourcesDownloaded}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <MessageSquare className="h-8 w-8 text-white" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-100">Posts en Foro</p>
                  <p className="text-2xl font-bold text-white">{stats.forumPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white h-32">
            <CardContent className="p-6 h-full">
              <div className="flex items-center h-full">
                <Target className="h-8 w-8 text-white" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-100">Retos Completados</p>
                  <p className="text-2xl font-bold text-white">{stats.challengesCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0">
                      {activity.type === 'course' && <BookOpen className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'resource' && <Download className="h-5 w-5 text-green-600" />}
                      {activity.type === 'forum' && <MessageSquare className="h-5 w-5 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">{activity.date}</p>
                        <Badge variant="secondary" className="text-xs">+{activity.points} pts</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">Estudiante Dedicado</p>
                    <p className="text-sm text-gray-600">Completa 5 cursos</p>
                  </div>
                  <div className="text-right">
                    <Badge className="mb-1">500 pts</Badge>
                    <p className="text-xs text-gray-500">{stats.coursesCompleted}/5</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">Coleccionista</p>
                    <p className="text-sm text-gray-600">Descarga 10 recursos</p>
                  </div>
                  <div className="text-right">
                    <Badge className="mb-1">300 pts</Badge>
                    <p className="text-xs text-gray-500">{stats.resourcesDownloaded}/10</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">Experto Colaborador</p>
                    <p className="text-sm text-gray-600">Realiza 50 respuestas en el foro</p>
                  </div>
                  <div className="text-right">
                    <Badge className="mb-1">1000 pts</Badge>
                    <p className="text-xs text-gray-500">0/50</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
