/**
 * Resolución de URLs de vídeo a algo reproducible dentro del portal.
 *
 * Fuente única para todos los vídeos del portal: módulos de curso, vault de la
 * Rebotica, bienvenida del onboarding y la propia página de la Rebotica.
 * Soporta YouTube, Vimeo (incluido enlace privado con hash), Google Drive
 * (fichero compartido "cualquiera con el enlace") y ficheros mp4/webm directos.
 * Lo que no reconoce se abre fuera, en pestaña nueva.
 */
export type VideoEmbed =
  | { kind: 'iframe'; src: string }
  | { kind: 'file'; src: string }
  | { kind: 'link'; src: string };

export const resolveVideoEmbed = (raw: string): VideoEmbed => {
  const url = raw.trim();
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { kind: 'link', src: url };
  }
  const host = u.hostname.replace(/^www\./, '');

  // YouTube: watch?v=ID · youtu.be/ID · /embed/ID · /shorts/ID
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
    let id = '';
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (u.searchParams.get('v')) id = u.searchParams.get('v') ?? '';
    else {
      const m = u.pathname.match(/\/(embed|shorts|live)\/([A-Za-z0-9_-]{6,})/);
      if (m) id = m[2];
    }
    if (id) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` };
  }

  // Vimeo: vimeo.com/ID · vimeo.com/ID/HASH (enlace privado) · player.vimeo.com/video/ID
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/\/(?:video\/)?(\d+)(?:\/([a-f0-9]+))?/);
    if (m) {
      const hash = m[2] ? `?h=${m[2]}` : '';
      return { kind: 'iframe', src: `https://player.vimeo.com/video/${m[1]}${hash}` };
    }
  }

  // Google Drive: drive.google.com/file/d/ID/view → /preview
  if (host === 'drive.google.com') {
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    const id = m?.[1] ?? u.searchParams.get('id');
    if (id) return { kind: 'iframe', src: `https://drive.google.com/file/d/${id}/preview` };
  }

  // Fichero directo (Supabase Storage, CDN…)
  if (/\.(mp4|webm|m4v|mov)(\?|$)/i.test(u.pathname + u.search)) {
    return { kind: 'file', src: url };
  }

  return { kind: 'link', src: url };
};
