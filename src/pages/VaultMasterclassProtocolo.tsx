import { Link } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoEmbed } from '@/components/media/VideoEmbed';

/**
 * Vault de la Rebotica · Masterclass 2 (premio del cajón desde noviembre 2026).
 *
 * Misma regla que la masterclass 1 (VaultMasterclass.tsx): página OCULTA, sin
 * menú ni listado, noindex y solo con sesión. El enlace llega por el premio
 * "Masterclass del vault": el botón de /rebotica saca la ruta de la
 * descripción del premio en BD (ver rewardAction en Rebotica.tsx), así que
 * quien ganó la 1 en septiembre u octubre la sigue viendo.
 */
const VIDEO_URL = 'https://iframe.mediadelivery.net/embed/748005/4663af7e-c338-46d0-8fe9-df44fa455bf8';

const MOMENTOS = [
  { n: '1', nombre: 'Recibir', idea: 'Lenguaje corporal, saludo, sonrisa y la primera pregunta. Es lo que el cliente recuerda al salir.' },
  { n: '2', nombre: 'Recomendar', idea: 'El corazón de la visita. Aquí está casi todo el trabajo y es lo que vas a escribir hoy.' },
  { n: '3', nombre: 'Despedir', idea: 'El otro momento que se recuerda, y el más desaprovechado. Se arregla en una semana.' },
];

const PASOS = [
  { n: '1', nombre: 'Contextualizar', idea: 'Qué se lleva, para quién, desde cuándo. Una conversación profesional y natural, no un interrogatorio.' },
  { n: '2', nombre: 'Pregunta de acompañamiento', idea: '«¿Qué tal te está funcionando lo que te llevas?» Interés por la persona antes que por el producto.' },
  { n: '3', nombre: 'Recomendación con motivo', idea: 'Nunca «llévate esto»: «esto te iría bien porque…». El porqué es lo que te hace honesto.' },
  { n: '4', nombre: 'Salida digna', idea: 'Si no lo quiere, se acabó. No se insiste jamás: una insistencia te cuesta las diez recomendaciones siguientes.' },
];

const ERRORES = [
  'Escribir un tocho. Un protocolo cabe en un folio; si no cabe, es otra cosa.',
  'Imponerlo sin contar por qué. La primera reunión es individual, con cada persona del equipo.',
  'No predicar con el ejemplo. Si tú no lo haces en el mostrador, no se lo puedes pedir a nadie.',
  'Medirlo antes de tiempo. Un protocolo tarda dos o tres meses en notarse.',
];

export const VaultMasterclassProtocolo = () => {
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
          Tu protocolo de mostrador, en una página
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground" style={{ textWrap: 'pretty' }}>
          Masterclass de Alejandro Tellería, director de estrategia de farmapro. Unos 8 minutos para
          salir con el momento más importante de la atención escrito en un folio y un plan para
          entrenarlo con tu equipo.
        </p>
      </header>

      <VideoEmbed url={VIDEO_URL} title="Ver la masterclass" className="rounded-xl" />

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Antes de darle al play</h2>
        <p className="mt-2 text-muted-foreground" style={{ textWrap: 'pretty' }}>
          Ten a mano papel y boli. Al acabar vas a escribir tres cosas de tu farmacia: la categoría con
          la que empiezas, tu frase de acompañamiento y tu salida digna. Un protocolo no le quita
          naturalidad al equipo; le quita el miedo.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Los tres momentos de la atención</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {MOMENTOS.map((m) => (
            <li key={m.n} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-2xl italic text-brand-dark tabular-nums">{m.n}</span>
                <h3 className="text-lg font-semibold text-foreground">{m.nombre}</h3>
              </div>
              <p className="mt-2 text-sm text-foreground/90" style={{ textWrap: 'pretty' }}>{m.idea}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground">La recomendación, en cuatro pasos</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-2">
          {PASOS.map((p) => (
            <li key={p.n} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-2xl italic text-brand-dark tabular-nums">{p.n}</span>
                <h3 className="text-lg font-semibold text-foreground">{p.nombre}</h3>
              </div>
              <p className="mt-2 text-sm text-foreground/90" style={{ textWrap: 'pretty' }}>{p.idea}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground" style={{ textWrap: 'pretty' }}>
          La línea de todo el protocolo: si no le hace falta, no se recomienda. Por eso el cliente vuelve.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Cómo se entrena: 15 minutos a la semana</h2>
        <ul className="mt-4 space-y-2 text-foreground/90">
          <li><strong>Reunión corta, con guion de tres puntos.</strong> Cómo ha ido la semana con el protocolo, un caso de éxito contado por alguien del equipo y el foco de la semana siguiente.</li>
          <li><strong>Roleplay por parejas, dos minutos.</strong> Una persona hace de cliente y otra de farmacéutica o técnico, delante del resto y sin vergüenza.</li>
          <li><strong>Una situación y una categoría por semana.</strong> No todas a la vez. Dermo suele ser buena para empezar.</li>
          <li><strong>Corrige en privado, halaga en público.</strong></li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Los cuatro errores que lo matan</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-foreground/90">
          {ERRORES.map((e) => (
            <li key={e} style={{ textWrap: 'pretty' }}>{e}</li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-xl border border-brand/20 bg-brand-soft p-6">
        <h2 className="font-serif text-xl font-semibold text-foreground">Tu siguiente paso</h2>
        <p className="mt-2 text-sm text-foreground/90" style={{ textWrap: 'pretty' }}>
          Escribe hoy el momento 2 de tu farmacia en una sola página. Para la reunión semanal
          tienes la «Plantilla de guion para reuniones de equipo» en Recursos, y si empiezas por dermo,
          la píldora del corner de dermocosmética en Formación.
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
        Este enlace es personal: te ha tocado en un cajón de la Rebotica. Una página, un porqué y tú el
        primero: con eso, un protocolo ya vive.
      </p>
    </div>
  );
};

export default VaultMasterclassProtocolo;
