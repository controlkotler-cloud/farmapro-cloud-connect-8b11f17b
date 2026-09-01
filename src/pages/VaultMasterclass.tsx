import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveVideoEmbed } from '@/components/course/ModuleVideoSection';

/**
 * Vault de la Rebotica · Masterclass 1.
 *
 * Página OCULTA: no cuelga de ningún menú ni listado, no se indexa (las rutas
 * protegidas van en noindex por defecto en PageMeta) y solo se ve con sesión.
 * El enlace llega en la descripción del premio "Masterclass del vault".
 * El vídeo abre con "esta masterclass no se puede comprar": por eso NO va al
 * catálogo de cursos. Para cambiar el vídeo (p. ej. a Vimeo) basta con
 * cambiar VIDEO_URL.
 */
const VIDEO_URL = 'https://drive.google.com/file/d/1HdmvwksqMWAsyPiu33vQ9BsrMB6_jJlL/view';

const PALANCAS = [
  {
    n: '1',
    nombre: 'Visibilidad',
    idea: 'Que te encuentren antes de necesitarte.',
    etapas: ['Estancada: la ficha de Google impecable.', 'Creciendo: un canal social constante.', 'Madura: autoridad local.'],
  },
  {
    n: '2',
    nombre: 'Conversión',
    idea: 'Convertir cada visita en la mejor decisión para esa persona. Si no le hace falta, no se recomienda.',
    etapas: ['Estancada: un corner experiencial.', 'Creciendo: recomendación cruzada con criterio.', 'Madura: consultas especializadas.'],
  },
  {
    n: '3',
    nombre: 'Captación',
    idea: 'Atraer al que aún no te conoce. Primero el cubo sin agujeros, después el grifo.',
    etapas: ['Estancada: reseñas de clientes.', 'Creciendo: captación digital con llamada física.', 'Madura: alianzas locales.'],
  },
  {
    n: '4',
    nombre: 'Diversificación',
    idea: 'De despachar a acompañar: servicios que sí son de farmacia si se hacen con rigor.',
    etapas: ['Estancada: un servicio sencillo con seguimiento.', 'Creciendo: dos o tres servicios cobrados.', 'Madura: cartera profesionalizada.'],
  },
  {
    n: '5',
    nombre: 'Sistematización',
    idea: 'Que el crecimiento no dependa de la fuerza de voluntad. Un sistema se repite; un golpe de suerte, no.',
    etapas: ['Estancada: cuatro campañas grandes al año.', 'Creciendo: calendario de doce con medición.', 'Madura: automatizar y delegar.'],
  },
];

export const VaultMasterclass = () => {
  const embed = resolveVideoEmbed(VIDEO_URL);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        to="/rebotica"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la Rebotica
      </Link>

      <header className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
          <Lock className="h-3.5 w-3.5" />
          Vault de la Rebotica · solo sale de los cajones
        </div>
        <h1 className="font-serif text-3xl font-semibold leading-tight text-foreground md:text-4xl" style={{ textWrap: 'balance' }}>
          Las 5 palancas de la rentabilidad, aplicadas
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground" style={{ textWrap: 'pretty' }}>
          Masterclass de Alejandro Tellería, director de estrategia de farmapro. Unos 25 minutos para
          salir sabiendo qué palanca activar este trimestre. Una, no cinco.
        </p>
      </header>

      {embed.kind === 'iframe' && (
        <div className="aspect-video overflow-hidden rounded-xl border border-brand/20 bg-black shadow-sm">
          <iframe
            src={embed.src}
            title="Masterclass: Las 5 palancas de la rentabilidad, aplicadas"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
      {embed.kind === 'file' && (
        <div className="aspect-video overflow-hidden rounded-xl border border-brand/20 bg-black shadow-sm">
          <video src={embed.src} controls playsInline preload="metadata" controlsList="nodownload" className="h-full w-full" />
        </div>
      )}
      {embed.kind === 'link' && (
        <div className="rounded-xl border border-brand/20 bg-brand-soft p-8 text-center">
          <Button asChild>
            <a href={embed.src} target="_blank" rel="noopener noreferrer">
              <Play className="mr-2 h-4 w-4" />
              Ver la masterclass
            </a>
          </Button>
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Antes de darle al play</h2>
        <p className="mt-2 text-muted-foreground" style={{ textWrap: 'pretty' }}>
          Ten a mano papel y boli. Durante la masterclass vas a escribir dos cosas: la etiqueta de tu
          farmacia (estancada, creciendo o madura) y la única palanca que vas a activar este trimestre.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Las cinco palancas, en una hoja</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-2">
          {PALANCAS.map((p) => (
            <li key={p.n} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-2xl italic text-brand-dark tabular-nums">{p.n}</span>
                <h3 className="text-lg font-semibold text-foreground">{p.nombre}</h3>
              </div>
              <p className="mt-2 text-sm text-foreground/90" style={{ textWrap: 'pretty' }}>{p.idea}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {p.etapas.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-xl border border-brand/20 bg-brand-soft p-6">
        <h2 className="font-serif text-xl font-semibold text-foreground">Tu siguiente paso</h2>
        <p className="mt-2 text-sm text-foreground/90" style={{ textWrap: 'pretty' }}>
          La píldora de las 5 palancas del portal lleva la plantilla de diagnóstico para poner tu
          etiqueta por escrito y elegir la palanca con datos, no con intuición.
        </p>
        <Button asChild className="mt-4">
          <Link to="/formacion">Ir a Formación</Link>
        </Button>
      </section>

      <p className="mt-10 text-xs text-muted-foreground">
        Este enlace es personal: te ha tocado en un cajón de la Rebotica. Una farmacia no se transforma
        haciendo mil cosas; se transforma haciendo la siguiente cosa correcta.
      </p>
    </div>
  );
};

export default VaultMasterclass;
