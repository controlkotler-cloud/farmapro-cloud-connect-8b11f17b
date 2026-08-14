// =====================================================================
// Utilidades de imagen de IAFarma (cliente).
//  - Recorte al formato exacto elegido (el modelo solo genera 1:1, 2:3, 3:2).
//  - Overlay del logo real de la farmacia (nunca se le pide al modelo que
//    dibuje logos: los deforma; el logo se superpone píxel-perfecto aquí).
// Las usan ImageWorkspace (pieza suelta) y CarouselImages (serie de slides).
// =====================================================================

/**
 * Recorta un blob de imagen a las dimensiones EXACTAS pedidas (recorte
 * centrado + reescalado). Devuelve un PNG del tamaño objetivo.
 */
export const cropBlobToFormat = async (blob: Blob, targetW: number, targetH: number): Promise<Blob> => {
  const bitmap = await createImageBitmap(blob);
  try {
    const targetRatio = targetW / targetH;
    const srcRatio = bitmap.width / bitmap.height;
    let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
    if (srcRatio > targetRatio) {
      sw = Math.round(bitmap.height * targetRatio);
      sx = Math.round((bitmap.width - sw) / 2);
    } else if (srcRatio < targetRatio) {
      sh = Math.round(bitmap.width / targetRatio);
      sy = Math.round((bitmap.height - sh) / 2);
    }
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return blob;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, targetW, targetH);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/png'),
    );
  } finally {
    bitmap.close();
  }
};

/**
 * Superpone el logo de la farmacia en la esquina inferior derecha de la pieza
 * (~16% del ancho, con margen del 4%). El backend ya deja esa esquina limpia
 * cuando se genera con `logoCorner: true`.
 */
export const overlayLogo = async (blob: Blob, logoUrl: string): Promise<Blob> => {
  const [pieceBitmap, logoBitmap] = await Promise.all([
    createImageBitmap(blob),
    fetch(logoUrl).then((r) => {
      if (!r.ok) throw new Error('No se pudo cargar el logo');
      return r.blob();
    }).then((b) => createImageBitmap(b)),
  ]);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = pieceBitmap.width;
    canvas.height = pieceBitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return blob;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(pieceBitmap, 0, 0);

    // Sin placa detrás (decisión Francesc): el logo va directo sobre el fondo.
    // La legibilidad la garantiza la reserva de esquina del prompt (el
    // rectángulo del logo debe ser solo fondo, sin texto debajo).
    const margin = Math.round(canvas.width * 0.04);
    const logoW = Math.round(canvas.width * 0.16);
    const logoH = Math.round(logoW * (logoBitmap.height / logoBitmap.width));
    ctx.drawImage(
      logoBitmap,
      canvas.width - logoW - margin,
      canvas.height - logoH - margin,
      logoW,
      logoH,
    );
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo aplicar el logo'))), 'image/png'),
    );
  } finally {
    pieceBitmap.close();
    logoBitmap.close();
  }
};

/** Descarga un blob como fichero (patrón seguro para Safari: click síncrono). */
export const downloadBlob = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
};

/** Fecha compacta para nombres de fichero: 20260814. */
export const fileDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
};
