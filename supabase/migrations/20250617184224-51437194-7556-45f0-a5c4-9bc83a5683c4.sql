
-- Primero eliminamos los cursos existentes para empezar limpio
DELETE FROM public.courses;

-- Insertamos los 5 cursos completamente desarrollados con UUIDs válidos
INSERT INTO public.courses (title, description, category, duration_minutes, thumbnail_url, featured_image_url, is_premium, course_modules) VALUES

-- 1. Plan de marketing anual
('Plan de marketing anual', 'Aprende a crear y ejecutar un plan de marketing estratégico para tu farmacia que genere resultados medibles durante todo el año.', 'marketing', 240, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', true, '[
  {
    "id": "analisis-situacion",
    "title": "Análisis de la situación actual",
    "content": "<h3>Diagnóstico inicial de tu farmacia</h3><p>Antes de planificar cualquier acción de marketing, es fundamental conocer la situación actual de tu farmacia. En este módulo aprenderás a realizar un análisis completo que incluye:</p><ul><li><strong>Análisis interno:</strong> Fortalezas y debilidades de tu farmacia</li><li><strong>Análisis externo:</strong> Oportunidades y amenazas del mercado</li><li><strong>Análisis de la competencia:</strong> Qué hacen otras farmacias de tu zona</li><li><strong>Análisis de clientes:</strong> Perfil y comportamiento de tus pacientes</li></ul><p>Utilizaremos herramientas como el análisis PEST (Político, Económico, Social, Tecnológico) y matrices de evaluación para obtener una fotografía clara de dónde estás y hacia dónde puedes dirigirte.</p>",
    "duration": 30,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Plantilla de Análisis PEST para Farmacias",
        "url": "https://example.com/analisis-pest-farmacia.xlsx",
        "type": "Excel"
      }
    ]
  },
  {
    "id": "objetivos-smart",
    "title": "Definición de objetivos SMART",
    "content": "<h3>Estableciendo metas claras y medibles</h3><p>Un plan de marketing sin objetivos claros es como navegar sin brújula. En este módulo aprenderás a definir objetivos que cumplan los criterios SMART:</p><ul><li><strong>S - Específicos:</strong> Objetivos concretos y bien definidos</li><li><strong>M - Medibles:</strong> Con indicadores cuantitativos</li><li><strong>A - Alcanzables:</strong> Realistas según tus recursos</li><li><strong>R - Relevantes:</strong> Alineados con la estrategia de tu farmacia</li><li><strong>T - Temporales:</strong> Con fechas límite claras</li></ul><p>Ejemplos de objetivos SMART para farmacias: \"Aumentar las ventas de productos de dermofarmacia en un 25% durante los próximos 6 meses\" o \"Conseguir 200 nuevos seguidores en redes sociales en el primer trimestre\".</p>",
    "duration": 25,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Plantilla de Objetivos SMART",
        "url": "https://example.com/objetivos-smart-farmacia.pdf",
        "type": "PDF"
      }
    ]
  },
  {
    "id": "segmentacion-publico",
    "title": "Segmentación del público objetivo",
    "content": "<h3>Conoce a tus diferentes tipos de clientes</h3><p>No todos tus clientes son iguales, y tu marketing tampoco debería serlo. La segmentación te permite dirigir mensajes específicos a grupos concretos de pacientes:</p><ul><li><strong>Segmentación demográfica:</strong> Edad, género, nivel socioeconómico</li><li><strong>Segmentación geográfica:</strong> Ubicación y zona de influencia</li><li><strong>Segmentación psicográfica:</strong> Estilo de vida, valores, personalidad</li><li><strong>Segmentación por comportamiento:</strong> Frecuencia de compra, lealtad, beneficios buscados</li></ul><p>Aprenderás a crear buyer personas detalladas para cada segmento y a adaptar tu comunicación y servicios a sus necesidades específicas.</p>",
    "duration": 35,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Template de Buyer Personas para Farmacias",
        "url": "https://example.com/buyer-personas-farmacia.pptx",
        "type": "PowerPoint"
      }
    ]
  },
  {
    "id": "estrategias-tacticas",
    "title": "Estrategias y tácticas de marketing",
    "content": "<h3>Del concepto a la acción</h3><p>Con objetivos claros y público definido, es hora de diseñar las estrategias que te llevarán al éxito:</p><ul><li><strong>Marketing digital:</strong> Redes sociales, email marketing, SEO local</li><li><strong>Marketing tradicional:</strong> Promociones en punto de venta, eventos, colaboraciones</li><li><strong>Marketing de servicios:</strong> Programas de fidelización, servicios de valor añadido</li><li><strong>Marketing estacional:</strong> Campañas específicas por temporadas</li></ul><p>Cada estrategia incluye tácticas específicas, recursos necesarios, cronograma de implementación y métricas de seguimiento. También veremos casos de éxito reales de farmacias que han implementado estas estrategias.</p>",
    "duration": 45,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Calendario de Marketing Farmacéutico",
        "url": "https://example.com/calendario-marketing-farmacia.xlsx",
        "type": "Excel"
      },
      {
        "title": "Checklist de Implementación de Estrategias",
        "url": "https://example.com/checklist-estrategias.pdf",
        "type": "PDF"
      }
    ]
  },
  {
    "id": "presupuesto-roi",
    "title": "Presupuesto y cálculo del ROI",
    "content": "<h3>Invierte inteligentemente en marketing</h3><p>El marketing es una inversión, no un gasto. En este módulo aprenderás a:</p><ul><li><strong>Calcular el presupuesto de marketing:</strong> Porcentaje recomendado sobre facturación</li><li><strong>Distribuir el presupuesto:</strong> Entre diferentes canales y campañas</li><li><strong>Medir el ROI:</strong> Retorno de la inversión en marketing</li><li><strong>Optimizar costes:</strong> Máximo rendimiento con mínima inversión</li></ul><p>Incluye fórmulas prácticas para calcular el coste de adquisición de clientes (CAC), el valor de vida del cliente (CLV) y el retorno de la inversión publicitaria (ROAS). También veremos herramientas gratuitas y de bajo coste para implementar tus campañas.</p>",
    "duration": 30,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Calculadora de ROI para Farmacias",
        "url": "https://example.com/calculadora-roi-farmacia.xlsx",
        "type": "Excel"
      }
    ]
  },
  {
    "id": "seguimiento-kpis",
    "title": "Seguimiento y KPIs",
    "content": "<h3>Mide, analiza y mejora continuamente</h3><p>Un plan de marketing sin seguimiento es un plan destinado al fracaso. Aprenderás a:</p><ul><li><strong>Definir KPIs relevantes:</strong> Métricas que realmente importan</li><li><strong>Crear dashboards:</strong> Visualización clara de resultados</li><li><strong>Análisis de resultados:</strong> Interpretación de datos</li><li><strong>Optimización continua:</strong> Ajustes basados en resultados</li></ul><p>Conocerás las métricas más importantes para farmacias: ticket medio, frecuencia de compra, tasa de conversión, engagement en redes sociales, coste por lead, y muchas más. También aprenderás a usar Google Analytics, herramientas de redes sociales y software de gestión farmacéutica para obtener estos datos.</p>",
    "duration": 35,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Dashboard de KPIs para Farmacias",
        "url": "https://example.com/dashboard-kpis-farmacia.xlsx",
        "type": "Excel"
      },
      {
        "title": "Guía de Google Analytics para Farmacias",
        "url": "https://example.com/google-analytics-farmacia.pdf",
        "type": "PDF"
      }
    ]
  }
]'),

-- 2. Habilidades directivas avanzadas
('Habilidades directivas avanzadas', 'Desarrolla las competencias de liderazgo necesarias para gestionar equipos de alto rendimiento en el entorno farmacéutico.', 'liderazgo', 180, 'https://images.unsplash.com/photo-1556157382-97eda2d62296?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1556157382-97eda2d62296?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', true, '[
  {
    "id": "liderazgo-situacional",
    "title": "Liderazgo situacional",
    "content": "<h3>Adapta tu estilo de liderazgo a cada situación</h3><p>No existe un único estilo de liderazgo efectivo. El liderazgo situacional te enseña a adaptar tu enfoque según:</p><ul><li><strong>El nivel de competencia del empleado:</strong> Desde principiante hasta experto</li><li><strong>El nivel de compromiso:</strong> Motivación y confianza del colaborador</li><li><strong>La complejidad de la tarea:</strong> Rutinaria vs. compleja</li><li><strong>El contexto situacional:</strong> Crisis, cambio, estabilidad</li></ul><p>Aprenderás los 4 estilos fundamentales: dirigir, entrenar, apoyar y delegar, y cuándo aplicar cada uno para maximizar el rendimiento de tu equipo farmacéutico.</p>",
    "duration": 30,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Test de Estilo de Liderazgo",
        "url": "https://example.com/test-liderazgo.pdf",
        "type": "PDF"
      }
    ]
  },
  {
    "id": "comunicacion-efectiva",
    "title": "Comunicación efectiva",
    "content": "<h3>Comunícate con impacto y claridad</h3><p>La comunicación es la herramienta más poderosa de un líder. En este módulo desarrollarás:</p><ul><li><strong>Escucha activa:</strong> Técnicas para entender realmente a tu equipo</li><li><strong>Comunicación asertiva:</strong> Expresar ideas con firmeza y respeto</li><li><strong>Feedback constructivo:</strong> Dar y recibir retroalimentación efectiva</li><li><strong>Comunicación no verbal:</strong> El poder del lenguaje corporal</li></ul><p>Incluye situaciones específicas del entorno farmacéutico: comunicación con pacientes difíciles, resolución de conflictos con proveedores, presentación de nuevos procedimientos al equipo, y comunicación en situaciones de crisis.</p>",
    "duration": 25,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Guía de Comunicación Asertiva",
        "url": "https://example.com/comunicacion-asertiva.pdf",
        "type": "PDF"
      }
    ]
  },
  {
    "id": "gestion-equipos",
    "title": "Gestión de equipos de alto rendimiento",
    "content": "<h3>Construye y lidera equipos exitosos</h3><p>Un equipo de alto rendimiento no surge por casualidad. Aprenderás a:</p><ul><li><strong>Formar equipos equilibrados:</strong> Roles complementarios y diversidad de talentos</li><li><strong>Establecer objetivos compartidos:</strong> Visión común y metas claras</li><li><strong>Fomentar la colaboración:</strong> Trabajo en equipo vs. trabajo en grupo</li><li><strong>Gestionar el talento:</strong> Desarrollo profesional de cada miembro</li></ul><p>Veremos las 5 etapas del desarrollo de equipos (formación, tormenta, normalización, rendimiento y transformación) y cómo liderar efectivamente en cada fase. Casos prácticos de farmacias que han transformado su cultura organizacional.</p>",
    "duration": 35,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Assessment de Equipos de Alto Rendimiento",
        "url": "https://example.com/assessment-equipos.xlsx",
        "type": "Excel"
      }
    ]
  },
  {
    "id": "toma-decisiones",
    "title": "Toma de decisiones estratégicas",
    "content": "<h3>Decide con acierto bajo presión</h3><p>Como líder, tomas decisiones constantemente. Este módulo te enseña a:</p><ul><li><strong>Análisis de información:</strong> Recopilar y evaluar datos relevantes</li><li><strong>Gestión de la incertidumbre:</strong> Decidir con información incompleta</li><li><strong>Técnicas de decisión:</strong> Matrices, árboles de decisión, análisis SWOT</li><li><strong>Implementación efectiva:</strong> De la decisión a la acción</li></ul><p>Incluye casos reales del sector farmacéutico: decisiones de inversión en nueva tecnología, cambios en la política de precios, gestión de crisis de suministro, y decisiones de personal. Aprenderás también a involucrar al equipo en el proceso de toma de decisiones cuando sea apropiado.</p>",
    "duration": 30,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Matriz de Toma de Decisiones",
        "url": "https://example.com/matriz-decisiones.xlsx",
        "type": "Excel"
      }
    ]
  },
  {
    "id": "gestion-cambio",
    "title": "Gestión del cambio y la innovación",
    "content": "<h3>Lidera la transformación con éxito</h3><p>El sector farmacéutico está en constante evolución. Como líder, debes saber gestionar el cambio:</p><ul><li><strong>Planificación del cambio:</strong> Metodologías estructuradas</li><li><strong>Comunicación del cambio:</strong> Vencer la resistencia natural</li><li><strong>Implementación gradual:</strong> Fases y hitos del proceso</li><li><strong>Cultura de innovación:</strong> Fomentar la creatividad en el equipo</li></ul><p>Aprenderás el modelo de 8 pasos de Kotter para liderar el cambio, técnicas para superar la resistencia al cambio, y cómo crear una cultura que abrace la innovación. Casos de estudio: digitalización de procesos, implementación de nuevos servicios, adaptación a nuevas regulaciones.</p>",
    "duration": 30,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Plan de Gestión del Cambio",
        "url": "https://example.com/plan-gestion-cambio.docx",
        "type": "Word"
      }
    ]
  },
  {
    "id": "desarrollo-liderazgo",
    "title": "Desarrollo personal y liderazgo",
    "content": "<h3>Conviértete en el líder que tu farmacia necesita</h3><p>El desarrollo del liderazgo es un viaje continuo. En este módulo final trabajarás en:</p><ul><li><strong>Autoconocimiento:</strong> Fortalezas, áreas de mejora y valores</li><li><strong>Inteligencia emocional:</strong> Gestión de emociones propias y ajenas</li><li><strong>Plan de desarrollo personal:</strong> Objetivos y acciones concretas</li><li><strong>Mentoría y coaching:</strong> Desarrollar a otros líderes</li></ul><p>Incluye herramientas de autoevaluación, técnicas de mindfulness para líderes, estrategias para mantener el equilibrio trabajo-vida personal, y cómo crear un legado de liderazgo en tu farmacia. Al final tendrás tu propio plan de desarrollo de liderazgo personalizado.</p>",
    "duration": 30,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Plan Personal de Desarrollo de Liderazgo",
        "url": "https://example.com/plan-desarrollo-liderazgo.pdf",
        "type": "PDF"
      },
      {
        "title": "Test de Inteligencia Emocional",
        "url": "https://example.com/test-inteligencia-emocional.pdf",
        "type": "PDF"
      }
    ]
  }
]'),

-- 3. El poder de la palabra
('El poder de la palabra', 'Domina el arte de la comunicación persuasiva y mejora tus habilidades de venta y atención al cliente en la farmacia.', 'atencion_cliente', 120, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', false, '[
  {
    "id": "comunicacion-persuasiva",
    "title": "Fundamentos de la comunicación persuasiva",
    "content": "<h3>El arte de influir positivamente</h3><p>La comunicación persuasiva no es manipulación, es la habilidad de presentar información de manera que genere confianza y motive a la acción. En este módulo aprenderás:</p><ul><li><strong>Los 6 principios de la persuasión de Cialdini:</strong> Reciprocidad, compromiso, consenso social, autoridad, simpatía y escasez</li><li><strong>Estructura del mensaje persuasivo:</strong> Apertura, desarrollo y cierre efectivos</li><li><strong>Lenguaje positivo:</strong> Palabras que suman vs. palabras que restan</li><li><strong>Adaptación al interlocutor:</strong> Personalización del mensaje</li></ul><p>Aplicado al contexto farmacéutico: cómo presentar recomendaciones de tratamiento, sugerir productos complementarios de forma ética, y comunicar la importancia del cumplimiento terapéutico.</p>",
    "duration": 20,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Los 6 Principios de Persuasión en Farmacia",
        "url": "https://example.com/principios-persuasion-farmacia.pdf",
        "type": "PDF"
      }
    ]
  },
  {
    "id": "escucha-activa",
    "title": "Escucha activa y empática",
    "content": "<h3>Escuchar para entender, no para responder</h3><p>La base de toda comunicación efectiva es saber escuchar. Desarrollarás:</p><ul><li><strong>Técnicas de escucha activa:</strong> Parafraseo, clarificación, resumen</li><li><strong>Lectura del lenguaje no verbal:</strong> Gestos, posturas, microexpresiones</li><li><strong>Empatía profesional:</strong> Conectar sin involucrarse emocionalmente</li><li><strong>Preguntas poderosas:</strong> Abiertas, cerradas, de sondeo</li></ul><p>Casos prácticos con pacientes: ancianos con múltiples medicamentos, padres preocupados por sus hijos, pacientes crónicos, situaciones de urgencia. Aprenderás a identificar necesidades no expresadas y preocupaciones ocultas.</p>",
    "duration": 25,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Guía de Preguntas para Diferentes Situaciones",
        "url": "https://example.com/guia-preguntas-farmacia.pdf",
        "type": "PDF"
      }
    ]
  },
  {
    "id": "comunicacion-verbal",
    "title": "Técnicas de comunicación verbal",
    "content": "<h3>Cómo decir las cosas importa</h3><p>El mismo mensaje puede generar reacciones completamente diferentes según cómo se comunique:</p><ul><li><strong>Tono y volumen de voz:</strong> Transmitir confianza y calma</li><li><strong>Ritmo y pausas:</strong> Dar tiempo para asimilar información</li><li><strong>Claridad y sencillez:</strong> Evitar tecnicismos innecesarios</li><li><strong>Estructuración del mensaje:</strong> Orden lógico de la información</li></ul><p>Aprenderás a explicar conceptos médicos complejos en lenguaje sencillo, a dar malas noticias (como efectos secundarios o contraindicaciones) de forma empática, y a motivar el cumplimiento terapéutico con mensajes positivos y esperanzadores.</p>",
    "duration": 20,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Diccionario Médico-Paciente",
        "url": "https://example.com/diccionario-medico-paciente.pdf",
        "type": "PDF"
      }
    ]
  },
  {
    "id": "objeciones-resistencias",
    "title": "Manejo de objeciones y resistencias",
    "content": "<h3>Transforma las objeciones en oportunidades</h3><p>Las objeciones son normales y pueden ser oportunidades para generar mayor confianza:</p><ul><li><strong>Tipos de objeciones:</strong> Precio, eficacia, seguridad, conveniencia</li><li><strong>Técnica AIDA:</strong> Aceptar, Indagar, Demostrar, Actuar</li><li><strong>Reestructuración cognitiva:</strong> Cambiar la perspectiva del cliente</li><li><strong>Evidencia científica:</strong> Usar datos para generar confianza</li></ul><p>Situaciones específicas: pacientes que no quieren tomar medicamentos, resistencia a precios de productos farmacéuticos, dudas sobre eficacia de tratamientos, preferencia por \"remedios naturales\". Aprenderás a respetar las decisiones del paciente mientras ofreces la mejor información.</p>",
    "duration": 25,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Manual de Manejo de Objeciones Comunes",
        "url": "https://example.com/manejo-objeciones-farmacia.pdf",
        "type": "PDF"
      }
    ]
  },
  {
    "id": "venta-consultiva",
    "title": "Venta consultiva en farmacia",
    "content": "<h3>Vende ayudando, no presionando</h3><p>La venta consultiva se basa en entender necesidades y ofrecer soluciones genuinas:</p><ul><li><strong>Identificación de necesidades:</strong> Explícitas e implícitas</li><li><strong>Presentación de beneficios:</strong> Características vs. ventajas vs. beneficios</li><li><strong>Creación de valor:</strong> Más allá del producto básico</li><li><strong>Cierre natural:</strong> Cuando el cliente está convencido</li></ul><p>Aprenderás a realizar ventas cruzadas éticas (productos complementarios que realmente benefician al paciente), a aumentar el ticket medio sin presionar, y a fidelizar clientes a través de un servicio consultivo de calidad. Incluye scripts y diálogos para diferentes situaciones de venta.</p>",
    "duration": 30,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Scripts de Venta Consultiva",
        "url": "https://example.com/scripts-venta-consultiva.docx",
        "type": "Word"
      },
      {
        "title": "Matriz de Beneficios por Categoría de Producto",
        "url": "https://example.com/matriz-beneficios-productos.xlsx",
        "type": "Excel"
      }
    ]
  }
]'),

-- 4. WhatsApp Business para farmacias
('WhatsApp Business para farmacias', 'Aprende a usar WhatsApp Business como herramienta profesional para mejorar la comunicación con tus pacientes y aumentar las ventas.', 'tecnologia', 90, 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', false, '[
  {
    "id": "configuracion-inicial",
    "title": "Configuración inicial de WhatsApp Business",
    "content": "<h3>Prepara tu farmacia para el éxito digital</h3><p>La configuración correcta es clave para proyectar profesionalidad desde el primer contacto:</p><ul><li><strong>Creación del perfil comercial:</strong> Información completa y atractiva</li><li><strong>Configuración de horarios:</strong> Gestión de expectativas de respuesta</li><li><strong>Mensaje de bienvenida:</strong> Primera impresión que cuenta</li><li><strong>Respuestas automáticas:</strong> Eficiencia sin perder el toque humano</li></ul><p>Aprenderás a optimizar tu perfil con la información más relevante para pacientes: ubicación, horarios, servicios especiales, y formas de contacto. También configurarás mensajes automáticos que mantengan informados a tus clientes incluso fuera del horario de atención.</p>",
    "duration": 15,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Checklist de Configuración WhatsApp Business",
        "url": "https://example.com/checklist-whatsapp-business.pdf",
        "type": "PDF"
      }
    ]
  },
  {
    "id": "comunicacion-profesional",
    "title": "Comunicación profesional por WhatsApp",
    "content": "<h3>Mantén la profesionalidad en cada mensaje</h3><p>WhatsApp es informal por naturaleza, pero tu farmacia debe mantener estándares profesionales:</p><ul><li><strong>Tono de comunicación:</strong> Cercano pero profesional</li><li><strong>Protocolo de respuesta:</strong> Tiempos y estructura de mensajes</li><li><strong>Confidencialidad y privacidad:</strong> Protección de datos sanitarios</li><li><strong>Límites y horarios:</strong> Cuándo y cómo estar disponible</li></ul><p>Incluye plantillas de mensajes para diferentes situaciones: confirmación de recetas, recordatorios de medicación, consultas sobre productos, gestión de citas. Aprenderás también a manejar situaciones delicadas manteniendo la profesionalidad y la confidencialidad médica.</p>",
    "duration": 20,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Plantillas de Mensajes Profesionales",
        "url": "https://example.com/plantillas-mensajes-whatsapp.docx",
        "type": "Word"
      }
    ]
  },
  {
    "id": "catalogo-productos",
    "title": "Creación y gestión del catálogo",
    "content": "<h3>Muestra tus productos de forma atractiva</h3><p>El catálogo de WhatsApp Business es una herramienta poderosa para mostrar tus productos:</p><ul><li><strong>Organización por categorías:</strong> Estructura lógica y fácil navegación</li><li><strong>Fotografías de calidad:</strong> Imágenes que vendan</li><li><strong>Descripciones efectivas:</strong> Información útil y persuasiva</li><li><strong>Precios y disponibilidad:</strong> Transparencia que genera confianza</li></ul><p>Aprenderás a fotografiar productos farmacéuticos, escribir descripciones que destaquen beneficios, organizar el catálogo por categorías (dermocosmética, vitaminas, ortopedia, etc.) y mantenerlo actualizado. También veremos cómo usar el catálogo para generar ventas y consultas.</p>",
    "duration": 25,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Guía de Fotografía de Productos",
        "url": "https://example.com/guia-fotografia-productos.pdf",
        "type": "PDF"
      }
    ]
  },
  {
    "id": "atencion-cliente",
    "title": "Atención al cliente 24/7",
    "content": "<h3>Servicio excepcional en todo momento</h3><p>WhatsApp permite ofrecer un servicio de atención que supere expectativas:</p><ul><li><strong>Gestión de consultas frecuentes:</strong> FAQs y respuestas rápidas</li><li><strong>Seguimiento post-venta:</strong> Cuidado continuo del paciente</li><li><strong>Recordatorios personalizados:</strong> Medicación, citas, renovación de recetas</li><li><strong>Resolución de problemas:</strong> Gestión eficaz de incidencias</li></ul><p>Desarrollarás un sistema de etiquetas para organizar conversaciones, aprenderás a usar las respuestas rápidas para consultas comunes, y crearás flujos de atención para diferentes tipos de cliente. También veremos cómo integrar WhatsApp con otros sistemas de la farmacia.</p>",
    "duration": 30,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Sistema de Etiquetas para Conversaciones",
        "url": "https://example.com/sistema-etiquetas-whatsapp.xlsx",
        "type": "Excel"
      },
      {
        "title": "Protocolo de Atención al Cliente",
        "url": "https://example.com/protocolo-atencion-whatsapp.pdf",
        "type": "PDF"
      }
    ]
  }
]'),

-- 5. DAFO para tu farmacia
('DAFO para tu farmacia', 'Realiza un análisis DAFO completo de tu farmacia para identificar oportunidades de mejora y ventajas competitivas.', 'gestion', 180, 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', false, '[
  {
    "id": "introduccion-dafo",
    "title": "Introducción al análisis DAFO",
    "content": "<h3>La herramienta estratégica más poderosa para tu farmacia</h3><p>El análisis DAFO (Debilidades, Amenazas, Fortalezas, Oportunidades) es fundamental para la planificación estratégica de cualquier negocio, incluida tu farmacia:</p><ul><li><strong>¿Qué es el DAFO?</strong> Definición y componentes principales</li><li><strong>Factores internos vs externos:</strong> Lo que puedes controlar y lo que no</li><li><strong>Beneficios del análisis DAFO:</strong> Toma de decisiones informadas</li><li><strong>Cuándo realizarlo:</strong> Momentos clave para el análisis</li></ul><p>Aprenderás por qué el DAFO es especialmente útil en el sector farmacéutico, donde convergen aspectos sanitarios, comerciales y regulatorios. Veremos ejemplos reales de farmacias que han utilizado esta herramienta para transformar sus negocios.</p>",
    "duration": 15,
    "video_url": null,
    "downloadable_resources": []
  },
  {
    "id": "identificacion-fortalezas",
    "title": "Identificando fortalezas",
    "content": "<h3>Descubre qué te hace único en el mercado</h3><p>Las fortalezas son los activos internos que te dan ventaja competitiva. En el contexto farmacéutico incluyen:</p><ul><li><strong>Recursos humanos:</strong> Experiencia, especialización, trato al cliente</li><li><strong>Ubicación y local:</strong> Accesibilidad, visibilidad, espacio</li><li><strong>Servicios diferenciados:</strong> Análisis, consultoría, atención especializada</li><li><strong>Tecnología y sistemas:</strong> Software, equipamiento, innovación</li><li><strong>Relaciones:</strong> Médicos, laboratorios, clientes fieles</li></ul><p>Utilizarás herramientas de autoevaluación para identificar tus fortalezas reales, aprenderás a cuantificarlas y documentarlas. También veremos cómo potenciar las fortalezas existentes y cómo comunicarlas efectivamente a tus clientes.</p>",
    "duration": 20,
    "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "downloadable_resources": [
      {
        "title": "Plantilla de Análisis de Fortalezas",
        "url": "https://example.com/plantilla-fortalezas.pdf",
        "type": "PDF"
      }
    ]
  },
  {
    "id": "analisis-debilidades",
    "title": "Analizando debilidades",
    "content": "<h3>Identifica áreas de mejora sin autocastigarte</h3><p>Las debilidades no son fracasos, son oportunidades de crecimiento. Las debilidades comunes en farmacias incluyen:</p><ul><li><strong>Limitaciones de personal:</strong> Falta de especialización o número insuficiente</li><li><strong>Recursos financieros:</strong> Capital limitado para inversiones</li><li><strong>Infraestructura:</strong> Espacio reducido, equipamiento obsoleto</li><li><strong>Procesos ineficientes:</strong> Gestión de stock, atención al cliente</li><li><strong>Marketing y visibilidad:</strong> Presencia digital limitada</li></ul><p>Aprenderás técnicas para realizar una autoevaluación honesta pero constructiva, priorizarás las debilidades según su impacto en el negocio, y desarrollarás planes de acción específicos para convertir debilidades en fortalezas o al menos minimizar su impacto.</p>",
    "duration": 25,
    "video_url": null,
    "downloadable_resources": []
  },
  {
    "id": "deteccion-oportunidades",
    "title": "Detectando oportunidades",
    "content": "<h3>El entorno está lleno de posibilidades</h3><p>Las oportunidades son factores externos favorables que puedes aprovechar para crecer:</p><ul><li><strong>Cambios demográficos:</strong> Envejecimiento poblacional, nuevos barrios</li><li><strong>Tendencias de salud:</strong> Prevención, medicina natural, telemedicina</li><li><strong>Regulación favorable:</strong> Nuevos servicios autorizados para farmacias</li><li><strong>Tecnología emergente:</strong> Apps, sistemas de gestión, robot de dispensación</li><li><strong>Partnerships:</strong> Colaboraciones con médicos, centros de salud, empresas</li></ul><p>Desarrollarás tu capacidad de observación del entorno, aprenderás a investigar tendencias del sector farmacéutico, y crearás un sistema de detección temprana de oportunidades. Incluye casos de farmacias que han sabido aprovechar oportunidades únicas en sus mercados locales.</p>",
    "duration": 30,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Checklist de Oportunidades del Mercado",
        "url": "https://example.com/checklist-oportunidades.xlsx",
        "type": "Excel"
      }
    ]
  },
  {
    "id": "evaluacion-amenazas",
    "title": "Evaluando amenazas",
    "content": "<h3>Prepárate para los desafíos del entorno</h3><p>Las amenazas son factores externos que pueden afectar negativamente tu farmacia:</p><ul><li><strong>Competencia:</strong> Nuevas farmacias, grandes cadenas, venta online</li><li><strong>Cambios regulatorios:</strong> Nuevas restricciones, cambios en márgenes</li><li><strong>Crisis económicas:</strong> Reducción del poder adquisitivo</li><li><strong>Cambios en el modelo sanitario:</strong> Telemedicina, nuevos canales de distribución</li><li><strong>Aspectos sociales:</strong> Cambios en hábitos de consumo de salud</li></ul><p>Aprenderás a monitorizar el entorno de forma sistemática, a evaluar el nivel de riesgo de cada amenaza, y a desarrollar planes de contingencia. No se trata de tener miedo, sino de estar preparado para adaptar tu farmacia a los cambios del mercado.</p>",
    "duration": 25,
    "video_url": null,
    "downloadable_resources": []
  },
  {
    "id": "matriz-dafo",
    "title": "Creando tu matriz DAFO",
    "content": "<h3>Visualiza tu situación estratégica completa</h3><p>La matriz DAFO es la herramienta visual que resume todo tu análisis:</p><ul><li><strong>Construcción de la matriz:</strong> Organización clara de la información</li><li><strong>Priorización de elementos:</strong> No todos tienen la misma importancia</li><li><strong>Interrelaciones:</strong> Cómo unos factores influyen en otros</li><li><strong>Análisis cruzado:</strong> Estrategias FO, FA, DO, DA</li></ul><p>Aprenderás a construir una matriz DAFO profesional, a ponderar cada elemento según su impacto, y a identificar las estrategias más prometedoras combinando fortalezas con oportunidades. Incluye plantillas y ejemplos específicos del sector farmacéutico.</p>",
    "duration": 35,
    "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "downloadable_resources": [
      {
        "title": "Plantilla Matriz DAFO Farmacia",
        "url": "https://example.com/matriz-dafo.xlsx",
        "type": "Excel"
      }
    ]
  },
  {
    "id": "estrategias-implementacion",
    "title": "Estrategias y plan de implementación",
    "content": "<h3>Del análisis a la acción</h3><p>Un DAFO sin plan de acción es solo un ejercicio académico. Aprenderás a:</p><ul><li><strong>Definir estrategias específicas:</strong> Ofensivas, defensivas, adaptativas, supervivencia</li><li><strong>Establecer prioridades:</strong> Qué hacer primero y por qué</li><li><strong>Crear cronogramas:</strong> Plazos realistas para cada acción</li><li><strong>Asignar recursos:</strong> Presupuesto y personal necesario</li><li><strong>Definir indicadores:</strong> Cómo medir el progreso</li></ul><p>Desarrollarás un plan de implementación personalizado para tu farmacia, con objetivos SMART, responsables definidos y sistema de seguimiento. Al final del módulo tendrás una hoja de ruta clara para los próximos 12 meses basada en tu análisis DAFO.</p>",
    "duration": 30,
    "video_url": null,
    "downloadable_resources": [
      {
        "title": "Guía de Implementación DAFO",
        "url": "https://example.com/guia-implementacion.pdf",
        "type": "PDF"
      },
      {
        "title": "Plantilla Plan de Acción",
        "url": "https://example.com/plan-accion-dafo.xlsx",
        "type": "Excel"
      }
    ]
  }
]');
