import { IAFarmaDefaults } from '@/hooks/useIAFarmaDefaults';

// =====================================================================
// Plantillas de pieza de IAFarma Imagen (promo / cartel / post / story).
// Cada plantilla define su formato por defecto y una descripción inicial
// construida con los datos de la farmacia. El usuario puede cambiarlo todo.
// =====================================================================

export type PieceTypeId = 'promo' | 'cartel' | 'post' | 'story';
export type FormatId = 'feed' | 'cuadrado' | 'vertical' | 'a4' | 'horizontal';

/** Longitud máxima del titular que se rotula en la imagen (contrato con el backend). */
export const HEADLINE_MAX = 60;

export interface ImageFormat {
  id: FormatId;
  label: string;
  hint: string;
  /** Tamaño que se envía a la edge function (campo `size`). Marca la PROPORCIÓN. */
  size: string;
}

/**
 * Formatos disponibles. El feed de Instagram/Facebook actual es VERTICAL 4:5
 * (1080x1350), no cuadrado; el cuadrado se mantiene para carruseles y usos
 * clásicos. El cartel para imprimir usa la proporción DIN A4 vertical (1:1,41).
 */
export const IMAGE_FORMATS: ImageFormat[] = [
  { id: 'feed', label: 'Feed 4:5', hint: 'Post de Instagram y Facebook', size: '1080x1350' },
  { id: 'cuadrado', label: 'Cuadrado 1:1', hint: 'Carruseles y catálogo', size: '1080x1080' },
  { id: 'vertical', label: 'Vertical 9:16', hint: 'Stories y reels', size: '1080x1920' },
  { id: 'a4', label: 'Cartel A4', hint: 'Para imprimir en DIN A4', size: '1240x1754' },
  { id: 'horizontal', label: 'Horizontal 16:9', hint: 'Portadas y pantallas', size: '1920x1080' },
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
    defaultFormat: 'feed',
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
    defaultFormat: 'a4',
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
    defaultFormat: 'feed',
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
