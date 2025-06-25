
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, Trophy, Sparkles } from 'lucide-react';

interface CommunityHeaderProps {
  userLevel: number;
  userPoints: number;
}

export const CommunityHeader = ({ userLevel, userPoints }: CommunityHeaderProps) => {
  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-100 rounded-lg p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-100 rounded-full p-3 mr-3">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Comunidad farmapro
              </h1>
            </div>
            
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Conecta con profesionales farmacéuticos, comparte experiencias y aprende juntos
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <Card className="bg-white/80 border-gray-200">
                <CardContent className="p-3 flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="text-gray-900 font-medium text-sm">Nivel {userLevel}</p>
                    <p className="text-gray-500 text-xs">Tu progreso</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 border-gray-200">
                <CardContent className="p-3 flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <p className="text-gray-900 font-medium text-sm">{userPoints} puntos</p>
                    <p className="text-gray-500 text-xs">Experiencia</p>
                  </div>
                </CardContent>
              </Card>

              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                <MessageSquare className="h-3 w-3 mr-1" />
                Miembro Activo
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
