// =====================================================================
// Calendario farmacéutico estacional de IAFarma.
//
// Antes las plantillas de pieza y las "ideas rápidas" estaban hardcodeadas
// con la campaña solar de verano, así que en noviembre IAFarma seguía
// proponiendo cremas solares. Este módulo da a cada mes sus temas, su
// producto estrella, sus iconos y su paleta, y el resto de IAFarma
// (pieceTypes, QuickTemplates) se alimenta de aquí.
//
// Es deliberadamente estático y barato de mantener: 12 entradas de texto.
// Para ajustar una campaña (p. ej. adelantar la solar) basta editar su mes.
// =====================================================================

export interface SeasonalInfo {
  /** Temas de contenido del mes (alimentan las "ideas rápidas"). */
  temas: string[];
  /** Producto/categoría estrella para la pieza de promoción. */
  productoPromo: string;
  /** Iconos ilustrados sugeridos para piezas tipo infografía. */
  iconos: string;
  /** Paleta/ambiente para las descripciones de pieza. */
  paleta: string;
  /** Ejemplos de titular por tipo de pieza (placeholders del formulario). */
  headlines: { promo: string; cartel: string; post: string; story: string };
}

const CALENDARIO: SeasonalInfo[] = [
  // Enero
  {
    temas: ['Propósitos: hábitos saludables', 'Vitaminas y defensas', 'Cuidado digestivo tras las fiestas', 'Dejar de fumar con ayuda'],
    productoPromo: 'complementos vitamínicos',
    iconos: 'cápsula, corazón, manzana, agenda',
    paleta: 'paleta limpia en blancos y verdes con un acento vibrante',
    headlines: { promo: 'Vitaminas -20%', cartel: 'Empieza el año cuidándote', post: '5 hábitos para empezar bien el año', story: 'Nuevo año, nueva rutina' },
  },
  // Febrero
  {
    temas: ['Piel sensible en invierno', 'Salud del corazón', 'Labios y manos agrietados', 'San Valentín: cuida y regala'],
    productoPromo: 'crema para piel sensible',
    iconos: 'copo de nieve, crema, corazón, guante',
    paleta: 'tonos fríos suaves con un acento cálido',
    headlines: { promo: 'Piel sensible -20%', cartel: 'Protege tu piel del frío', post: '5 cuidados para tu piel en invierno', story: 'SOS piel sensible' },
  },
  // Marzo
  {
    temas: ['Llega la alergia: prepárate', 'Cambio de hora y descanso', 'Primeros soles: protege tu piel', 'Energía para la primavera'],
    productoPromo: 'cuidado para épocas de alergia (parafarmacia)',
    iconos: 'flor, pañuelo, sol suave, hoja',
    paleta: 'verdes frescos y amarillos suaves de primavera',
    headlines: { promo: 'Primavera -20%', cartel: 'La primavera ya está aquí', post: '5 consejos frente a la alergia', story: 'Alerta polen' },
  },
  // Abril
  {
    temas: ['Alergia primaveral a raya', 'Prepara la piel para el sol', 'Piernas ligeras: empieza ahora', 'Botiquín para tu escapada'],
    productoPromo: 'protección solar facial',
    iconos: 'sol, flor, gota, maleta',
    paleta: 'pasteles primaverales luminosos',
    headlines: { promo: 'Solar facial -20%', cartel: 'Tu piel, lista para el sol', post: 'Guía rápida contra el polen', story: 'Escapada: tu botiquín' },
  },
  // Mayo
  {
    temas: ['Empieza la campaña solar', 'Piernas cansadas', 'Operación verano con salud', 'Hidratación para el deporte'],
    productoPromo: 'crema solar',
    iconos: 'sol, crema, piernas, botella de agua',
    paleta: 'azules y corales luminosos de preverano',
    headlines: { promo: 'Protección solar -20%', cartel: 'Campaña solar: te asesoramos', post: '5 errores con la crema solar', story: 'El sol ya aprieta' },
  },
  // Junio
  {
    temas: ['Protección solar cada día', 'Botiquín de viaje', 'Picaduras: prevenir y aliviar', 'Hidratación en verano'],
    productoPromo: 'crema solar',
    iconos: 'sol, crema, gafas de sol, sombrero',
    paleta: 'colores frescos de verano',
    headlines: { promo: 'Protección solar -20%', cartel: 'Campaña solar: te asesoramos', post: '5 consejos para tu piel este verano', story: 'Verano con piel sana' },
  },
  // Julio
  {
    temas: ['Después del sol: repara tu piel', 'Picaduras de verano', 'Hidratación y golpe de calor', 'Cuida tu pelo del sol y el mar'],
    productoPromo: 'aftersun',
    iconos: 'sol, aloe vera, mosquito, ola',
    paleta: 'colores vivos de pleno verano',
    headlines: { promo: 'Aftersun -20%', cartel: 'Disfruta del sol con cabeza', post: '5 gestos que salvan tu piel en verano', story: 'SOS después del sol' },
  },
  // Agosto
  {
    temas: ['Botiquín de vacaciones', 'Protección solar también en la ciudad', 'Digestiones ligeras en verano', 'Vuelta de vacaciones: rutina facial'],
    productoPromo: 'crema solar',
    iconos: 'maleta, sol, crema, gafas de sol',
    paleta: 'colores cálidos de verano',
    headlines: { promo: 'Solares -20%', cartel: 'Tu botiquín de vacaciones', post: '5 imprescindibles en tu neceser de viaje', story: 'Agosto al sol, piel protegida' },
  },
  // Septiembre
  {
    temas: ['Vuelta al cole: piojos a raya', 'Recupera la rutina de sueño', 'Refuerza tus defensas', 'Piel después del verano'],
    productoPromo: 'tratamiento antipiojos',
    iconos: 'mochila, peine, escudo, luna',
    paleta: 'azules y naranjas de vuelta al cole',
    headlines: { promo: 'Antipiojos -20%', cartel: 'Vuelta al cole sin piojos', post: 'Piojos: 5 claves para el cole', story: 'Operación vuelta al cole' },
  },
  // Octubre
  {
    temas: ['Prepara tus defensas para el frío', 'Caída estacional del cabello', 'Resfriados: prevenir y aliviar', 'Hidratación de otoño'],
    productoPromo: 'complementos para las defensas',
    iconos: 'escudo, hoja de otoño, pañuelo, taza caliente',
    paleta: 'tonos otoñales cálidos',
    headlines: { promo: 'Defensas -20%', cartel: 'Llega el frío: refuerza tus defensas', post: '5 claves para un otoño sin resfriados', story: 'Otoño: activa tus defensas' },
  },
  // Noviembre
  {
    temas: ['Piel seca: hidratación intensa', 'Labios protegidos del frío', 'Defensas en plena forma', 'Cuida tus manos este invierno'],
    productoPromo: 'crema hidratante corporal',
    iconos: 'copo de nieve, crema, labios, guantes',
    paleta: 'tonos fríos elegantes con un acento cálido',
    headlines: { promo: 'Hidratación -20%', cartel: 'Tu piel también nota el frío', post: '5 gestos contra la piel seca', story: 'Frío y piel: kit de rescate' },
  },
  // Diciembre
  {
    temas: ['Regala salud y cuidado', 'Cofres de dermocosmética', 'Digestiones ligeras en fiestas', 'Protege tu piel del frío'],
    productoPromo: 'cofre regalo de dermocosmética',
    iconos: 'regalo, estrella, crema, copa',
    paleta: 'burdeos, dorados y verdes navideños elegantes',
    headlines: { promo: 'Cofres regalo -20%', cartel: 'Esta Navidad, regala cuidado', post: 'Ideas de regalo con salud', story: 'Regalos que cuidan' },
  },
];

/** Información estacional del mes en curso (o del mes de la fecha dada). */
export const getSeasonal = (date: Date = new Date()): SeasonalInfo =>
  CALENDARIO[date.getMonth()];
