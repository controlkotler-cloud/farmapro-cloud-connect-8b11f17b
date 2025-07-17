import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
// Librerías para generación de archivos
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const RESOURCE_CATEGORIES = [
  'atencion',
  'marketing',
  'gestion',
  'liderazgo',
  'finanzas',
  'digital'
];

const RESOURCE_TYPES = [
  'protocolo',
  'calculadora',
  'plantilla',
  'guia',
  'checklist',
  'manual',
  'herramienta'
];

const RESOURCE_FORMATS = [
  'pdf',
  'docs',
  'url',
  'xls',
  'video'
];

// Función para obtener el índice de categoría actual y actualizar para el siguiente ciclo
async function getCurrentCategoryIndex(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('resource_generation_control')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error obteniendo índice de categoría:', error);
      return 0;
    }

    const currentIndex = data.current_category_index;
    const cycleComplete = data.cycle_complete;

    // Si todas las categorías ya se han utilizado y el ciclo está completo, continuar rotando
    const nextIndex = (currentIndex >= RESOURCE_CATEGORIES.length - 1) ? 0 : currentIndex + 1;
    
    // Determinar si el próximo ciclo estará completo
    const willCompleteNextCycle = nextIndex === 0 && !cycleComplete;
    
    // Actualizar el control
    await supabase
      .from('resource_generation_control')
      .update({ 
        current_category_index: nextIndex,
        cycle_complete: willCompleteNextCycle ? true : cycleComplete,
        last_updated: new Date().toISOString()
      })
      .eq('id', data.id);

    return currentIndex;
  } catch (error) {
    console.error('Error en control de categorías:', error);
    return 0;
  }
}

// Función para seleccionar un tipo y formato aleatorio apropiado
function selectRandomTypeAndFormat(category: string): { type: string, format: string } {
  // Seleccionar tipo basado en la categoría
  let appropriateTypes = RESOURCE_TYPES;
  
  switch (category) {
    case 'atencion':
      appropriateTypes = ['protocolo', 'guia', 'checklist', 'manual'];
      break;
    case 'marketing':
      appropriateTypes = ['plantilla', 'guia', 'checklist', 'herramienta'];
      break;
    case 'gestion':
      appropriateTypes = ['calculadora', 'plantilla', 'manual', 'herramienta'];
      break;
    case 'liderazgo':
      appropriateTypes = ['guia', 'manual', 'checklist'];
      break;
    case 'finanzas':
      appropriateTypes = ['calculadora', 'plantilla', 'manual'];
      break;
    case 'digital':
      appropriateTypes = ['herramienta', 'guia', 'manual'];
      break;
  }
  
  const randomType = appropriateTypes[Math.floor(Math.random() * appropriateTypes.length)];
  
  // Seleccionar formato apropiado para el tipo
  let appropriateFormats = RESOURCE_FORMATS;
  
  switch (randomType) {
    case 'calculadora':
      appropriateFormats = ['xls', 'docs', 'url'];
      break;
    case 'plantilla':
      appropriateFormats = ['docs', 'pdf', 'xls'];
      break;
    case 'guia':
    case 'manual':
    case 'protocolo':
      appropriateFormats = ['pdf', 'docs'];
      break;
    case 'checklist':
      appropriateFormats = ['pdf', 'docs'];
      break;
    case 'herramienta':
      appropriateFormats = ['url', 'docs'];
      break;
  }
  
  const randomFormat = appropriateFormats[Math.floor(Math.random() * appropriateFormats.length)];
  
  return { type: randomType, format: randomFormat };
}

// Función para generar archivo PDF
async function generatePDFFile(title: string, content: string): Promise<Uint8Array> {
  const doc = new jsPDF();
  
  // Configurar fuente y título
  doc.setFontSize(20);
  doc.text(title, 20, 30);
  
  // Agregar contenido
  doc.setFontSize(12);
  const lines = doc.splitTextToSize(content, 170);
  doc.text(lines, 20, 50);
  
  // Convertir a bytes
  const pdfBytes = doc.output('arraybuffer');
  return new Uint8Array(pdfBytes);
}

// Función para generar archivo Excel
async function generateExcelFile(title: string, content: string, type: string): Promise<Uint8Array> {
  const wb = XLSX.utils.book_new();
  
  if (type === 'calculadora') {
    // Para calculadoras, crear hoja con fórmulas
    const ws_data = [
      ['Calculadora: ' + title],
      [''],
      ['Concepto', 'Valor', 'Resultado'],
      ['Ingresos Mensuales', 0, '=B4*12'],
      ['Gastos Mensuales', 0, '=B5*12'],
      ['Beneficio Anual', '', '=C4-C5'],
      [''],
      ['Instrucciones:'],
      ['1. Ingrese los valores en la columna B'],
      ['2. Los resultados se calcularán automáticamente'],
      ['3. ' + content.substring(0, 100) + '...']
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Calculadora');
  } else {
    // Para otros tipos, crear plantilla simple
    const ws_data = [
      [title],
      [''],
      ['Descripción:'],
      [content],
      [''],
      ['Instrucciones de uso:'],
      ['1. Complete los campos según sus necesidades'],
      ['2. Modifique las celdas según su farmacia'],
      ['3. Guarde el archivo con un nuevo nombre']
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
  }
  
  // Convertir a bytes
  const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(excelBuffer);
}

// Función para subir archivo a Supabase Storage
async function uploadFileToStorage(fileName: string, fileData: Uint8Array, contentType: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('recursos')
      .upload(fileName, fileData, {
        contentType: contentType,
        upsert: true
      });

    if (error) {
      console.error('Error subiendo archivo:', error);
      throw error;
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('recursos')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error en storage:', error);
    throw error;
  }
}

// Función para generar archivo real según el formato
async function generateRealFile(resourceData: any): Promise<string> {
  const { title, content, format, type } = resourceData;
  const timestamp = Date.now();
  let fileName: string;
  let fileData: Uint8Array;
  let contentType: string;

  try {
    switch (format) {
      case 'pdf':
        fileName = `${type}-${timestamp}.pdf`;
        fileData = await generatePDFFile(title, content);
        contentType = 'application/pdf';
        break;
        
      case 'xls':
        fileName = `${type}-${timestamp}.xlsx`;
        fileData = await generateExcelFile(title, content, type);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
        
      case 'docs':
        // Para docs, generar como PDF por simplicidad
        fileName = `${type}-${timestamp}.pdf`;
        fileData = await generatePDFFile(title, content);
        contentType = 'application/pdf';
        break;
        
      default:
        // Para URL y video, no generar archivo físico
        return resourceData.file_url;
    }

    // Subir archivo a storage
    const publicUrl = await uploadFileToStorage(fileName, fileData, contentType);
    console.log(`Archivo generado y subido: ${fileName}`);
    return publicUrl;
    
  } catch (error) {
    console.error('Error generando archivo real:', error);
    // En caso de error, devolver URL por defecto
    return resourceData.file_url;
  }
}

async function searchWebContent(category: string, type: string, customTopic?: string): Promise<string> {
  const searchQuery = customTopic || `${category} ${type} farmacia mejores prácticas 2024`;
  
  try {
    // Simular búsqueda web - en producción usarías una API real
    const searchResults = `
    Información actualizada sobre ${customTopic || `${category} - ${type}`} para farmacias:
    
    - Tendencias actuales en ${customTopic || category}
    - Mejores prácticas implementadas por farmacias líderes
    - Casos de estudio y ejemplos prácticos
    - Herramientas y recursos recomendados
    - Normativa y regulaciones actualizadas
    - Tecnologías emergentes en el sector
    - Estrategias de implementación efectivas
    - Métricas y KPIs relevantes
    `;
    
    return searchResults;
  } catch (error) {
    console.error('Error en búsqueda web:', error);
    return `Contenido base sobre ${customTopic || `${category} - ${type}`} para profesionales de farmacia`;
  }
}

async function generateResourceContent(category: string, type: string, format: string, webContent: string, customTopic?: string): Promise<any> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Mapear nombres de categorías a español
  const categoryNames = {
    'atencion': 'Atención al Cliente',
    'marketing': 'Marketing',
    'gestion': 'Gestión',
    'liderazgo': 'Liderazgo',
    'finanzas': 'Finanzas',
    'digital': 'Transformación Digital'
  };

  // Mapear tipos a español
  const typeNames = {
    'protocolo': 'Protocolo',
    'calculadora': 'Calculadora',
    'plantilla': 'Plantilla',
    'guia': 'Guía',
    'checklist': 'Checklist',
    'manual': 'Manual',
    'herramienta': 'Herramienta'
  };

  const categorySpanish = categoryNames[category] || category;
  const typeSpanish = typeNames[type] || type;

  // Usar tema personalizado si está disponible, sino usar categoría y tipo
  const resourceTopic = customTopic || `${typeSpanish} de ${categorySpanish}`;

  const prompt = `
  Eres un experto en recursos profesionales para farmacias. Crea un recurso práctico sobre "${resourceTopic}" basado en esta información actualizada:
  
  ${webContent}
  
  El recurso debe ser:
  - Específicamente diseñado para farmacias y profesionales farmacéuticos
  - Práctico y aplicable inmediatamente
  - Actualizado con información reciente del sector
  - Fácil de usar y entender
  - Que resuelva problemas reales del día a día
  
  ${customTopic ? `
  IMPORTANTE: El recurso debe estar enfocado específicamente en: "${customTopic}"
  Adapta el tipo de recurso (${typeSpanish}) para que sea más útil para este tema específico.
  ` : ''}
  
  Genera un recurso estructurado con:
  1. Título descriptivo y profesional
  2. Descripción detallada (150-250 palabras) que explique el valor y uso del recurso
  3. Contenido específico según el tipo de recurso
  4. Instrucciones claras de uso o implementación
  
  Formato JSON:
  {
    "title": "Título del recurso",
    "description": "Descripción detallada del recurso y su aplicación",
    "category": "${category}",
    "type": "${type}",
    "format": "${format}",
    "is_premium": false,
    "file_url": "https://farmapro.es/recursos/${type}-${category}.${format}",
    "content": "Contenido detallado del recurso según su tipo (pasos, plantilla, cálculos, etc.)"
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
          { role: 'system', content: 'Eres un experto en recursos profesionales para farmapro. Generas recursos prácticos y útiles para farmacias.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    const data = await response.json();
    let resourceContent = data.choices[0].message.content;
    
    // Limpiar la respuesta de OpenAI (quitar markdown formatting si existe)
    resourceContent = resourceContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // Parsear el JSON generado
    const resourceData = JSON.parse(resourceContent);
    return resourceData;
  } catch (error) {
    console.error('Error generando contenido:', error);
    throw error;
  }
}

async function createResourceInDatabase(resourceData: any, category: string, type: string): Promise<string> {
  try {
    // Primero crear el recurso
    const { data, error } = await supabase
      .from('resources')
      .insert([{
        title: resourceData.title,
        description: resourceData.description,
        category: resourceData.category,
        type: resourceData.type,
        format: resourceData.format,
        is_premium: resourceData.is_premium || false,
        file_url: resourceData.file_url,
        download_count: 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creando recurso:', error);
      throw error;
    }

    // Registrar en la tabla de logs
    await supabase
      .from('generated_resources_log')
      .insert([{
        resource_id: data.id,
        category: category,
        type: type,
        status: 'completed'
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
    let requestData = {};
    let customTopic = null;
    let customCategory = null;
    
    // Extraer datos del cuerpo de la solicitud, si los hay
    if (req.body) {
      try {
        requestData = await req.json();
        customTopic = requestData.customTopic || null;
        customCategory = requestData.customCategory || null;
      } catch (e) {
        console.log('No se pudo parsear el cuerpo de la solicitud');
      }
    }
    
    console.log(`Iniciando generación de recurso (tema: ${customTopic || 'automático'}, categoría: ${customCategory || 'automática'})...`);
    
    let selectedCategory;
    let categoryIndex;
    
    if (customCategory) {
      // Usar categoría personalizada
      selectedCategory = customCategory;
      categoryIndex = -1; // Indicar que es personalizada
      console.log(`Usando categoría personalizada: ${selectedCategory}`);
    } else {
      // Usar sistema automático
      categoryIndex = await getCurrentCategoryIndex();
      selectedCategory = RESOURCE_CATEGORIES[categoryIndex];
      console.log(`Categoría seleccionada del ciclo (índice ${categoryIndex}): ${selectedCategory}`);
    }
    
    // Seleccionar tipo y formato aleatorio apropiado
    const { type, format } = selectRandomTypeAndFormat(selectedCategory);
    console.log(`Tipo: ${type}, Formato: ${format}`);
    
    // Buscar información actualizada
    const webContent = await searchWebContent(selectedCategory, type, customTopic);
    console.log('Información web obtenida');
    
    // Generar contenido del recurso con IA
    const resourceData = await generateResourceContent(selectedCategory, type, format, webContent, customTopic);
    console.log('Contenido generado por IA');
    
    // Generar archivo real si es necesario
    const realFileUrl = await generateRealFile(resourceData);
    console.log('Archivo real generado:', realFileUrl);
    
    // Actualizar la URL del archivo en resourceData
    resourceData.file_url = realFileUrl;
    
    // Crear recurso en base de datos
    const resourceId = await createResourceInDatabase(resourceData, selectedCategory, type);
    console.log(`Recurso creado con ID: ${resourceId}`);
    
    return new Response(JSON.stringify({
      success: true,
      resourceId,
      title: resourceData.title,
      category: selectedCategory,
      type: type,
      format: format,
      message: 'Recurso diario generado exitosamente'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error en generación de recurso:', error);
    
    // Registrar el error en la tabla de logs
    try {
      await supabase
        .from('generated_resources_log')
        .insert([{
          resource_id: null,
          category: 'Error',
          type: 'Error',
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