import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoEmbed } from '@/components/media/VideoEmbed';

/**
 * Vault de la Rebotica · Masterclass 3 (premio del cajón de diciembre 2026).
 *
 * Misma regla que las masterclasses 1 y 2 (VaultMasterclass.tsx y
 * VaultMasterclassProtocolo.tsx): página OCULTA, sin menú ni listado y solo con
 * sesión. El enlace llega por el premio "Masterclass del vault": el botón de
 * /rebotica saca la ruta de la descripción del premio en BD (ver rewardAction
 * en Rebotica.tsx), así que quien ganó la 1 o la 2 la sigue viendo.
 */
const VIDEO_URL = 'https://iframe.mediadelivery.net/embed/748005/bba58cf7-81b3-463f-b45b-84f4c32d8062';

const MENSAJES = [
  { n: '1', nombre: 'El encargo ha llegado', idea: 'Corto y con lo que necesita saber: que ya está y hasta cuándo se lo guardáis.' },
  { n: '2', nombre: 'El recordatorio de recogida', idea: 'Uno, amable y sin reproches. Si no viene, se le llama; no se le persigue por chat.' },
  { n: '3', nombre: '«¿Lo tenéis?»', idea: 'Primero sí o no. Después, si no lo hay, la alternativa o cuándo llega.' },
  { n: '4', nombre: 'El mensaje de temporada', idea: 'Uno por temporada y con algo útil dentro. Nada de bombardeo de ofertas.' },
  { n: '5', nombre: 'El enlace a la reseña', idea: 'Cuando el cliente se va contento, el enlace y una frase. Sin mendigar.' },
];

const PREPARADO = [
  { nombre: 'Respuestas rápidas', idea: 'Las frases que más repetís, escritas una vez con calma y a un toque.' },
  { nombre: 'Perfil con foto real', idea: 'La fachada o el equipo, el horario y la dirección. Que se vea que detrás hay personas.' },
  { nombre: 'Mensaje de ausencia honesto', idea: 'Fuera de horario, di cuándo vas a contestar. Y cúmplelo.' },
  { nombre: 'Solo con permiso', idea: 'Escribes a quien te ha dado su número para eso. Nunca listas ni números comprados.' },
];

export const VaultMasterclassWhatsapp = () => {
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
          El WhatsApp que atiende como tu mostrador
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground" style={{ textWrap: 'pretty' }}>
          Masterclass de Alejandro Tellería, director de estrategia de farmapro. Unos 8 minutos para
          que el WhatsApp de tu farmacia deje de ser un megáfono de ofertas o un contestador frío y
          atienda con el mismo trato que das detrás del mostrador.
        </p>
      </header>

      <VideoEmbed url={VIDEO_URL} title="Ver la masterclass" className="rounded-xl" />

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Antes de darle al play</h2>
        <p className="mt-2 text-muted-foreground" style={{ textWrap: 'pretty' }}>
          Ten abierto el WhatsApp Business de la farmacia, en la parte de respuestas rápidas. Al acabar
          vas a escribir tres frases, y es más fácil hacerlo con la pantalla delante.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Escribe como una persona</h2>
        <p className="mt-2 text-foreground/90" style={{ textWrap: 'pretty' }}>
          El cliente nota enseguida si le contesta un robot o alguien de la farmacia. La regla que sirve
          para casi todo: <strong>dos renglones</strong>. Si un mensaje necesita más, es una llamada o
          una conversación en el mostrador.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Los cinco mensajes de siempre</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-2">
          {MENSAJES.map((m) => (
            <li key={m.n} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-2xl italic text-brand-dark tabular-nums">{m.n}</span>
                <h3 className="text-lg font-semibold text-foreground">{m.nombre}</h3>
              </div>
              <p className="mt-2 text-sm text-foreground/90" style={{ textWrap: 'pretty' }}>{m.idea}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground" style={{ textWrap: 'pretty' }}>
          La línea de fondo: WhatsApp, para logística y cortesía. La salud, en el mostrador.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Déjalo preparado en una tarde</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {PREPARADO.map((p) => (
            <li key={p.nombre} className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold text-foreground">{p.nombre}</h3>
              <p className="mt-2 text-sm text-foreground/90" style={{ textWrap: 'pretty' }}>{p.idea}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground">El sistema que lo sostiene</h2>
        <ul className="mt-4 space-y-2 text-foreground/90">
          <li><strong>Un solo canal.</strong> Un número de la farmacia, no el móvil personal de nadie.</li>
          <li><strong>Una o dos personas al mando.</strong> Saben que es su tarea y en qué horario.</li>
          <li><strong>Contestar en un rato está bien.</strong> No hace falta responder al segundo; hace falta responder siempre.</li>
          <li><strong>Lo de salud, nunca por chat.</strong> «Esto mejor te lo explico en persona.»</li>
          <li><strong>Un par de números para supervisar.</strong> Cuántos encargos entran por WhatsApp a la semana y cuánto tardáis en contestar.</li>
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-brand/20 bg-brand-soft p-6">
        <h2 className="font-serif text-xl font-semibold text-foreground">Tu siguiente paso</h2>
        <p className="mt-2 text-sm text-foreground/90" style={{ textWrap: 'pretty' }}>
          Diez minutos: escribe tres frases en las respuestas rápidas, con calma, naturales y amables.
          Para dejar el resto preparado tienes la «Guía de WhatsApp Business para farmacias» en Recursos.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/recursos">Ir a Recursos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/formacion">Ir a Formación</Link>
          </Button>
        </div>
      </section>

      <p className="mt-10 text-xs text-muted-foreground">
        Este enlace es personal: te ha tocado en un cajón de la Rebotica. Pocas frases, bien escritas y
        con horario: con eso, tu WhatsApp ya atiende.
      </p>
    </div>
  );
};

export default VaultMasterclassWhatsapp;
