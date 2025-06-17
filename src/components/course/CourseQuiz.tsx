import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface CourseQuizProps {
  courseId: string;
  courseTitle: string;
  onComplete: (passed: boolean, score: number) => void;
}

const CourseQuiz: React.FC<CourseQuizProps> = ({ courseId, courseTitle, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Quiz questions based on course ID
  const getQuizQuestions = (courseId: string): QuizQuestion[] => {
    const quizzes: Record<string, QuizQuestion[]> = {
      'dafo': [
        {
          id: 'q1',
          question: '¿Qué significa la sigla DAFO?',
          options: [
            'Debilidades, Amenazas, Fortalezas, Oportunidades',
            'Datos, Análisis, Finanzas, Objetivos',
            'Desarrollo, Actividades, Funciones, Organización',
            'Diagnóstico, Aplicación, Funcionalidad, Operaciones'
          ],
          correctAnswer: 0,
          explanation: 'DAFO significa Debilidades, Amenazas, Fortalezas y Oportunidades. Es una herramienta de análisis estratégico.'
        },
        {
          id: 'q2',
          question: '¿Cuáles son factores INTERNOS en un análisis DAFO?',
          options: [
            'Oportunidades y Amenazas',
            'Fortalezas y Debilidades',
            'Solo las Fortalezas',
            'Competencia y mercado'
          ],
          correctAnswer: 1,
          explanation: 'Las Fortalezas y Debilidades son factores internos de la farmacia que podemos controlar y mejorar.'
        },
        {
          id: 'q3',
          question: '¿Qué estrategia combina Fortalezas con Oportunidades?',
          options: [
            'Estrategia DA (Defensiva)',
            'Estrategia DO (Adaptativa)',
            'Estrategia FO (Ofensiva)',
            'Estrategia FA (Reactiva)'
          ],
          correctAnswer: 2,
          explanation: 'La estrategia FO (Fortalezas-Oportunidades) es ofensiva: usar nuestras fortalezas para aprovechar las oportunidades del mercado.'
        },
        {
          id: 'q4',
          question: '¿Cuál es un ejemplo de OPORTUNIDAD para una farmacia?',
          options: [
            'Personal poco cualificado',
            'Competencia de cadenas grandes',
            'Envejecimiento de la población',
            'Crisis económica'
          ],
          correctAnswer: 2,
          explanation: 'El envejecimiento poblacional es una oportunidad porque aumenta la demanda de servicios farmacéuticos y productos de salud.'
        },
        {
          id: 'q5',
          question: '¿Con qué frecuencia se recomienda actualizar el análisis DAFO?',
          options: [
            'Solo una vez al año',
            'Cada 5 años',
            'Periódicamente (cada 6-12 meses)',
            'Solo cuando hay problemas'
          ],
          correctAnswer: 2,
          explanation: 'El DAFO debe revisarse periódicamente (cada 6-12 meses) porque el entorno y la farmacia cambian constantemente.'
        }
      ],
      'marketing': [
        {
          id: 'q1',
          question: '¿Cuál es la principal ventaja del marketing digital para farmacias?',
          options: [
            'Es más barato que el marketing tradicional',
            'Permite llegar a audiencias específicas y medir resultados',
            'No requiere conocimientos técnicos',
            'Garantiza ventas inmediatas'
          ],
          correctAnswer: 1,
          explanation: 'El marketing digital permite segmentación precisa, medición de resultados y personalización del mensaje.'
        },
        {
          id: 'q2',
          question: '¿Qué es el SEO local para farmacias?',
          options: [
            'Vender productos locales únicamente',
            'Optimizar para aparecer en búsquedas geográficas cercanas',
            'Hacer publicidad solo en medios locales',
            'Contratar personal de la zona'
          ],
          correctAnswer: 1,
          explanation: 'El SEO local optimiza la presencia online para aparecer cuando buscan "farmacia cerca" o servicios en tu zona.'
        }
      ],
      'liderazgo': [
        {
          id: 'q1',
          question: '¿Cuál es la diferencia principal entre un jefe y un líder?',
          options: [
            'El jefe tiene más experiencia',
            'El líder inspira, el jefe ordena',
            'El jefe gana más dinero',
            'No hay diferencias significativas'
          ],
          correctAnswer: 1,
          explanation: 'Un líder inspira y motiva al equipo, mientras que un jefe se limita a dar órdenes y controlar.'
        }
      ],
      'atencion_cliente': [
        {
          id: 'q1',
          question: '¿Cuál es el primer paso para manejar una queja de cliente?',
          options: [
            'Explicar por qué está equivocado',
            'Escuchar activamente sin interrumpir',
            'Ofrecer inmediatamente una solución',
            'Derivar a un supervisor'
          ],
          correctAnswer: 1,
          explanation: 'La escucha activa es fundamental para entender realmente el problema y hacer que el cliente se sienta valorado.'
        }
      ],
      'tecnologia': [
        {
          id: 'q1',
          question: '¿Cuál es el principal beneficio de automatizar procesos en la farmacia?',
          options: [
            'Reducir el número de empleados',
            'Liberar tiempo para atención al paciente',
            'Aumentar los precios',
            'Eliminar el contacto humano'
          ],
          correctAnswer: 1,
          explanation: 'La automatización libera tiempo valioso del farmacéutico para enfocarse en el cuidado directo del paciente.'
        }
      ]
    };

    return quizzes[courseId] || [];
  };

  const quizQuestions = getQuizQuestions(courseId);

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNextQuestion = () => {
    if (selectedOption === null) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = selectedOption;
    setSelectedAnswers(newAnswers);
    setSelectedOption(null);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calcular resultados
      const correctCount = newAnswers.reduce((count, answer, index) => {
        return answer === quizQuestions[index].correctAnswer ? count + 1 : count;
      }, 0);
      
      setShowResults(true);
      const score = Math.round((correctCount / quizQuestions.length) * 100);
      const passed = score >= 70;
      onComplete(passed, score);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setSelectedOption(null);
  };

  const calculateScore = () => {
    const correctCount = selectedAnswers.reduce((count, answer, index) => {
      return answer === quizQuestions[index].correctAnswer ? count + 1 : count;
    }, 0);
    return Math.round((correctCount / quizQuestions.length) * 100);
  };

  if (showResults) {
    const score = calculateScore();
    const passed = score >= 70;

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {passed ? (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-8 w-8" />
                <span>¡Felicidades! Quiz Completado</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-orange-600">
                <XCircle className="h-8 w-8" />
                <span>Quiz Completado - Necesitas Mejorar</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {score}%
            </div>
            <Badge variant={passed ? "default" : "destructive"} className="text-lg px-4 py-2">
              {selectedAnswers.filter((answer, index) => answer === quizQuestions[index].correctAnswer).length} / {quizQuestions.length} correctas
            </Badge>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Revisión de Respuestas:</h3>
            {quizQuestions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{question.question}</p>
                      <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        Tu respuesta: {question.options[userAnswer]}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-600">
                          Respuesta correcta: {question.options[question.correctAnswer]}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={resetQuiz} variant="outline" className="flex items-center space-x-2">
              <RotateCcw className="h-4 w-4" />
              <span>Repetir Quiz</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-gray-600">Quiz no disponible para este curso.</p>
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Quiz de Evaluación - {courseTitle}</CardTitle>
          <Badge variant="outline">
            {currentQuestion + 1} / {quizQuestions.length}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4">
            {quizQuestions[currentQuestion].question}
          </h3>
          
          <div className="space-y-3">
            {quizQuestions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedOption === index
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedOption === index
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedOption === index && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-end">
          <Button 
            onClick={handleNextQuestion}
            disabled={selectedOption === null}
            className="px-6"
          >
            {currentQuestion < quizQuestions.length - 1 ? 'Siguiente' : 'Finalizar Quiz'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseQuiz;
