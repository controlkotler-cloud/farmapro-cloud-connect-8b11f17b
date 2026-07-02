import { IAFarmaDefaults } from '@/hooks/useIAFarmaDefaults';

// =====================================================================
// Plantillas de pieza de IAFarma Imagen (promo / cartel / post / story).
// Cada plantilla define su formato por defecto y una descripción inicial
// construida con los datos de la farmacia. El usuario puede cambiarlo todo.
// =====================================================================

export type PieceTypeId = 'promo' | 'cartel' | 'post' | 'story';
export type FormatId = 'cuadrado' | 'vertical' | 'horizontal';

/** Longitud máxima del titular que se rotula en la imagen (contrato con el backend). */
export const HEADLINE_MAX = 60;

export interface ImageFormat {
  id: FormatId;
  label: string;
  hint: string;
  /** Tamaño que se envía a la edge function (campo `size`). */
  size: string;
}

export const IMAGE_FORMATS: ImageFormat[] = [
  { id: 'cuadrado', label: 'Cuadrado 1:1', hint: 'Instagram y Facebook', size: '1024x1024' },
  { id: 'vertical', label: 'Vertical 9:16', hint: 'Stories y carteles', size: '1024x1792' },
  { id: 'horizontal', label: 'Horizontal 16:9', hint: 'Portadas y pantallas', size: '1792x1024' },
];

export interface PieceType {
  id: PieceTypeId;
  label: string;
  hint: string;
  defaultFormat: FormatId;
  /** Ejemplo de titular para el placeholder del campo. */
  headlineExample: string;
  /** Descripción inicial de la imagen a partir de los datos de la farmacia. */
  buildPrompt: (defaults: IAFarmaDefaults) => string;
}

const contexto = (d: IAFarmaDefaults) => ({
  lugar: d.localidad?.trim() ? ` en ${d.localidad.trim()}` : '',
  tono: d.tono?.trim() ? `tono ${d.tono.trim().toLowerCase()}` : 'tono profesional',
});

export const PIECE_TYPES: PieceType[] = [
  {
    id: 'promo',
    label: 'Promo de producto',
    hint: 'Oferta o producto destacado',
    defaultFormat: 'cuadrado',
    headlineExample: 'Protección solar -20%',
    buildPrompt: (d) => {
      const { lugar, tono } = contexto(d);
      return `Promoción de protección solar en una farmacia${lugar}, producto destacado en primer plano, ${tono}`;
    },
  },
  {
    id: 'cartel',
    label: 'Cartel',
    hint: 'Escaparate o interior',
    defaultFormat: 'vertical',
    headlineExample: 'Campaña solar: te asesoramos',
    buildPrompt: (d) => {
      const { lugar, tono } = contexto(d);
      return `Cartel para el escaparate de una farmacia${lugar}, campaña de protección solar, ${tono}`;
    },
  },
  {
    id: 'post',
    label: 'Post para redes',
    hint: 'Instagram o Facebook',
    defaultFormat: 'cuadrado',
    headlineExample: '5 consejos para tu piel este verano',
    buildPrompt: (d) => {
      const { lugar, tono } = contexto(d);
      return `Post para redes sociales de una farmacia${lugar}, consejo de verano sobre protección solar, ${tono}`;
    },
  },
  {
    id: 'story',
    label: 'Story',
    hint: 'Vertical, a pantalla completa',
    defaultFormat: 'vertical',
    headlineExample: 'Novedad en dermocosmética',
    buildPrompt: (d) => {
      const { lugar, tono } = contexto(d);
      return `Story vertical de una farmacia${lugar}, novedad de dermocosmética, ${tono}`;
    },
  },
];

export const getPieceType = (id: PieceTypeId): PieceType =>
  PIECE_TYPES.find((p) => p.id === id) ?? PIECE_TYPES[0];

export const getFormat = (id: FormatId): ImageFormat =>
  IMAGE_FORMATS.find((f) => f.id === id) ?? IMAGE_FORMATS[0];
