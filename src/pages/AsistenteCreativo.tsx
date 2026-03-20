import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreativeHeader } from '@/components/creative/CreativeHeader';
import { CreativeWorkspace } from '@/components/creative/CreativeWorkspace';

export default function AsistenteCreativo() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const allowedRoles = ['premium', 'profesional', 'admin'];
  const hasAccess = profile && allowedRoles.includes(profile.subscription_role) && profile.subscription_status === 'active';

  if (!hasAccess) {
    return (
      <div className="space-y-8">
        <CreativeHeader />
        <div className="rounded-2xl bg-gradient-to-br from-green-50 via-white to-emerald-50 ring-1 ring-green-100 p-10 text-center max-w-xl mx-auto">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 text-green-600 mx-auto mb-5">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">IAFarma está incluido en tu suscripción</h2>
          <p className="text-gray-500 mb-6">
            Accede a 7 tipos de contenido optimizado para farmacia, generados con inteligencia artificial y adaptados a la normativa farmacéutica.
          </p>
          <Button
            onClick={() => navigate('/precios')}
            className="bg-green-500 hover:bg-green-600 text-white"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Ver planes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CreativeHeader />
      <CreativeWorkspace />
    </div>
  );
}
