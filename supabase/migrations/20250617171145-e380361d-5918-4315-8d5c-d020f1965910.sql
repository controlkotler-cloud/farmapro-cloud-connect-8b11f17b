
-- Add new columns to courses table for enhanced content
ALTER TABLE public.courses 
ADD COLUMN featured_image_url text,
ADD COLUMN course_modules jsonb DEFAULT '[]'::jsonb;

-- Update the existing DAFO course with a featured image and enhanced modules
UPDATE public.courses 
SET 
  featured_image_url = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  course_modules = '[
    {
      "id": "introduccion",
      "title": "Introducción al Análisis DAFO", 
      "duration": 15,
      "video_url": null,
      "downloadable_resources": []
    },
    {
      "id": "fortalezas", 
      "title": "Identificando Fortalezas",
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
      "id": "debilidades",
      "title": "Analizando Debilidades", 
      "duration": 25,
      "video_url": null,
      "downloadable_resources": []
    },
    {
      "id": "oportunidades",
      "title": "Detectando Oportunidades",
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
      "id": "amenazas",
      "title": "Evaluando Amenazas",
      "duration": 25,
      "video_url": null,
      "downloadable_resources": []
    },
    {
      "id": "matriz", 
      "title": "Creando tu Matriz DAFO",
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
      "id": "implementacion",
      "title": "Plan de Implementación", 
      "duration": 30,
      "video_url": null,
      "downloadable_resources": [
        {
          "title": "Guía de Implementación DAFO",
          "url": "https://example.com/guia-implementacion.pdf",
          "type": "PDF"
        }
      ]
    }
  ]'
WHERE title = 'DAFO para tu Farmacia';
