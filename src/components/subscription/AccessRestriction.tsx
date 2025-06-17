
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface AccessRestrictionProps {
  children: ReactNode;
  requiredPlan: 'estudiante' | 'profesional' | 'premium';
  featureName: string;
  className?: string;
}

const planHierarchy = {
  freemium: 0,
  estudiante: 1,
  profesional: 2,
  premium: 3
};

const planNames = {
  estudiante: 'Estudiante',
  profesional: 'Profesional',
  premium: 'Premium'
};

export const AccessRestriction = ({ 
  children, 
  requiredPlan, 
  featureName, 
  className = "" 
}: AccessRestrictionProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const currentPlan = profile?.subscription_role || 'freemium';
  const currentPlanLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0;
  const requiredPlanLevel = planHierarchy[requiredPlan];
  
  const hasAccess = currentPlanLevel >= requiredPlanLevel;

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Contenido borroso */}
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay de restricción */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg"
      >
        <Card className="max-w-md mx-4 shadow-xl border-2 border-orange-200">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Acceso Restringido
            </h3>
            
            <p className="text-gray-600 mb-4">
              Para acceder a <strong>{featureName}</strong> necesitas actualizar a un plan superior.
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-800">
                <Crown className="h-4 w-4 inline mr-1" />
                Plan requerido: <strong>{planNames[requiredPlan]}</strong>
              </p>
            </div>
            
            <Button 
              onClick={() => navigate('/subscription')}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              Ver Planes Disponibles
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
