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
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Users, Star, Award, AlertTriangle, Target, Trophy, Gift, Calendar, Lightbulb, BookOpen, TrendingUp, Shield, Zap, Brain } from 'lucide-react';
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
  icon: any;
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

  // Contenido del curso DAFO con mejor formato
  const courseSections: CourseSection[] = [
    {
      id: 'introduccion',
      title: 'Introducción al Análisis DAFO',
      icon: BookOpen,
      content: `
        <div class="space-y-6">
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-l-4 border-blue-500">
            <h3 class="text-2xl font-bold text-blue-800 mb-4 flex items-center">
              <span class="mr-3">🎯</span> ¿Qué es el Análisis DAFO?
            </h3>
            <p class="text-gray-700 text-lg leading-relaxed">
              El análisis DAFO (Debilidades, Amenazas, Fortalezas y Oportunidades) es una <strong>herramienta estratégica fundamental</strong> para evaluar la situación actual de tu farmacia y planificar su futuro.
            </p>
          </div>
          
          <div class="bg-green-50 p-6 rounded-lg">
            <h4 class="text-xl font-semibold text-green-800 mb-4 flex items-center">
              <span class="mr-3">✨</span> Beneficios del DAFO para tu farmacia:
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-bold">1</span>
                </div>
                <div>
                  <h5 class="font-semibold text-green-800">Identificar ventajas competitivas</h5>
                  <p class="text-green-700 text-sm">Descubre qué te hace único en el mercado</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-bold">2</span>
                </div>
                <div>
                  <h5 class="font-semibold text-green-800">Detectar áreas de mejora</h5>
                  <p class="text-green-700 text-sm">Identifica puntos débiles para fortalecer</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-bold">3</span>
                </div>
                <div>
                  <h5 class="font-semibold text-green-800">Anticipar amenazas del mercado</h5>
                  <p class="text-green-700 text-sm">Prepárate para los desafíos futuros</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-bold">4</span>
                </div>
                <div>
                  <h5 class="font-semibold text-green-800">Descubrir nuevas oportunidades</h5>
                  <p class="text-green-700 text-sm">Encuentra nichos de crecimiento</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
            <p class="text-gray-800 text-lg leading-relaxed">
              <strong>Al finalizar este módulo</strong> comprenderás los fundamentos del análisis DAFO y su aplicación específica en el sector farmacéutico. ¡Empezamos! 🚀
            </p>
          </div>
        </div>
      `,
      duration: 15
    },
    {
      id: 'fortalezas',
      title: 'Identificando Fortalezas',
      icon: TrendingUp,
      content: `
        <div class="space-y-6">
          <div class="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-lg border-l-4 border-emerald-500">
            <h3 class="text-2xl font-bold text-emerald-800 mb-4 flex items-center">
              <span class="mr-3">💪</span> Fortalezas de tu Farmacia
            </h3>
            <p class="text-gray-700 text-lg leading-relaxed">
              Las fortalezas son los <strong>recursos internos y capacidades</strong> que te dan ventaja competitiva. En el ámbito farmacéutico, pueden incluir:
            </p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-5 rounded-lg shadow-sm border border-emerald-100">
              <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <span class="text-white">📍</span>
                </div>
                <h4 class="font-semibold text-emerald-800">Ubicación estratégica</h4>
              </div>
              <p class="text-gray-600">Farmacia en zona de alta afluencia</p>
            </div>
            
            <div class="bg-white p-5 rounded-lg shadow-sm border border-emerald-100">
              <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <span class="text-white">👥</span>
                </div>
                <h4 class="font-semibold text-emerald-800">Equipo especializado</h4>
              </div>
              <p class="text-gray-600">Farmacéuticos con formación específica</p>
            </div>
            
            <div class="bg-white p-5 rounded-lg shadow-sm border border-emerald-100">
              <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <span class="text-white">🎯</span>
                </div>
                <h4 class="font-semibold text-emerald-800">Servicios diferenciados</h4>
              </div>
              <p class="text-gray-600">Atención farmacéutica personalizada</p>
            </div>
            
            <div class="bg-white p-5 rounded-lg shadow-sm border border-emerald-100">
              <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <span class="text-white">💻</span>
                </div>
                <h4 class="font-semibold text-emerald-800">Tecnología avanzada</h4>
              </div>
              <p class="text-gray-600">Sistemas de gestión modernos</p>
            </div>
            
            <div class="bg-white p-5 rounded-lg shadow-sm border border-emerald-100">
              <div class="flex items-center mb-3">
                <div class="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <span class="text-white">❤️</span>
                </div>
                <h4 class="font-semibold text-emerald-800">Relación con clientes</h4>
              </div>
              <p class="text-gray-600">Base de clientes fidelizada</p>
            </div>
          </div>
          
          <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h4 class="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <span class="mr-3">📝</span> Ejercicio práctico:
            </h4>
            <p class="text-blue-700 leading-relaxed">
              Reflexiona sobre tu farmacia y anota <strong>al menos 5 fortalezas específicas</strong> que la distinguen de la competencia. Piensa en qué aspectos tus clientes te eligen por encima de otras opciones.
            </p>
          </div>
        </div>
      `,
      duration: 20
    },
    {
      id: 'debilidades',
      title: 'Analizando Debilidades',
      icon: Shield,
      content: `
        <div class="space-y-6">
          <div class="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border-l-4 border-orange-500">
            <h3 class="text-2xl font-bold text-orange-800 mb-4 flex items-center">
              <span class="mr-3">⚠️</span> Debilidades Internas
            </h3>
            <p class="text-gray-700 text-lg leading-relaxed">
              Las debilidades son <strong>limitaciones internas</strong> que pueden impedir el crecimiento. Identificarlas es el primer paso para superarlas.
            </p>
          </div>
          
          <div class="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <div class="flex items-start space-x-3">
              <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span class="text-white">💡</span>
              </div>
              <div>
                <h4 class="font-semibold text-yellow-800 mb-2">Importante:</h4>
                <p class="text-yellow-700 leading-relaxed">
                  Ser honesto sobre las debilidades <strong>no es negativo, es estratégico</strong>. Solo reconociendo las limitaciones podemos crear planes para superarlas.
                </p>
              </div>
            </div>
          </div>
          
          <div class="space-y-4">
            <h4 class="text-xl font-semibold text-gray-800 mb-4">Áreas comunes de debilidad:</h4>
            
            <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-300">
              <div class="flex items-center mb-3">
                <span class="text-2xl mr-3">💰</span>
                <h5 class="font-semibold text-red-800">Recursos limitados</h5>
              </div>
              <p class="text-gray-600">Falta de capital para inversiones necesarias</p>
            </div>
            
            <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-300">
              <div class="flex items-center mb-3">
                <span class="text-2xl mr-3">📚</span>
                <h5 class="font-semibold text-red-800">Formación del equipo</h5>
              </div>
              <p class="text-gray-600">Necesidades de capacitación en nuevas áreas</p>
            </div>
            
            <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-300">
              <div class="flex items-center mb-3">
                <span class="text-2xl mr-3">🖥️</span>
                <h5 class="font-semibold text-red-800">Tecnología obsoleta</h5>
              </div>
              <p class="text-gray-600">Sistemas anticuados que limitan la eficiencia</p>
            </div>
            
            <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-300">
              <div class="flex items-center mb-3">
                <span class="text-2xl mr-3">📦</span>
                <h5 class="font-semibold text-red-800">Gestión de inventario</h5>
              </div>
              <p class="text-gray-600">Problemas de stock y rotación de productos</p>
            </div>
            
            <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-300">
              <div class="flex items-center mb-3">
                <span class="text-2xl mr-3">📱</span>
                <h5 class="font-semibold text-red-800">Marketing limitado</h5>
              </div>
              <p class="text-gray-600">Poca presencia digital y estrategias de comunicación</p>
            </div>
          </div>
          
          <div class="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h4 class="text-lg font-semibold text-purple-800 mb-3 flex items-center">
              <span class="mr-3">🎯</span> Ejercicio:
            </h4>
            <p class="text-purple-700 leading-relaxed">
              Identifica <strong>3-5 debilidades principales</strong> de tu farmacia y piensa en posibles soluciones para cada una. Recuerda: reconocer debilidades es el primer paso hacia la mejora.
            </p>
          </div>
        </div>
      `,
      duration: 25
    },
    {
      id: 'oportunidades',
      title: 'Detectando Oportunidades',
      icon: Lightbulb,
      content: `
        <div class="space-y-6">
          <div class="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-lg border-l-4 border-cyan-500">
            <h3 class="text-2xl font-bold text-cyan-800 mb-4 flex items-center">
              <span class="mr-3">🚀</span> Oportunidades del Entorno
            </h3>
            <p class="text-gray-700 text-lg leading-relaxed">
              Las oportunidades son <strong>factores externos favorables</strong> que puedes aprovechar para crecer y mejorar tu posición competitiva.
            </p>
          </div>
          
          <div class="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-lg">
            <h4 class="text-xl font-semibold text-green-800 mb-4 flex items-center">
              <span class="mr-3">🌟</span> Oportunidades actuales en el sector:
            </h4>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="bg-white p-4 rounded-lg shadow-sm">
                <div class="flex items-center mb-2">
                  <span class="text-2xl mr-3">👴</span>
                  <h5 class="font-semibold text-green-800">Envejecimiento poblacional</h5>
                </div>
                <p class="text-gray-600 text-sm">Mayor demanda de servicios farmacéuticos especializados</p>
              </div>
              
              <div class="bg-white p-4 rounded-lg shadow-sm">
                <div class="flex items-center mb-2">
                  <span class="text-2xl mr-3">📱</span>
                  <h5 class="font-semibold text-green-800">Digitalización</h5>
                </div>
                <p class="text-gray-600 text-sm">Nuevos canales de venta y comunicación con pacientes</p>
              </div>
              
              <div class="bg-white p-4 rounded-lg shadow-sm">
                <div class="flex items-center mb-2">
                  <span class="text-2xl mr-3">💉</span>
                  <h5 class="font-semibold text-green-800">Servicios profesionales</h5>
                </div>
                <p class="text-gray-600 text-sm">SPD, vacunación, tests diagnósticos</p>
              </div>
              
              <div class="bg-white p-4 rounded-lg shadow-sm">
                <div class="flex items-center mb-2">
                  <span class="text-2xl mr-3">🤝</span>
                  <h5 class="font-semibold text-green-800">Colaboraciones</h5>
                </div>
                <p class="text-gray-600 text-sm">Alianzas estratégicas con centros médicos</p>
              </div>
              
              <div class="bg-white p-4 rounded-lg shadow-sm">
                <div class="flex items-center mb-2">
                  <span class="text-2xl mr-3">🎯</span>
                  <h5 class="font-semibold text-green-800">Especialización</h5>
                </div>
                <p class="text-gray-600 text-sm">Nichos como dermofarmacia o nutrición deportiva</p>
              </div>
            </div>
          </div>
          
          <div class="bg-blue-50 p-6 rounded-lg">
            <h4 class="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <span class="mr-3">🔍</span> Cómo identificar oportunidades:
            </h4>
            
            <div class="space-y-3">
              <div class="flex items-start space-x-3">
                <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span class="text-white text-sm font-bold">1</span>
                </div>
                <p class="text-blue-700">Analiza cambios demográficos en tu zona</p>
              </div>
              
              <div class="flex items-start space-x-3">
                <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span class="text-white text-sm font-bold">2</span>
                </div>
                <p class="text-blue-700">Observa tendencias de salud y bienestar</p>
              </div>
              
              <div class="flex items-start space-x-3">
                <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span class="text-white text-sm font-bold">3</span>
                </div>
                <p class="text-blue-700">Evalúa nuevas regulaciones favorables</p>
              </div>
              
              <div class="flex items-start space-x-3">
                <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span class="text-white text-sm font-bold">4</span>
                </div>
                <p class="text-blue-700">Estudia la competencia y sus carencias</p>
              </div>
            </div>
          </div>
          
          <div class="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
            <h4 class="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
              <span class="mr-3">💡</span> Ejercicio:
            </h4>
            <p class="text-indigo-700 leading-relaxed">
              Lista <strong>5 oportunidades específicas</strong> para tu farmacia considerando tu entorno local y las tendencias del sector. Piensa en qué necesidades no están siendo cubiertas en tu área.
            </p>
          </div>
        </div>
      `,
      duration: 30
    },
    {
      id: 'amenazas',
      title: 'Evaluando Amenazas',
      icon: AlertTriangle,
      content: `
        <div class="space-y-6">
          <div class="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg border-l-4 border-red-500">
            <h3 class="text-2xl font-bold text-red-800 mb-4 flex items-center">
              <span class="mr-3">⚡</span> Amenazas Externas
            </h3>
            <p class="text-gray-700 text-lg leading-relaxed">
              Las amenazas son <strong>factores externos</strong> que pueden afectar negativamente a tu farmacia. Identificarlas te permite prepararte y mitigar riesgos.
            </p>
          </div>
          
          <div class="bg-gray-50 p-6 rounded-lg">
            <h4 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span class="mr-3">🚨</span> Amenazas comunes del sector:
            </h4>
            
            <div class="space-y-4">
              <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-400">
                <div class="flex items-center mb-3">
                  <span class="text-2xl mr-3">🛒</span>
                  <h5 class="font-semibold text-red-800">Competencia online</h5>
                </div>
                <p class="text-gray-600">Farmacias virtuales y marketplaces que compiten en precio</p>
              </div>
              
              <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-400">
                <div class="flex items-center mb-3">
                  <span class="text-2xl mr-3">🏢</span>
                  <h5 class="font-semibold text-red-800">Grandes cadenas</h5>
                </div>
                <p class="text-gray-600">Expansión de cadenas farmacéuticas con mayor poder de compra</p>
              </div>
              
              <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-400">
                <div class="flex items-center mb-3">
                  <span class="text-2xl mr-3">📋</span>
                  <h5 class="font-semibold text-red-800">Cambios regulatorios</h5>
                </div>
                <p class="text-gray-600">Nuevas normativas que pueden ser restrictivas</p>
              </div>
              
              <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-400">
                <div class="flex items-center mb-3">
                  <span class="text-2xl mr-3">📉</span>
                  <h5 class="font-semibold text-red-800">Crisis económicas</h5>
                </div>
                <p class="text-gray-600">Reducción del gasto en salud y productos no esenciales</p>
              </div>
              
              <div class="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-400">
                <div class="flex items-center mb-3">
                  <span class="text-2xl mr-3">🏘️</span>
                  <h5 class="font-semibold text-red-800">Cambios demográficos</h5>
                </div>
                <p class="text-gray-600">Despoblación rural o cambios en la estructura de edad</p>
              </div>
            </div>
          </div>
          
          <div class="bg-green-50 p-6 rounded-lg border border-green-200">
            <h4 class="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <span class="mr-3">🛡️</span> Estrategias de mitigación:
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white">🔄</span>
                </div>
                <div>
                  <h5 class="font-medium text-green-800">Diversificar servicios</h5>
                  <p class="text-green-700 text-sm">Amplía tu oferta de productos y servicios</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white">❤️</span>
                </div>
                <div>
                  <h5 class="font-medium text-green-800">Fortalecer relaciones</h5>
                  <p class="text-green-700 text-sm">Crea vínculos más fuertes con tus clientes</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white">📚</span>
                </div>
                <div>
                  <h5 class="font-medium text-green-800">Mantenerse actualizado</h5>
                  <p class="text-green-700 text-sm">Sigue las regulaciones y tendencias</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white">🤝</span>
                </div>
                <div>
                  <h5 class="font-medium text-green-800">Crear alianzas</h5>
                  <p class="text-green-700 text-sm">Desarrolla partnerships estratégicos</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <h4 class="text-lg font-semibold text-orange-800 mb-3 flex items-center">
              <span class="mr-3">📋</span> Ejercicio:
            </h4>
            <p class="text-orange-700 leading-relaxed">
              Identifica las <strong>3 amenazas más relevantes</strong> para tu farmacia y desarrolla un plan básico para cada una. Recuerda: estar preparado es la mejor defensa.
            </p>
          </div>
        </div>
      `,
      duration: 25
    },
    {
      id: 'matriz',
      title: 'Creando tu Matriz DAFO',
      icon: Target,
      content: `
        <div class="space-y-6">
          <div class="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border-l-4 border-purple-500">
            <h3 class="text-2xl font-bold text-purple-800 mb-4 flex items-center">
              <span class="mr-3">📊</span> Construyendo la Matriz DAFO
            </h3>
            <p class="text-gray-700 text-lg leading-relaxed">
              Una vez identificados todos los elementos, es hora de crear tu matriz DAFO y desarrollar <strong>estrategias basadas en ella</strong>.
            </p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg border">
            <h4 class="text-xl font-semibold text-gray-800 mb-4 text-center">Estructura de la matriz DAFO</h4>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <h5 class="font-bold text-green-800 mb-3 flex items-center">
                  <span class="mr-2">💪</span> FORTALEZAS
                </h5>
                <ul class="text-sm text-green-700 space-y-1">
                  <li>• Ubicación privilegiada</li>
                  <li>• Equipo cualificado</li>
                  <li>• Clientes fieles</li>
                  <li>• Tecnología moderna</li>
                </ul>
              </div>
              
              <div class="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                <h5 class="font-bold text-orange-800 mb-3 flex items-center">
                  <span class="mr-2">⚠️</span> DEBILIDADES
                </h5>
                <ul class="text-sm text-orange-700 space-y-1">
                  <li>• Tecnología obsoleta</li>
                  <li>• Poco marketing</li>
                  <li>• Stock limitado</li>
                  <li>• Recursos escasos</li>
                </ul>
              </div>
              
              <div class="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <h5 class="font-bold text-blue-800 mb-3 flex items-center">
                  <span class="mr-2">🚀</span> OPORTUNIDADES
                </h5>
                <ul class="text-sm text-blue-700 space-y-1">
                  <li>• Envejecimiento población</li>
                  <li>• Nuevos servicios SPD</li>
                  <li>• Digitalización</li>
                  <li>• Colaboraciones médicas</li>
                </ul>
              </div>
              
              <div class="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                <h5 class="font-bold text-red-800 mb-3 flex items-center">
                  <span class="mr-2">⚡</span> AMENAZAS
                </h5>
                <ul class="text-sm text-red-700 space-y-1">
                  <li>• Competencia online</li>
                  <li>• Grandes cadenas</li>
                  <li>• Crisis económica</li>
                  <li>• Cambios regulatorios</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg">
            <h4 class="text-xl font-semibold text-indigo-800 mb-4 flex items-center">
              <span class="mr-3">🎯</span> Estrategias derivadas:
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-white p-4 rounded-lg shadow-sm">
                <h5 class="font-semibold text-green-800 mb-2 flex items-center">
                  <span class="mr-2">💪🚀</span> FO (Fortalezas + Oportunidades)
                </h5>
                <p class="text-sm text-gray-600">Usar fortalezas para aprovechar oportunidades</p>
              </div>
              
              <div class="bg-white p-4 rounded-lg shadow-sm">
                <h5 class="font-semibold text-blue-800 mb-2 flex items-center">
                  <span class="mr-2">💪⚡</span> FA (Fortalezas + Amenazas)
                </h5>
                <p class="text-sm text-gray-600">Usar fortalezas para defenderse de amenazas</p>
              </div>
              
              <div class="bg-white p-4 rounded-lg shadow-sm">
                <h5 class="font-semibold text-orange-800 mb-2 flex items-center">
                  <span class="mr-2">⚠️🚀</span> DO (Debilidades + Oportunidades)
                </h5>
                <p class="text-sm text-gray-600">Superar debilidades aprovechando oportunidades</p>
              </div>
              
              <div class="bg-white p-4 rounded-lg shadow-sm">
                <h5 class="font-semibold text-red-800 mb-2 flex items-center">
                  <span class="mr-2">⚠️⚡</span> DA (Debilidades + Amenazas)
                </h5>
                <p class="text-sm text-gray-600">Plan de contingencia para minimizar riesgos</p>
              </div>
            </div>
          </div>
          
          <div class="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h4 class="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
              <span class="mr-3">✏️</span> Tu turno:
            </h4>
            <p class="text-yellow-700 leading-relaxed">
              Ahora es momento de crear tu propia matriz DAFO. Toma los elementos que has identificado en los módulos anteriores y organízalos en esta estructura. ¡Este será tu mapa estratégico!
            </p>
          </div>
        </div>
      `,
      duration: 35
    },
    {
      id: 'implementacion',
      title: 'Plan de Implementación',
      icon: Zap,
      content: `
        <div class="space-y-6">
          <div class="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg border-l-4 border-teal-500">
            <h3 class="text-2xl font-bold text-teal-800 mb-4 flex items-center">
              <span class="mr-3">⚡</span> De la Teoría a la Práctica
            </h3>
            <p class="text-gray-700 text-lg leading-relaxed">
              El análisis DAFO solo es útil si se traduce en <strong>acciones concretas</strong>. Aquí aprenderás a crear un plan de implementación efectivo.
            </p>
          </div>
          
          <div class="bg-blue-50 p-6 rounded-lg">
            <h4 class="text-xl font-semibold text-blue-800 mb-4 flex items-center">
              <span class="mr-3">📋</span> Pasos para implementar tu DAFO:
            </h4>
            
            <div class="space-y-4">
              <div class="flex items-start space-x-4">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-bold">1</span>
                </div>
                <div>
                  <h5 class="font-semibold text-blue-800">Priorizar</h5>
                  <p class="text-blue-700">Ordena los elementos por importancia e impacto potencial</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-4">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-bold">2</span>
                </div>
                <div>
                  <h5 class="font-semibold text-blue-800">Temporizar</h5>
                  <p class="text-blue-700">Establece plazos realistas (corto, medio, largo plazo)</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-4">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-bold">3</span>
                </div>
                <div>
                  <h5 class="font-semibold text-blue-808">Asignar recursos</h5>
                  <p class="text-blue-700">Define presupuesto y responsables para cada acción</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-4">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-bold">4</span>
                </div>
                <div>
                  <h5 class="font-semibold text-blue-800">Crear métricas</h5>
                  <p class="text-blue-700">Establece KPIs para medir el progreso</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-4">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white font-bold">5</span>
                </div>
                <div>
                  <h5 class="font-semibold text-blue-800">Revisar periódicamente</h5>
                  <p class="text-blue-700">El DAFO debe actualizarse con regularidad</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-green-50 p-6 rounded-lg border border-green-200">
            <h4 class="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <span class="mr-3">📅</span> Ejemplo de plan de acción:
            </h4>
            
            <div class="space-y-4">
              <div class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-400">
                <h5 class="font-semibold text-green-800 flex items-center mb-2">
                  <span class="mr-2">🚀</span> Corto plazo (1-3 meses)
                </h5>
                <ul class="text-green-700 text-sm space-y-1">
                  <li>• Implementar WhatsApp Business para atención al cliente</li>
                  <li>• Mejorar escaparate y señalización exterior</li>
                  <li>• Crear perfiles en redes sociales básicas</li>
                </ul>
              </div>
              
              <div class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-400">
                <h5 class="font-semibold text-yellow-800 flex items-center mb-2">
                  <span class="mr-2">📈</span> Medio plazo (3-12 meses)
                </h5>
                <ul class="text-yellow-700 text-sm space-y-1">
                  <li>• Lanzar servicios SPD (Seguimiento Farmacoterapéutico)</li>
                  <li>• Crear página web profesional</li>
                  <li>• Implementar sistema de gestión más avanzado</li>
                </ul>
              </div>
              
              <div class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-400">
                <h5 class="font-semibold text-purple-800 flex items-center mb-2">
                  <span class="mr-2">🎯</span> Largo plazo (1-3 años)
                </h5>
                <ul class="text-purple-700 text-sm space-y-1">
                  <li>• Expandir servicios especializados (nutrición, dermofarmacia)</li>
                  <li>• Evaluar posible segunda ubicación</li>
                  <li>• Desarrollar programa de fidelización avanzado</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 p-6 rounded-lg">
            <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <span class="mr-3">🛠️</span> Herramientas de seguimiento:
            </h4>
            <p class="text-gray-700 leading-relaxed">
              Utiliza herramientas como <strong>Excel, Trello o software específico</strong> para hacer seguimiento de tu plan y ajustarlo según evolucionen las circunstancias. La clave está en la consistencia del seguimiento.
            </p>
          </div>
          
          <div class="bg-gradient-to-r from-gold-50 to-yellow-50 p-8 rounded-lg border-2 border-yellow-300 text-center">
            <div class="flex justify-center mb-4">
              <div class="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                <span class="text-white text-2xl">🏆</span>
              </div>
            </div>
            <h4 class="text-2xl font-bold text-yellow-800 mb-3">¡Felicidades!</h4>
            <p class="text-yellow-700 leading-relaxed text-lg">
              Has completado el curso de <strong>Análisis DAFO para tu farmacia</strong>. Ahora tienes las herramientas necesarias para realizar un análisis estratégico completo y crear un plan de acción efectivo.
            </p>
            <div class="mt-4 p-4 bg-yellow-100 rounded-lg">
              <p class="text-yellow-800 font-medium">
                🎯 <strong>Próximo paso:</strong> Completa el quiz final para certificar tus conocimientos
              </p>
            </div>
          </div>
        </div>
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

  const formatCompletionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

      {/* Course Completion Status - New section */}
      {isCourseCompleted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4">
              <Award className="h-8 w-8 text-green-600" />
              <div className="text-center">
                <h3 className="text-lg font-bold text-green-800">¡Curso Completado!</h3>
                <div className="flex items-center justify-center space-x-2 text-sm text-green-700 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>Completado el {formatCompletionDate(enrollment?.completed_at || '')}</span>
                </div>
                <p className="text-sm text-green-600 mt-1">Puedes volver a revisar el contenido cuando quieras</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              {courseSections.map((section, index) => {
                const IconComponent = section.icon;
                return (
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
                      <IconComponent className="h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm leading-tight">{section.title}</div>
                        <div className="text-xs text-gray-500">{section.duration} min</div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center">
                {React.createElement(courseSections[currentSection]?.icon, { className: "h-6 w-6 mr-3" })}
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
