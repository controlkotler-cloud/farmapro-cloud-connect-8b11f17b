import { Sparkles, Zap, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const CreativeHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            IAFarma
          </h1>
          <p className="text-muted-foreground mt-1">
            Genera contenido profesional para tu farmacia con inteligencia artificial
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Generaciones hoy</p>
              <p className="text-2xl font-bold text-purple-700">12</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo más usado</p>
              <p className="text-lg font-bold text-pink-700">Redes Sociales</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contenido generado</p>
              <p className="text-2xl font-bold text-blue-700">248</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
