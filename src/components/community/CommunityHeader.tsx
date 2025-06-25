
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, Trophy, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface CommunityHeaderProps {
  userLevel: number;
  userPoints: number;
}

export const CommunityHeader = ({ userLevel, userPoints }: CommunityHeaderProps) => {
  return (
    <div className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      </div>

      <div className="relative px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mr-4">
                <Users className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-white">
                Comunidad <span className="text-yellow-300">farmapro</span>
              </h1>
            </div>
            
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Conecta con miles de profesionales farmacéuticos, comparte experiencias y aprende juntos. 
              Tu lugar para crecer profesionalmente.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="p-4 flex items-center space-x-3">
                  <Trophy className="h-6 w-6 text-yellow-300" />
                  <div className="text-left">
                    <p className="text-white font-semibold">Nivel {userLevel}</p>
                    <p className="text-blue-100 text-sm">Tu progreso</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="p-4 flex items-center space-x-3">
                  <Sparkles className="h-6 w-6 text-yellow-300" />
                  <div className="text-left">
                    <p className="text-white font-semibold">{userPoints} puntos</p>
                    <p className="text-blue-100 text-sm">Experiencia acumulada</p>
                  </div>
                </CardContent>
              </Card>

              <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 px-4 py-2 text-base font-semibold">
                <MessageSquare className="h-4 w-4 mr-2" />
                Miembro Activo
              </Badge>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
