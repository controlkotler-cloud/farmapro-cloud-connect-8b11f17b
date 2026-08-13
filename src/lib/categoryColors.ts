// Fuente de verdad ÚNICA del color por materia (categoría de contenido).
//
// Antes cada sección (Formación, Recursos…) tenía su propio reparto y la misma
// materia cambiaba de color al cambiar de pestaña. Aquí se fija una sola vez.
//
// `onSolid` es el color de texto/icono que puede ir ENCIMA de `solid`. Sobre el
// verde de marca (bg-brand) y sobre miel el contraste del blanco es ~2:1, así que
// ahí se usa tinta (`text-foreground`), nunca blanco: el canon de marca lo prohíbe
// expresamente.
//
// Con cinco tonos disponibles (brand, brand-dark, miel, terracota, salvia, ciruela)
// y once claves de materia, hay reutilización DELIBERADA de tono entre materias
// hermanas: digital comparte con marketing, tecnología con gestión e impulso con
// liderazgo. No es un descuido: rara vez conviven en el mismo filtro visible.

export interface CategoryColor {
  solid: string;
  soft: string;
  text: string;
  onSolid: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  ventas: { solid: 'bg-brand', soft: 'bg-brand-soft', text: 'text-brand-dark', onSolid: 'text-foreground' },
  marketing: { solid: 'bg-terracota', soft: 'bg-terracota-soft', text: 'text-terracota', onSolid: 'text-white' },
  gestion: { solid: 'bg-ciruela', soft: 'bg-ciruela-soft', text: 'text-ciruela', onSolid: 'text-white' },
  liderazgo: { solid: 'bg-miel', soft: 'bg-miel-soft', text: 'text-miel', onSolid: 'text-foreground' },
  atencion: { solid: 'bg-salvia', soft: 'bg-salvia-soft', text: 'text-salvia', onSolid: 'text-white' },
  atencion_cliente: { solid: 'bg-salvia', soft: 'bg-salvia-soft', text: 'text-salvia', onSolid: 'text-white' },
  tecnologia: { solid: 'bg-ciruela', soft: 'bg-ciruela-soft', text: 'text-ciruela', onSolid: 'text-white' },
  finanzas: { solid: 'bg-brand-dark', soft: 'bg-brand-soft', text: 'text-brand-dark', onSolid: 'text-white' },
  digital: { solid: 'bg-terracota', soft: 'bg-terracota-soft', text: 'text-terracota', onSolid: 'text-white' },
  impulso: { solid: 'bg-miel', soft: 'bg-miel-soft', text: 'text-miel', onSolid: 'text-foreground' },
  otros: { solid: 'bg-brand-dark', soft: 'bg-muted', text: 'text-muted-foreground', onSolid: 'text-white' },
};

export const getCategoryColor = (key?: string | null): CategoryColor =>
  (key && CATEGORY_COLORS[key]) || CATEGORY_COLORS.otros;
