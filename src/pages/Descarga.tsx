import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Download, FileText, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// /descarga/:slug — página pública del descargable vigente de una quincena
// de Impulso.
//
// Impulso lleva desde N1 prometiendo un descargable gratis en cada quincena,
// y esa promesa se cumplía a medias: el fichero era público pero solo se
// anunciaba dentro del portal, con cuenta de por medio y gastando una de las
// 3 descargas del plan Gratis. Decisión de Francesc, 15-09-2026: mientras la
// quincena está vigente (resources.open_until en el futuro) se baja SIN
// cuenta desde aquí; pasada la ventana, el fichero solo vive dentro del
// portal y esta misma página explica por qué, en vez de servirlo.
//
// Las columnas open_until/is_newsletter/newsletter_ref son nuevas
// (contenido/ventana-descargables-impulso-2026-09-15.sql) y todavía no están
// en los types generados de Supabase: de ahí el `as any` en la consulta. La
// política RLS que permite leer esta fila a `anon` ya existe (is_published =
// true AND is_premium = false) y no se toca aquí.
// ---------------------------------------------------------------------------

interface RecursoPublico {
  title: string;
  description: string | null;
  format: string | null;
  file_url: string | null;
  open_until: string | null;
  newsletter_ref: string | null;
}

type Estado = 'cargando' | 'abierta' | 'cerrada' | 'no_encontrado';

const formatearFechaLimite = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

// Mismo patrón que PageMeta.tsx (que no cubre rutas dinámicas como esta: no
// conoce el título de CADA recurso, así que aquí nos ponemos nuestro propio
// title/description tras cargar la ficha).
const setMetaTag = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    const match = selector.match(/\[(name|property|rel)="([^"]+)"\]/);
    if (match) el.setAttribute(match[1], match[2]);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value));
};

// Enlace de alta con el destino preservado tras registrarse (mismo patrón que
// ya usa la Rebotica en /login?modo=registro&e=...): sin esto, quien crea la
// cuenta desde aquí caería en el dashboard vacío en vez de en su recurso.
const registerHref = (destino: string) => {
  const params = new URLSearchParams();
  params.set('modo', 'registro');
  params.set('next', destino);
  return `/login?${params.toString()}`;
};

const CabeceraPublica = () => (
  <header className="border-b bg-white/70 backdrop-blur">
    <div className="container mx-auto flex items-center justify-between px-4 py-3">
      <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Link>
      <img src="/logo-farmapro.svg" alt="farmapro" className="h-6" />
    </div>
  </header>
);

const Descarga = () => {
  const { slug } = useParams<{ slug: string }>();
  const [estado, setEstado] = useState<Estado>('cargando');
  const [recurso, setRecurso] = useState<RecursoPublico | null>(null);

  useEffect(() => {
    if (!slug) {
      setEstado('no_encontrado');
      return;
    }
    let activo = true;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('resources')
        .select('title, description, format, file_url, open_until, newsletter_ref')
        .eq('slug', slug)
        .eq('is_published', true)
        .eq('is_premium', false)
        .maybeSingle();
      if (!activo) return;
      if (error) console.error('Error cargando el descargable público:', error);
      if (!data) {
        setEstado('no_encontrado');
        return;
      }
      setRecurso(data as RecursoPublico);
      const abierta = !!data.open_until && new Date(data.open_until).getTime() > Date.now();
      setEstado(abierta ? 'abierta' : 'cerrada');
    })();
    return () => {
      activo = false;
    };
  }, [slug]);

  // SEO/compartir: title + meta description propios del recurso. PageMeta (el
  // componente global) no conoce rutas dinámicas y deja esta ruta en noindex
  // por defecto al montar; aquí la sacamos de ahí una vez hay ficha que enseñar.
  useEffect(() => {
    if (!recurso) return;
    const title = `${recurso.title} · descarga gratis | portal farmapro`;
    const description =
      recurso.description?.trim() ||
      'Descargable gratuito de la newsletter Impulso de farmapro, para profesionales de farmacia.';
    document.title = title;
    setMetaTag('meta[name="description"]', { content: description });
    setMetaTag('meta[property="og:title"]', { content: title });
    setMetaTag('meta[property="og:description"]', { content: description });
    setMetaTag('meta[name="twitter:title"]', { content: title });
    setMetaTag('meta[name="twitter:description"]', { content: description });
    document.head.querySelector('meta[name="robots"]')?.remove();
    setMetaTag('link[rel="canonical"]', { href: `${window.location.origin}${window.location.pathname}` });
  }, [recurso]);

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-background">
        <CabeceraPublica />
        <div className="container mx-auto max-w-xl px-4 py-16">
          <div className="animate-pulse space-y-4" role="status" aria-label="Cargando">
            <div className="h-8 w-2/3 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-5/6 rounded bg-muted" />
            <div className="h-10 w-40 rounded-full bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (estado === 'no_encontrado' || !recurso) {
    return (
      <div className="min-h-screen bg-background">
        <CabeceraPublica />
        <div className="container mx-auto max-w-xl px-4 py-16">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">No encontramos este descargable</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            El enlace puede ser de una newsletter antigua o estar mal copiado. Dentro del portal
            farmapro tienes el catálogo completo de recursos para farmacia.
          </p>
          <Button asChild className="mt-8 rounded-full">
            <Link to="/precios">Ir al portal farmapro</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (estado === 'abierta') {
    const limite = recurso.open_until ? formatearFechaLimite(recurso.open_until) : null;
    return (
      <div className="min-h-screen bg-background">
        <CabeceraPublica />
        <div className="container mx-auto max-w-xl px-4 py-16">
          {recurso.newsletter_ref && (
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
              De la newsletter {recurso.newsletter_ref}
            </p>
          )}
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{recurso.title}</h1>
          {recurso.description && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{recurso.description}</p>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span className="uppercase">{recurso.format || 'pdf'}</span>
          </div>

          {limite && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-foreground">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" aria-hidden="true" />
              <p>
                Descarga libre, sin cuenta, hasta el <strong>{limite}</strong>. Después, este
                descargable solo estará disponible dentro del portal.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <a href={recurso.file_url ?? '#'} download rel="noopener">
                <Download className="mr-2 h-4 w-4" />
                Descargar gratis
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to={registerHref('/recursos')}>Crear cuenta y conservarlo</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Con una cuenta gratuita del portal farmapro lo conservas para siempre, sin que cuente
            en tu tope de descargas, y accedes al resto de recursos, cursos y la comunidad.
          </p>

          {/* Contador de descarga anónima: pendiente de v2. Sin usuario no hay
              fila que escribir en resource_downloads (la tabla espera un
              user_id que aquí no existe), así que no se registra nada. */}
        </div>
      </div>
    );
  }

  // estado === 'cerrada': la ventana ya pasó, el fichero solo vive en el portal.
  return (
    <div className="min-h-screen bg-background">
      <CabeceraPublica />
      <div className="container mx-auto max-w-xl px-4 py-16">
        {recurso.newsletter_ref && (
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
            De la newsletter {recurso.newsletter_ref}
          </p>
        )}
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{recurso.title}</h1>
        {recurso.description && (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{recurso.description}</p>
        )}
        <div className="mt-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
          La ventana de descarga libre de este descargable ya se cerró. Sigue disponible, gratis,
          dentro del portal farmapro: solo hace falta una cuenta.
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link to={registerHref(`/recursos?r=${slug ?? ''}`)}>Crear cuenta gratis y descargarlo</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link to="/precios">Ver el portal</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Descarga;
