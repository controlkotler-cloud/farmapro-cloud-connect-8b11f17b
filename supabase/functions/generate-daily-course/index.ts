import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const COURSE_TOPICS = [
  'Gestión de inventarios farmacéuticos',
  'Atención farmacéutica personalizada',
  'Nuevas regulaciones farmacéuticas en España',
  'Tecnología en la farmacia moderna',
  'Gestión de recetas electrónicas',
  'Farmacogenética y medicina personalizada',
  'Servicios farmacéuticos profesionales',
  'Gestión de la cadena de frío',
  'Dispensación de medicamentos huérfanos',
  'Farmacovigilancia y seguridad',
  'Gestión de residuos farmacéuticos',
  'Educación sanitaria en farmacia',
  'Gestión financiera de oficinas de farmacia',
  'Marketing farmacéutico ético',
  'Telemedicina y farmacia digital'
];

const COURSE_CATEGORIES = [
  'gestion',
  'marketing', 
  'liderazgo',
  'atencion_cliente',
  'tecnologia'
];

async function searchWebContent(topic: string): Promise<string> {
  const searchQuery = `${topic} farmacéuticos España problemas soluciones 2024`;
  
  try {
    // Simular búsqueda web - en producción usarías una API real como SerpAPI
    const searchResults = `
    Información actualizada sobre ${topic} en España:
    
    - Principales desafíos actuales en el sector farmacéutico español
    - Nuevas regulaciones y normativas aplicables
    - Mejores prácticas implementadas por farmacias líderes
    - Tecnologías emergentes y su impacto
    - Casos de éxito documentados
    - Tendencias del mercado farmacéutico español
    - Recomendaciones de expertos del sector
    `;
    
    return searchResults;
  } catch (error) {
    console.error('Error en búsqueda web:', error);
    return `Contenido base sobre ${topic} para farmacéuticos en España`;
  }
}

async function generateCourseContent(topic: string, webContent: string): Promise<any> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
Eres un experto en formación farmacéutica en España. Crea un curso completo sobre "${topic}" basado en esta información actualizada:

${webContent}

Genera un curso estructurado con:
1. Título atractivo y profesional
2. Descripción detallada (200-300 palabras)
3. 4-6 módulos con contenido práctico
4. Duración estimada realista
5. Categoría apropiada

El curso debe ser:
- Práctico y aplicable
- Actualizado con la realidad española
- Dirigido a farmacéuticos profesionales
- Con ejemplos y casos reales
- Que resuelva problemas específicos del sector

Formato JSON:
{
  "title": "Título del curso",
  "description": "Descripción detallada",
  "category": "una de: gestion, marketing, liderazgo, atencion_cliente, tecnologia",
  "duration_minutes": número,
  "modules": [
    {
      "title": "Título del módulo",
      "content": "Contenido detallado del módulo en markdown",
      "duration_minutes": número,
      "resources": [
        {
          "title": "Recurso 1",
          "type": "pdf|video|link",
          "url": "URL del recurso"
        }
      ]
    }
  ]
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Eres un experto en formación farmacéutica profesional en España. Generas cursos prácticos y actualizados.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    const data = await response.json();
    const courseContent = data.choices[0].message.content;
    
    // Parsear el JSON generado
    const courseData = JSON.parse(courseContent);
    return courseData;
  } catch (error) {
    console.error('Error generando contenido:', error);
    throw error;
  }
}

async function createCourseInDatabase(courseData: any): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([{
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        duration_minutes: courseData.duration_minutes,
        course_modules: courseData.modules,
        is_premium: false,
        slug: courseData.title.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50)
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creando curso:', error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('Error en base de datos:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando generación de curso diario...');
    
    // Seleccionar tema aleatorio
    const randomTopic = COURSE_TOPICS[Math.floor(Math.random() * COURSE_TOPICS.length)];
    console.log(`Tema seleccionado: ${randomTopic}`);
    
    // Buscar información actualizada
    const webContent = await searchWebContent(randomTopic);
    console.log('Información web obtenida');
    
    // Generar contenido del curso con IA
    const courseData = await generateCourseContent(randomTopic, webContent);
    console.log('Contenido generado por IA');
    
    // Crear curso en base de datos
    const courseId = await createCourseInDatabase(courseData);
    console.log(`Curso creado con ID: ${courseId}`);
    
    return new Response(JSON.stringify({
      success: true,
      courseId,
      title: courseData.title,
      topic: randomTopic,
      message: 'Curso diario generado exitosamente'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error en generación de curso:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});