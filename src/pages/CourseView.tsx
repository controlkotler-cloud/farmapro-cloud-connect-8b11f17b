import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Users, Star, Award, AlertTriangle, Target, Trophy, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import CourseQuiz from '@/components/course/CourseQuiz';
import type { Database } from '@/integrations/supabase/types';
import { updateChallengeProgress } from '@/utils/challengeUtils';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

type Course = Database['public']['Tables']['courses']['Row'];
type Enrollment = Database['public']['Tables']['course_enrollments']['Row'];

interface CourseSection {
  id: string;
  title: string;
  content: string;
  duration: number;
}

const CourseView = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const { canAccessCourse, refreshLimits } = useSubscriptionLimits();

  // Contenido del curso DAFO
  const courseSections: CourseSection[] = [
    {
      id: 'introduccion',
      title: 'Introducción al Análisis DAFO',
      content: `
        <h3>¿Qué es el Análisis DAFO?</h3>
        <p>El análisis DAFO (Debilidades, Amenazas, Fortalezas y Oportunidades) es una herramienta estratégica fundamental para evaluar la situación actual de tu farmacia y planificar su futuro.</p>
        
        <h4>Beneficios del DAFO para tu farmacia:</h4>
        <ul>
          <li>Identificar ventajas competitivas</li>
          <li>Detectar áreas de mejora</li>
          <li>Anticipar amenazas del mercado</li>
          <li>Descubrir nuevas oportunidades de negocio</li>
        </ul>
        
        <p>Al finalizar este módulo comprenderás los fundamentos del análisis DAFO y su aplicación específica en el sector farmacéutico.</p>
      `,
      duration: 15
    },
    {
      id: 'fortalezas',
      title: 'Identificando Fortalezas',
      content: `
        <h3>Fortalezas de tu Farmacia</h3>
        <p>Las fortalezas son los recursos internos y capacidades que te dan ventaja competitiva. En el ámbito farmacéutico, pueden incluir:</p>
        
        <h4>Ejemplos de fortalezas comunes:</h4>
        <ul>
          <li><strong>Ubicación estratégica:</strong> Farmacia en zona de alta afluencia</li>
          <li><strong>Equipo especializado:</strong> Farmacéuticos con formación específica</li>
          <li><strong>Servicios diferenciados:</strong> Atención farmacéutica personalizada</li>
          <li><strong>Tecnología avanzada:</strong> Sistemas de gestión modernos</li>
          <li><strong>Relación con clientes:</strong> Base de clientes fidelizada</li>
        </ul>
        
        <h4>Ejercicio práctico:</h4>
        <p>Reflexiona sobre tu farmacia y anota al menos 5 fortalezas específicas que la distinguen de la competencia.</p>
      `,
      duration: 20
    },
    {
      id: 'debilidades',
      title: 'Analizando Debilidades',
      content: `
        <h3>Debilidades Internas</h3>
        <p>Las debilidades son limitaciones internas que pueden impedir el crecimiento. Identificarlas es el primer paso para superarlas.</p>
        
        <h4>Áreas comunes de debilidad:</h4>
        <ul>
          <li><strong>Recursos limitados:</strong> Falta de capital para inversiones</li>
          <li><strong>Formación del equipo:</strong> Necesidades de capacitación</li>
          <li><strong>Tecnología obsoleta:</strong> Sistemas anticuados</li>
          <li><strong>Gestión de inventario:</strong> Problemas de stock</li>
          <li><strong>Marketing limitado:</strong> Poca presencia digital</li>
        </ul>
        
        <h4>Importante:</h4>
        <p>Ser honesto sobre las debilidades no es negativo, es estratégico. Solo reconociendo las limitaciones podemos crear planes para superarlas.</p>
        
        <h4>Ejercicio:</h4>
        <p>Identifica 3-5 debilidades principales de tu farmacia y piensa en posibles soluciones para cada una.</p>
      `,
      duration: 25
    },
    {
      id: 'oportunidades',
      title: 'Detectando Oportunidades',
      content: `
        <h3>Oportunidades del Entorno</h3>
        <p>Las oportunidades son factores externos favorables que puedes aprovechar para crecer y mejorar tu posición competitiva.</p>
        
        <h4>Oportunidades actuales en el sector:</h4>
        <ul>
          <li><strong>Envejecimiento poblacional:</strong> Mayor demanda de servicios farmacéuticos</li>
          <li><strong>Digitalización:</strong> Nuevos canales de venta y comunicación</li>
          <li><strong>Servicios profesionales:</strong> SPD, vacunación, tests diagnósticos</li>
          <li><strong>Colaboraciones:</strong> Alianzas con centros médicos</li>
          <li><strong>Especialización:</strong> Nichos como dermofarmacia o nutrición</li>
        </ul>
        
        <h4>Cómo identificar oportunidades:</h4>
        <ol>
          <li>Analiza cambios demográficos en tu zona</li>
          <li>Observa tendencias de salud y bienestar</li>
          <li>Evalúa nuevas regulaciones favorables</li>
          <li>Estudia la competencia y sus carencias</li>
        </ol>
        
        <h4>Ejercicio:</h4>
        <p>Lista 5 oportunidades específicas para tu farmacia considerando tu entorno local y las tendencias del sector.</p>
      `,
      duration: 30
    },
    {
      id: 'amenazas',
      title: 'Evaluando Amenazas',
      content: `
        <h3>Amenazas Externas</h3>
        <p>Las amenazas son factores externos que pueden afectar negativamente a tu farmacia. Identificarlas te permite prepararte y mitigar riesgos.</p>
        
        <h4>Amenazas comunes del sector:</h4>
        <ul>
          <li><strong>Competencia online:</strong> Farmacias virtuales y marketplaces</li>
          <li><strong>Grandes cadenas:</strong> Expansión de cadenas farmacéuticas</li>
          <li><strong>Cambios regulatorios:</strong> Nuevas normativas restrictivas</li>
          <li><strong>Crisis económicas:</strong> Reducción del gasto en salud</li>
          <li><strong>Cambios demográficos:</strong> Despoblación rural</li>
        </ul>
        
        <h4>Estrategias de mitigación:</h4>
        <ul>
          <li>Diversificar servicios y productos</li>
          <li>Fortalecer la relación con clientes</li>
          <li>Mantenerse actualizado en regulaciones</li>
          <li>Crear alianzas estratégicas</li>
          <li>Innovar constantemente</li>
        </ul>
        
        <h4>Ejercicio:</h4>
        <p>Identifica las 3 amenazas más relevantes para tu farmacia y desarrolla un plan básico para cada una.</p>
      `,
      duration: 25
    },
    {
      id: 'matriz',
      title: 'Creando tu Matriz DAFO',
      content: `
        <h3>Construyendo la Matriz DAFO</h3>
        <p>Una vez identificados todos los elementos, es hora de crear tu matriz DAFO y desarrollar estrategias basadas en ella.</p>
        
        <h4>Estructura de la matriz:</h4>
        <div style="border: 1px solid #ccc; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="border: 1px solid #ccc; padding: 10px; background: #e8f5e8;"><strong>FORTALEZAS</strong><br/>- Ubicación privilegiada<br/>- Equipo cualificado<br/>- Clientes fieles</td>
              <td style="border: 1px solid #ccc; padding: 10px; background: #fff5e6;"><strong>DEBILIDADES</strong><br/>- Tecnología obsoleta<br/>- Poco marketing<br/>- Stock limitado</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 10px; background: #e6f3ff;"><strong>OPORTUNIDADES</strong><br/>- Envejecimiento población<br/>- Nuevos servicios SPD<br/>- Digitalización</td>
              <td style="border: 1px solid #ccc; padding: 10px; background: #ffe6e6;"><strong>AMENAZAS</strong><br/>- Competencia online<br/>- Grandes cadenas<br/>- Crisis económica</td>
            </tr>
          </table>
        </div>
        
        <h4>Estrategias derivadas:</h4>
        <ul>
          <li><strong>FO (Fortalezas + Oportunidades):</strong> Usar fortalezas para aprovechar oportunidades</li>
          <li><strong>FA (Fortalezas + Amenazas):</strong> Usar fortalezas para defenderse de amenazas</li>
          <li><strong>DO (Debilidades + Oportunidades):</strong> Superar debilidades aprovechando oportunidades</li>
          <li><strong>DA (Debilidades + Amenazas):</strong> Plan de contingencia para minimizar riesgos</li>
        </ul>
      `,
      duration: 35
    },
    {
      id: 'implementacion',
      title: 'Plan de Implementación',
      content: `
        <h3>De la Teoría a la Práctica</h3>
        <p>El análisis DAFO solo es útil si se traduce en acciones concretas. Aquí aprenderás a crear un plan de implementación efectivo.</p>
        
        <h4>Pasos para implementar tu DAFO:</h4>
        <ol>
          <li><strong>Priorizar:</strong> Ordena los elementos por importancia e impacto</li>
          <li><strong>Temporizar:</strong> Establece plazos realistas (corto, medio, largo plazo)</li>
          <li><strong>Asignar recursos:</strong> Define presupuesto y responsables</li>
          <li><strong>Crear métricas:</strong> Establece KPIs para medir el progreso</li>
          <li><strong>Revisar periódicamente:</strong> El DAFO debe actualizarse</li>
        </ol>
        
        <h4>Ejemplo de plan de acción:</h4>
        <ul>
          <li><strong>Corto plazo (1-3 meses):</strong> Implementar WhatsApp Business, mejorar escaparate</li>
          <li><strong>Medio plazo (3-12 meses):</strong> Lanzar servicios SPD, crear página web</li>
          <li><strong>Largo plazo (1-3 años):</strong> Expandir servicios, posible segunda ubicación</li>
        </ul>
        
        <h4>Herramientas de seguimiento:</h4>
        <p>Utiliza herramientas como Excel, Trello o software específico para hacer seguimiento de tu plan y ajustarlo según evolucionen las circunstancias.</p>
        
        <p><strong>¡Felicidades!</strong> Has completado el curso de Análisis DAFO para tu farmacia. Ahora tienes las herramientas necesarias para realizar un análisis estratégico completo y crear un plan de acción efectivo.</p>
      `,
      duration: 30
    }
  ];

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, profile?.id]);

  const loadCourseData = async () => {
    if (!courseId || !profile?.id) return;

    setLoading(true);
    
    // Load course details
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) {
      console.error('Error loading course:', courseError);
      setLoading(false);
      return;
    }

    setCourse(courseData);

    // Load enrollment
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (enrollmentError) {
      console.error('Error loading enrollment:', enrollmentError);
    } else if (enrollmentData) {
      setEnrollment(enrollmentData);
      // Calculate completed sections based on progress
      const progress = enrollmentData.progress || 0;
      const sectionsCompleted = Math.floor((progress / 100) * courseSections.length);
      setCompletedSections(new Set(Array.from({length: sectionsCompleted}, (_, i) => i)));
    }

    setLoading(false);
  };

  const updateProgress = async (newProgress: number) => {
    if (!enrollment || !profile?.id) return;

    const { error } = await supabase
      .from('course_enrollments')
      .update({ 
        progress: newProgress,
        completed_at: newProgress === 100 ? new Date().toISOString() : null
      })
      .eq('id', enrollment.id);

    if (error) {
      console.error('Error updating progress:', error);
    } else {
      setEnrollment(prev => prev ? { ...prev, progress: newProgress } : null);
      
      // Add points and update challenges when course is completed
      if (newProgress === 100) {
        try {
          // Add points for completing course using raw SQL to avoid the ambiguous column error
          const { error: pointsError } = await supabase.rpc('add_user_points', {
            user_id: profile.id,
            points: 100
          });
          
          if (pointsError) {
            console.error('Error adding completion points:', pointsError);
          }

          // Update challenge progress for course completion
          await updateChallengeProgress(profile.id, 'course_completed', 1);
          
          // Refresh subscription limits
          refreshLimits();
        } catch (error) {
          console.error('Error updating challenges:', error);
        }
      }
    }
  };

  const markSectionComplete = (sectionIndex: number) => {
    const newCompleted = new Set(completedSections);
    newCompleted.add(sectionIndex);
    setCompletedSections(newCompleted);
    
    const newProgress = Math.round((newCompleted.size / courseSections.length) * 100);
    updateProgress(newProgress);

    toast({
      title: "Módulo completado",
      description: "Has marcado este módulo como completado.",
    });
  };

  const nextSection = () => {
    if (currentSection < courseSections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const previousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleFinishCourse = () => {
    const allSectionsCompleted = completedSections.size === courseSections.length;
    
    if (!allSectionsCompleted) {
      const missingSections = courseSections.length - completedSections.size;
      toast({
        title: "Curso incompleto",
        description: `Debes completar todos los módulos antes de finalizar. Te faltan ${missingSections} módulos.`,
        variant: "destructive"
      });
      return;
    }

    setShowQuiz(true);
  };

  const handleQuizComplete = (passed: boolean, score: number) => {
    setQuizCompleted(true);
    setQuizPassed(passed);
    
    if (passed) {
      updateProgress(100);
      toast({
        title: "¡Felicidades!",
        description: `Has completado el curso con éxito con una puntuación del ${score}%. ¡Excelente trabajo!`,
      });
    } else {
      toast({
        title: "Quiz completado",
        description: `Has obtenido un ${score}%. Puedes repetir el quiz o repasar el contenido para mejorar.`,
        variant: "destructive"
      });
    }
  };

  const progressPercentage = enrollment?.progress || 0;
  const isCourseCompleted = enrollment?.completed_at !== null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Curso no encontrado</h1>
          <Button onClick={() => navigate('/formacion')}>
            Volver a Formación
          </Button>
        </div>
      </div>
    );
  }

  if (showQuiz) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setShowQuiz(false)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Curso</span>
          </Button>
          <div className="flex items-center space-x-2">
            {isCourseCompleted && (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completado
              </Badge>
            )}
            {course.is_premium && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                <Star className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
        </div>

        <CourseQuiz onComplete={handleQuizComplete} />

        {quizCompleted && quizPassed && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Award className="h-16 w-16 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-800">¡Curso Completado!</h2>
                <p className="text-green-700">
                  Has completado exitosamente el curso "DAFO para tu Farmacia". 
                  Ahora tienes las herramientas necesarias para realizar un análisis estratégico completo.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={() => navigate('/formacion')}>
                    Explorar Más Cursos
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Ir al Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Check if user can access this course
  if (!loading && course && !canAccessCourse(course.is_premium)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/formacion')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Formación</span>
          </Button>
        </div>

        <Card className="text-center p-8">
          <CardContent>
            <div className="space-y-4">
              <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto" />
              <h2 className="text-2xl font-bold">Límite de Plan Alcanzado</h2>
              <p className="text-gray-600">
                {course.is_premium ? 
                  'Este es un curso premium. Necesitas una suscripción premium para acceder.' :
                  'Has alcanzado el límite de cursos para tu plan actual este mes.'
                }
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => navigate('/subscription')}>
                  Ver Planes
                </Button>
                <Button variant="outline" onClick={() => navigate('/formacion')}>
                  Volver a Formación
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/formacion')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Formación</span>
        </Button>
        <div className="flex items-center space-x-2">
          {isCourseCompleted && (
            <Badge className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completado
            </Badge>
          )}
          {course.is_premium && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
              <Star className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      </div>

      {/* Course Info */}
      <Card className={isCourseCompleted ? 'border-green-200 bg-green-50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                {course.title}
                {isCourseCompleted && (
                  <CheckCircle className="h-6 w-6 text-green-600 ml-2" />
                )}
              </CardTitle>
              <CardDescription className="text-lg mt-2">{course.description}</CardDescription>
              {isCourseCompleted && (
                <p className="text-sm text-green-700 mt-2 font-medium">
                  ✅ Has completado este curso exitosamente. Puedes volver a revisarlo cuando quieras.
                </p>
              )}
            </div>
            <img 
              src={course.thumbnail_url || "/placeholder.svg"} 
              alt={course.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          </div>
          <div className="flex items-center space-x-6 mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              {Math.floor((course.duration_minutes || 0) / 60)}h {(course.duration_minutes || 0) % 60}m
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              {courseSections.length} módulos
            </div>
          </div>
          
          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso del curso</span>
              <span className="text-sm text-gray-600">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Course Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Modules List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Módulos del Curso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ScrollArea className="h-[400px]">
              {courseSections.map((section, index) => (
                <Button
                  key={section.id}
                  variant={currentSection === index ? "default" : "ghost"}
                  className="w-full justify-start text-left h-auto p-3 mb-2"
                  onClick={() => setCurrentSection(index)}
                >
                  <div className="flex items-center space-x-3">
                    {completedSections.has(index) ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm leading-tight">{section.title}</div>
                      <div className="text-xs text-gray-500">{section.duration} min</div>
                    </div>
                  </div>
                </Button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {courseSections[currentSection]?.title}
              </CardTitle>
              <Badge variant="outline">
                {courseSections[currentSection]?.duration} minutos
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full rounded-md border p-6">
              <motion.div
                key={currentSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="prose prose-lg max-w-none prose-headings:text-green-800 prose-h3:text-xl prose-h4:text-lg prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:mb-2"
                dangerouslySetInnerHTML={{ 
                  __html: courseSections[currentSection]?.content || '' 
                }}
              />
            </ScrollArea>
            
            {/* Navigation and Actions */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={previousSection}
                disabled={currentSection === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </Button>

              <div className="flex items-center space-x-3">
                {!completedSections.has(currentSection) && (
                  <Button
                    variant="outline"
                    onClick={() => markSectionComplete(currentSection)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como completado
                  </Button>
                )}
                
                {currentSection === courseSections.length - 1 ? (
                  <Button
                    onClick={handleFinishCourse}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                  >
                    <Award className="h-4 w-4" />
                    <span>Finalizar Curso</span>
                  </Button>
                ) : (
                  <Button
                    onClick={nextSection}
                    className="flex items-center space-x-2"
                  >
                    <span>Siguiente</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Warning if not all sections completed */}
            {currentSection === courseSections.length - 1 && completedSections.size < courseSections.length && (
              <Alert className="mt-4 border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-700">
                  Asegúrate de completar todos los módulos antes de finalizar el curso. 
                  Te faltan {courseSections.length - completedSections.size} módulos por completar.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourseView;
