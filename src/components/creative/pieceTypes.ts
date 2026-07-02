import { IAFarmaDefaults } from '@/hooks/useIAFarmaDefaults';

// =====================================================================
// Plantillas de pieza de IAFarma Imagen (promo / cartel / post / story).
// Cada plantilla define su formato por defecto y una descripción inicial
// construida con los datos de la farmacia. El usuario puede cambiarlo todo.
// =====================================================================

export type PieceTypeId = 'promo' | 'cartel' | 'post' | 'story';
export type FormatId = 'feed' | 'vertical' | 'a4' | 'horizontal';

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
 * Formatos disponibles. Todas las proporciones son de la lista que SOPORTA el
 * modelo de imagen de Gemini (imageConfig.aspectRatio): 1:1, 2:3, 3:2, 3:4,
 * 4:3, 4:5, 5:4, 9:16, 16:9, 21:9.
 *  - Feed y carrusel de Instagram/Facebook = 4:5 vertical (1080x1350).
 *  - El DIN A4 (1:1,41) NO está soportado: el cartel se genera en 2:3, la
 *    proporción soportada más cercana; al imprimir en A4 queda un margen
 *    lateral pequeño (o un recorte mínimo arriba/abajo).
 */
export const IMAGE_FORMATS: ImageFormat[] = [
  { id: 'feed', label: 'Feed 4:5', hint: 'Post y carrusel de Instagram/Facebook', size: '1080x1350' },
  { id: 'vertical', label: 'Vertical 9:16', hint: 'Stories y reels', size: '1080x1920' },
  { id: 'a4', label: 'Cartel A4', hint: 'Imprimir en A4 (se genera en 2:3)', size: '1200x1800' },
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

const tonoDe = (d: IAFarmaDefaults) =>
  d.tono?.trim() ? `tono ${d.tono.trim().toLowerCase()}` : 'tono profesional y cercano';

// OJO: las descripciones NO piden "una farmacia" (eso produce fachadas y
// farmacéuticos ficticios que no sirven). Describen la PIEZA: qué elementos
// gráficos tiene y dónde va el titular. Los textos que deban aparecer
// (consejos, precios) se escriben literales en la descripción.
export const PIECE_TYPES: PieceType[] = [
  {
    id: 'promo',
    label: 'Promo de producto',
    hint: 'Oferta o producto destacado',
    defaultFormat: 'feed',
    headlineExample: 'Protección solar -20%',
    buildPrompt: (d) =>
      `Pieza de promoción: envase genérico de crema solar como protagonista sobre fondo veraniego limpio, ` +
      `el titular con la oferta bien grande, etiqueta de descuento destacada, ${tonoDe(d)}`,
  },
  {
    id: 'cartel',
    label: 'Cartel',
    hint: 'Escaparate o interior',
    defaultFormat: 'a4',
    headlineExample: 'Campaña solar: te asesoramos',
    buildPrompt: (d) =>
      `Cartel comercial: titular grande arriba, una ilustración central potente (sol, crema, gafas de sol), ` +
      `subtítulo corto abajo, composición vertical limpia y legible de lejos, ${tonoDe(d)}`,
  },
  {
    id: 'post',
    label: 'Post para redes',
    hint: 'Instagram o Facebook',
    defaultFormat: 'feed',
    headlineExample: '5 consejos para tu piel este verano',
    buildPrompt: (d) =>
      `Post tipo infografía: el titular grande arriba y debajo una lista de 3 a 5 consejos cortos, cada uno ` +
      `con su icono ilustrado (sol, crema, gafas, sombrero, agua). Escribe aquí los consejos si quieres que ` +
      `salgan literales. Colores frescos de verano, ${tonoDe(d)}`,
  },
  {
    id: 'story',
    label: 'Story',
    hint: 'Vertical, a pantalla completa',
    defaultFormat: 'vertical',
    headlineExample: 'Novedad en dermocosmética',
    buildPrompt: (d) =>
      `Story vertical de un solo mensaje: titular grande centrado, fondo llamativo con elementos gráficos ` +
      `de dermocosmética (texturas de crema, hojas, gotas), espacio libre abajo para sticker, ${tonoDe(d)}`,
  },
];

export const getPieceType = (id: PieceTypeId): PieceType =>
  PIECE_TYPES.find((p) => p.id === id) ?? PIECE_TYPES[0];

export const getFormat = (id: FormatId): ImageFormat =>
  IMAGE_FORMATS.find((f) => f.id === id) ?? IMAGE_FORMATS[0];

// ---------------------------------------------------------------------
// Estilo de la pieza. La lección de la primera prueba real (02-07): si el
// prompt describe "una farmacia", el modelo pinta una farmacia ficticia
// preciosa e inservible. Para redes lo útil casi siempre es DISEÑO GRÁFICO
// (titular, iconos, colores), no una foto. El estilo viaja en el campo
// `style` del contrato existente y el backend lo inserta como "Style hint".
// ---------------------------------------------------------------------

export type StyleId = 'diseno' | 'foto';

export interface ImageStyle {
  id: StyleId;
  label: string;
  hint: string;
  /** Texto que se envía al backend en el campo `style`. */
  promptStyle: string;
}

export const IMAGE_STYLES: ImageStyle[] = [
  {
    id: 'diseno',
    label: 'Diseño gráfico',
    hint: 'Titular, iconos y color. Lo normal para redes',
    promptStyle:
      'flat graphic design artwork, bold clean typography, illustrated icons, modern color palette, ' +
      'composition designed around the headline text, NO photorealistic scene, no pharmacy storefront, no people',
  },
  {
    id: 'foto',
    label: 'Fotografía',
    hint: 'Escena fotográfica realista',
    promptStyle: 'bright commercial photography, realistic scene, professional retail aesthetic',
  },
];

export const getStyle = (id: StyleId): ImageStyle =>
  IMAGE_STYLES.find((s) => s.id === id) ?? IMAGE_STYLES[0];
