
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Crown, GraduationCap, Briefcase, Sparkles, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const plans = [
  {
    id: 'freemium',
    name: 'Freemium',
    price: 'Gratis',
    duration: '7 días de prueba',
    icon: Sparkles,
    color: 'from-gray-400 to-gray-600',
    features: [
      'Acceso a 1 curso',
      'Máximo 2 descargas',
      'Ver comunidad (solo lectura)',
      'Retos básicos'
    ],
    popular: false,
    disabled: true,
  },
  {
    id: 'estudiante',
    name: 'Estudiante',
    price: '5€',
    duration: '/mes',
    icon: GraduationCap,
    color: 'from-green-400 to-blue-500',
    features: [
      '1 curso al mes',
      '2 descargas al mes',
      'Acceso a bolsa de trabajo',
      'Farmacias en venta',
      'Verificación de matrícula requerida'
    ],
    popular: false,
    disabled: false,
    requiresValidation: true,
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: '29€',
    duration: '/mes',
    icon: Briefcase,
    color: 'from-blue-500 to-purple-600',
    features: [
      'Acceso completo a formación',
      'Descargas ilimitadas',
      'Comunidad completa',
      'Retos avanzados',
      'Eventos exclusivos'
    ],
    popular: true,
    disabled: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '39€',
    duration: '/mes',
    icon: Crown,
    color: 'from-yellow-400 to-orange-500',
    features: [
      'Todo lo anterior',
      'Promociones exclusivas',
      'Publicar ofertas de empleo',
      'Vender tu farmacia',
      'Formaciones premium',
      'Soporte prioritario'
    ],
    popular: false,
    disabled: false,
  },
];

export const SubscriptionPlans = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [showStudentValidation, setShowStudentValidation] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const { profile } = useAuth();

  const handleSubscribe = async (planId: string) => {
    if (planId === 'freemium') return;
    
    if (planId === 'estudiante') {
      setShowStudentValidation(true);
      return;
    }
    
    setLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: planId },
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Redirigiendo a Stripe",
        description: "Se ha abierto una nueva pestaña para completar el pago",
      });
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la suscripción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingDocument(true);
    try {
      // Here you would typically upload to Supabase Storage
      // For now, we'll just update the profile with pending validation
      const { error } = await supabase
        .from('profiles')
        .update({ 
          student_verification_status: 'pending',
          student_document_url: 'uploaded_document.pdf' // This would be the actual uploaded file URL
        })
        .eq('id', profile?.id);

      if (error) throw error;

      toast({
        title: "Documento subido",
        description: "Tu matrícula ha sido enviada para validación. Te notificaremos cuando sea aprobada.",
      });
      
      setShowStudentValidation(false);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el documento. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  const getCurrentPlan = () => {
    return profile?.subscription_role || 'freemium';
  };

  const getStudentValidationStatus = () => {
    return profile?.student_verification_status || 'pending';
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Planes de Suscripción
        </h2>
        <p className="text-xl text-gray-600">
          Elige el plan que mejor se adapte a tu perfil profesional
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          const isCurrentPlan = getCurrentPlan() === plan.id;
          const isStudentPending = plan.id === 'estudiante' && getStudentValidationStatus() === 'pending';
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col h-full"
            >
              <Card className={`h-full relative transition-all duration-200 hover:shadow-lg flex flex-col ${
                plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''
              } ${isCurrentPlan ? 'ring-2 ring-green-600' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Más Popular
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600">
                    Plan Actual
                  </Badge>
                )}
                {isStudentPending && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600">
                    Validación Pendiente
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.duration}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-auto">
                    <Button 
                      className={`w-full ${
                        plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''
                      } ${isCurrentPlan ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      variant={plan.popular || isCurrentPlan ? 'default' : 'outline'}
                      disabled={plan.disabled || isCurrentPlan || loading === plan.id || isStudentPending}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {loading === plan.id ? (
                        'Procesando...'
                      ) : isCurrentPlan ? (
                        'Plan Actual'
                      ) : plan.disabled ? (
                        'Tu Plan Actual'
                      ) : isStudentPending ? (
                        'Validación Pendiente'
                      ) : (
                        `Elegir ${plan.name}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Student Validation Modal */}
      {showStudentValidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Validación de Estudiante</h3>
            <p className="text-gray-600 mb-4">
              Para acceder al plan de estudiante, necesitas subir tu matrícula actual del curso que estás realizando.
            </p>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <label htmlFor="student-document" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Seleccionar archivo de matrícula
                  </span>
                  <input
                    id="student-document"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploadingDocument}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, JPG o PNG (máx. 5MB)
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowStudentValidation(false)}
                  className="flex-1"
                  disabled={uploadingDocument}
                >
                  Cancelar
                </Button>
              </div>
            </div>
            
            {uploadingDocument && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Subiendo documento...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
