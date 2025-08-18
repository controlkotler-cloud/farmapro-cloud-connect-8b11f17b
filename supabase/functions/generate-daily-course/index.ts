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
  'Gestión del tiempo y productividad personal',
  'Planificación estratégica y establecimiento de objetivos',
  'Análisis financiero y control de costos',
  'Marketing digital y redes sociales',
  'Branding y construcción de marca personal',
  'Estrategias de ventas y negociación',
  'Liderazgo transformacional y motivación de equipos',
  'Comunicación efectiva y habilidades interpersonales',
  'Gestión del cambio organizacional',
  'Atención al cliente y experiencia de usuario',
  'Resolución de conflictos y gestión de quejas',
  'Fidelización de clientes y programas de lealtad',
  'Transformación digital y automatización',
  'Análisis de datos y toma de decisiones',
  'Ciberseguridad y protección de datos'
];

const COURSE_CATEGORIES = [
  'gestion',
  'marketing', 
  'liderazgo',
  'atencion_cliente',
  'tecnologia'
];

// Función para obtener el índice de tema actual y actualizar para el siguiente ciclo
async function getCurrentTopicIndex(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('course_generation_control')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error obteniendo índice de tema:', error);
      return 0;
    }

    const currentIndex = data.current_topic_index;
    const cycleComplete = data.cycle_complete;

    // Si todos los temas ya se han utilizado y el ciclo está completo, detener la generación
    if (currentIndex >= COURSE_TOPICS.length - 1 && cycleComplete) {
      console.log('Ciclo completo de temas alcanzado. Deteniendo generación de cursos.');
      return -1; // Código para indicar que el ciclo está completo
    }

    // Calcular el próximo índice (siguiente tema o reinicio)
    const nextIndex = (currentIndex >= COURSE_TOPICS.length - 1) ? 0 : currentIndex + 1;
    
    // Determinar si el próximo ciclo estará completo
    const willCompleteNextCycle = nextIndex === 0 && !cycleComplete;
    
    // Actualizar el control
    await supabase
      .from('course_generation_control')
      .update({ 
        current_topic_index: nextIndex,
        cycle_complete: willCompleteNextCycle ? true : cycleComplete,
        last_updated: new Date().toISOString()
      })
      .eq('id', data.id);

    return currentIndex;
  } catch (error) {
    console.error('Error en control de temas:', error);
    return 0;
  }
}

async function searchWebContent(topic: string): Promise<string> {
  const searchQuery = `${topic} aplicaciones prácticas empresas 2024`;
  
  try {
    // Simular búsqueda web - en producción usarías una API real como SerpAPI
    const searchResults = `
    Información actualizada sobre ${topic}:
    
    - Mejores prácticas implementadas por empresas líderes
    - Casos de estudio y ejemplos prácticos
    - Nuevas tendencias y aplicaciones
    - Tecnologías y herramientas relevantes
    - Estadísticas recientes e investigaciones
    - Recomendaciones de expertos en el campo
    - Recursos y herramientas actualizadas
    `;
    
    return searchResults;
  } catch (error) {
    console.error('Error en búsqueda web:', error);
    return `Contenido base sobre ${topic} para profesionales`;
  }
}

async function generateCourseContent(topic: string, webContent: string, level: string, customTopic?: string): Promise<any> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Usar tema personalizado si está disponible, sino usar el tema automático
  const courseTopic = customTopic || topic;

  // Ajustar instrucciones según el nivel
  let nivelInstrucciones = '';
  let prefix = '';

  switch (level) {
    case 'basico':
      prefix = '[BÁSICO] ';
      nivelInstrucciones = `
      Este es un curso de nivel BÁSICO. Debe ser:
      - Accesible para principiantes absolutos
      - Con conceptos fundamentales y definiciones claras
      - Sin jerga técnica compleja
      - Con muchos ejemplos sencillos y prácticos
      - Enfocado en construir bases sólidas`;
      break;
    case 'intermedio':
      prefix = '[INTERMEDIO] ';
      nivelInstrucciones = `
      Este es un curso de nivel INTERMEDIO. Debe ser:
      - Para personas con conocimientos básicos previos
      - Con conceptos más avanzados y aplicaciones prácticas
      - Con algunos casos de estudio y análisis
      - Que profundice en estrategias y técnicas específicas
      - Con ejercicios prácticos que refuercen lo aprendido`;
      break;
    case 'avanzado':
      prefix = '[AVANZADO] ';
      nivelInstrucciones = `
      Este es un curso de nivel AVANZADO. Debe ser:
      - Para profesionales con experiencia sólida
      - Con conceptos complejos y técnicas especializadas
      - Que analice tendencias y desarrollos recientes
      - Con casos de estudio detallados y escenarios complejos
      - Que integre conocimientos multidisciplinarios
      - Con aplicaciones innovadoras y de vanguardia`;
      break;
    default:
      nivelInstrucciones = `
      Este es un curso de nivel flexible. Debe ser:
      - Adaptable a diferentes niveles de experiencia
      - Con conceptos fundamentales pero también avanzados
      - Con aplicaciones prácticas relevantes`;
  }

  const prompt = `
  Eres un experto en formación profesional. Crea un curso completo sobre "${courseTopic}" basado en esta información actualizada:
  
  ${webContent}
  
  ${nivelInstrucciones}
  
  ${customTopic ? `
  IMPORTANTE: El curso debe estar enfocado específicamente en: "${customTopic}"
  Adapta el contenido y los módulos para que sean más útiles para este tema específico.
  ` : ''}
  
  Genera un curso estructurado con:
  1. Título atractivo y profesional (incluye ${prefix} al inicio)
  2. Descripción detallada (200-300 palabras)
  3. 4-6 módulos con contenido práctico
  4. Duración estimada realista
  5. Categoría apropiada
  
  El curso debe ser:
  - Práctico y aplicable inmediatamente
  - Actualizado con información reciente
  - Dirigido a profesionales de farmacia
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
          { role: 'system', content: 'Eres un experto en formación profesional para farmapro. Generas cursos prácticos y actualizados.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    const data = await response.json();
    let courseContent = data.choices[0].message.content;
    
    // Limpiar la respuesta de OpenAI (quitar markdown formatting si existe)
    courseContent = courseContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // Parsear el JSON generado
    const courseData = JSON.parse(courseContent);
    return courseData;
  } catch (error) {
    console.error('Error generando contenido:', error);
    throw error;
  }
}

async function createCourseInDatabase(courseData: any, topic: string, level: string): Promise<string> {
  try {
    // Primero crear el curso
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

    // Registrar en la tabla de logs
    await supabase
      .from('generated_courses_log')
      .insert([{
        course_id: data.id,
        topic: topic,
        status: 'completed',
        level: level
      }]);

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
    // Security: Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("SECURITY: No authorization header provided");
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.log("SECURITY: Invalid token provided");
      return new Response(JSON.stringify({ error: "Invalid authorization" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase
      .rpc('is_current_user_admin');
    
    if (adminError || !isAdmin) {
      console.log("SECURITY: Non-admin attempted course generation", { userId: userData.user.id });
      await supabase.rpc('log_security_event', {
        event_type: 'unauthorized_course_generation',
        details: { userId: userData.user.id, email: userData.user.email }
      });
      return new Response(JSON.stringify({ error: "Admin privileges required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    let requestData = {};
    let level = 'basico';
    let customTopic = null;
    
    // Extraer datos del cuerpo de la solicitud, si los hay
    if (req.body) {
      try {
        requestData = await req.json();
        level = requestData.level || 'basico';
        customTopic = requestData.customTopic || null;
      } catch (e) {
        console.log('No se pudo parsear el cuerpo de la solicitud');
      }
    }
    
    console.log(`Iniciando generación de curso (nivel: ${level}, tema personalizado: ${customTopic || 'automático'})...`);
    
    let selectedTopic;
    let topicIndex;
    
    if (customTopic) {
      // Usar tema personalizado
      selectedTopic = customTopic;
      topicIndex = -1; // Indicar que es personalizado
      console.log(`Usando tema personalizado: ${selectedTopic}`);
    } else {
      // Usar sistema automático
      topicIndex = await getCurrentTopicIndex();
      
      // Verificar si el ciclo está completo
      if (topicIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          message: 'El ciclo de generación de cursos ha finalizado. Se han completado todos los temas en los tres niveles.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      selectedTopic = COURSE_TOPICS[topicIndex];
      console.log(`Tema seleccionado del ciclo (índice ${topicIndex}): ${selectedTopic}`);
    }
    
    // Buscar información actualizada
    const webContent = await searchWebContent(selectedTopic);
    console.log('Información web obtenida');
    
    // Generar contenido del curso con IA
    const courseData = await generateCourseContent(selectedTopic, webContent, level, customTopic);
    console.log(`Contenido generado por IA para nivel ${level}`);
    
    // Crear curso en base de datos
    const courseId = await createCourseInDatabase(courseData, selectedTopic, level);
    console.log(`Curso creado con ID: ${courseId}`);
    
    return new Response(JSON.stringify({
      success: true,
      courseId,
      title: courseData.title,
      topic: selectedTopic,
      level: level,
      message: `Curso diario de nivel ${level} generado exitosamente`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error en generación de curso:', error);
    
    // Registrar el error en la tabla de logs
    try {
      await supabase
        .from('generated_courses_log')
        .insert([{
          course_id: null,
          topic: 'Error',
          status: 'error',
          error_message: error.message
        }]);
    } catch (logError) {
      console.error('Error al registrar el error:', logError);
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});