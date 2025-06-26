
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    // Reemplazar caracteres acentuados
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    // Reemplazar espacios múltiples con uno solo
    .replace(/\s+/g, ' ')
    // Reemplazar espacios con guiones
    .replace(/\s/g, '-')
    // Eliminar caracteres especiales excepto guiones y números
    .replace(/[^a-z0-9-]/g, '')
    // Reemplazar múltiples guiones consecutivos con uno solo
    .replace(/-+/g, '-')
    // Eliminar guiones al inicio y final
    .replace(/^-+|-+$/g, '');
};

export const validateSlug = (slug: string): boolean => {
  // Un slug válido debe contener solo letras minúsculas, números y guiones
  // No puede empezar o terminar con guión
  // No puede tener guiones consecutivos
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
};

// Función para regenerar todos los slugs existentes con el nuevo formato
export const regenerateSlug = (title: string): string => {
  return generateSlug(title);
};
