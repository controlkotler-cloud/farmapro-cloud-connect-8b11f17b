import { IAFarmaDefaults } from '@/hooks/useIAFarmaDefaults';
import { getSeasonal } from './seasonal';

// =====================================================================
// Plantillas de pieza de IAFarma Imagen (promo / cartel / post / story).
// Cada plantilla define su formato por defecto y una descripción inicial
// construida con los datos de la farmacia + el calendario estacional
// (seasonal.ts): en junio proponen campaña solar, en septiembre vuelta al
// cole, en diciembre cofres de regalo... El usuario puede cambiarlo todo.
// =====================================================================

export type PieceTypeId = 'promo' | 'cartel' | 'post' | 'story';
export type FormatId = 'feed' | 'vertical' | 'a4' | 'horizontal';

/** Longitud máxima del titular que se rotula en la imagen (contrato con el backend). */
export const HEADLINE_MAX = 60;

export interface ImageFormat {
  id: FormatId;
  label: string;
  hint: string;
  /** Tamaño final de la pieza (campo `size` de la edge). Marca la PROPORCIÓN. */
  size: string;
}

/**
 * Formatos disponibles. El modelo actual (gpt-image-2) solo genera 1:1, 2:3 y
 * 3:2; la edge lo sabe (mapSizeForGptImage) y añade al prompt una "zona
 * segura" con la proporción final. El CLIENTE recorta al centro a la
 * proporción exacta de aquí (preview con object-cover + canvas al descargar),
 * así que lo que promete la etiqueta es lo que se descarga:
 *  - Feed 4:5 (1080x1350) — se genera 2:3 y se recorta a 4:5.
 *  - Vertical 9:16 (1080x1920) — se genera 2:3 y se recorta a 9:16.
 *  - Cartel A4 — se genera 2:3, la proporción más cercana al DIN A4 (1:1,41);
 *    al imprimir queda un margen lateral pequeño.
 *  - Horizontal 16:9 (1920x1080) — se genera 3:2 y se recorta a 16:9.
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

// Estacionalidad calculada al cargar el módulo: suficiente (nadie tiene la
// pestaña abierta de un mes a otro) y evita cambiar la firma de PIECE_TYPES.
const S = getSeasonal();

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
    headlineExample: S.headlines.promo,
    buildPrompt: (d) =>
      `Pieza de promoción: envase genérico de ${S.productoPromo} como protagonista sobre fondo limpio, ` +
      `el titular con la oferta bien grande, etiqueta de descuento destacada, ${S.paleta}, ${tonoDe(d)}`,
  },
  {
    id: 'cartel',
    label: 'Cartel',
    hint: 'Escaparate o interior',
    defaultFormat: 'a4',
    headlineExample: S.headlines.cartel,
    buildPrompt: (d) =>
      `Cartel comercial: titular grande arriba, una ilustración central potente (${S.iconos}), ` +
      `subtítulo corto abajo, composición vertical limpia y legible de lejos, ${S.paleta}, ${tonoDe(d)}`,
  },
  {
    id: 'post',
    label: 'Post para redes',
    hint: 'Instagram o Facebook',
    defaultFormat: 'feed',
    headlineExample: S.headlines.post,
    buildPrompt: (d) =>
      `Post tipo infografía: el titular grande arriba y debajo una lista de 3 a 5 consejos cortos, cada uno ` +
      `con su icono ilustrado (${S.iconos}). Escribe aquí los consejos si quieres que ` +
      `salgan literales. ${S.paleta.charAt(0).toUpperCase() + S.paleta.slice(1)}, ${tonoDe(d)}`,
  },
  {
    id: 'story',
    label: 'Story',
    hint: 'Vertical, a pantalla completa',
    defaultFormat: 'vertical',
    headlineExample: S.headlines.story,
    buildPrompt: (d) =>
      `Story vertical de un solo mensaje: titular grande centrado, fondo llamativo con elementos gráficos ` +
      `del tema (${S.iconos}), espacio libre abajo para sticker, ${S.paleta}, ${tonoDe(d)}`,
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
