
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const getQuizQuestions = (courseId: string): QuizQuestion[] => {
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
