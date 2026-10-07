import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

/**
 * Radiografía de la ficha de Google: informe completo.
 *
 * El análisis lo hace la edge function `analizar-ficha` de farmapro.es (otro
 * proyecto de Supabase, con CORS abierto y sin JWT), por eso se llama con
 * `fetch` y no con `supabase.functions.invoke`. La farmacia llega desde
 * farmapro.es en la query (`cid`, `lat`, `lon`, `title`); sin `cid` se ofrece
 * un buscador mínimo. Cada análisis se guarda en `portal_radiografias` y, si ya
 * hay uno de la misma ficha de los últimos 7 días, se enseña ese en vez de
 * volver a pagar la consulta. "Actualizar" es siempre manual.
 */

const FICHA_URL = 'https://ebuntvgsppedmtmuklyl.supabase.co/functions/v1/analizar-ficha';
const DIAS_VIGENCIA = 7;

type Estado = 'green' | 'amber' | 'red' | 'na';

interface Punto {
  bloque: string;
  key: string;
  label: string;
  peso: number;
  estado: Estado;
  tu: string | number;
  zona: string;
}
interface Bloques {
  resenas: number;
  relevancia: number;
  atractivo: number;
  completitud: number;
}
interface Radiografia {
  score: number;
  titular: string;
  puntos: Punto[];
  bloques: Bloques;
  zona: { medFotos: number; bestFotos: number; medVotes: number; n: number };
}
interface Farmacia {
  title: string;
  address: string;
}
interface Candidate {
  cid: string;
  place_id?: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
}
interface Informe {
  radiografia: Radiografia;
  farmacia: Farmacia | null;
  guardadoEn: string | null;
  cid: string;
}

type Fase = 'cargando' | 'buscador' | 'elegir' | 'informe' | 'error';

const ESTADO_COLOR: Record<Estado, string> = {
  green: 'hsl(var(--success))',
  amber: 'hsl(var(--warning))',
  red: 'hsl(var(--destructive))',
  na: 'hsl(var(--border))',
};
const ESTADO_TEXTO: Record<Estado, string> = {
  green: 'En verde',
  amber: 'En ámbar',
  red: 'En rojo',
  na: 'Sin datos',
};

const scoreColor = (s: number) =>
  s < 45 ? 'hsl(var(--destructive))' : s < 70 ? 'hsl(var(--warning))' : 'hsl(var(--success))';
const scoreVeredicto = (s: number) =>
  s < 45 ? 'Tu ficha juega en tu contra' : s < 70 ? 'Tu ficha se queda a medias' : 'Tu ficha trabaja a tu favor';

const BLOQUE_META: { key: keyof Bloques; label: string }[] = [
  { key: 'resenas', label: 'Reseñas y reputación' },
  { key: 'relevancia', label: 'Relevancia (categorías)' },
  { key: 'atractivo', label: 'Atractivo (fotos, descripción)' },
  { key: 'completitud', label: 'Completitud de la ficha' },
];

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

/** Llama a analizar-ficha. No lanza: devuelve el motivo para pintarlo en pantalla. */
async function llamarFicha(body: Record<string, unknown>) {
  try {
    const res = await fetch(FICHA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: res.ok && !data?.error, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

const mensajeError = (status: number, data: any): string => {
  if (status === 429 || data?.error === 'rate_limit') {
    return 'Hay demasiadas consultas desde tu conexión. Espera unos minutos y vuelve a intentarlo.';
  }
  if (data?.error === 'city_not_found') return 'No encontramos esa ciudad. Prueba con el código postal.';
  if (data?.error === 'not_found') return 'No encontramos esa ficha en Google. Revisa el nombre y la ciudad.';
  return 'No hemos podido analizar la ficha ahora mismo. Inténtalo de nuevo en un momento.';
};

const claveDe = (uid: string, cid: string, lat: string, lon: string, n: number) =>
  `${uid}|${cid}|${lat}|${lon}|${n}`;

/** Activa las transiciones de ancho/arco un frame después de montar. */
function useListo() {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setListo(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return listo;
}

function Gauge({ score, listo }: { score: number; listo: boolean }) {
  const r = 78;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = scoreColor(score);
  return (
    <div className="relative h-44 w-44 shrink-0" role="img" aria-label={`Puntuación ${score} sobre 100`}>
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="12" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={listo ? c * (1 - pct) : c}
          className="motion-reduce:transition-none"
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold leading-none tracking-tight tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          sobre 100
        </span>
      </div>
    </div>
  );
}

function Barra({ valor, max, color, listo }: { valor: number; max: number; color: string; listo: boolean }) {
  const ancho = max > 0 ? Math.min(100, (valor / max) * 100) : 0;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full motion-reduce:transition-none"
        style={{
          width: listo ? `${ancho}%` : '0%',
          backgroundColor: color,
          transition: 'width 1s cubic-bezier(0.22,1,0.36,1)',
        }}
      />
    </div>
  );
}

function Comparativa({
  titulo,
  tu,
  media,
  mejor,
  color,
  listo,
}: {
  titulo: string;
  tu: number;
  media: number;
  mejor?: number;
  color: string;
  listo: boolean;
}) {
  const max = Math.max(tu, media, mejor ?? 0, 1);
  const filas: { nombre: string; valor: number; color: string }[] = [
    { nombre: 'Tu farmacia', valor: tu, color },
    { nombre: 'Media de tu zona', valor: media, color: 'hsl(var(--muted-foreground))' },
  ];
  if (typeof mejor === 'number') {
    filas.push({ nombre: 'La mejor de tu zona', valor: mejor, color: 'hsl(var(--foreground))' });
  }
  return (
    <div>
      <p className="mb-3 text-sm font-bold text-foreground">{titulo}</p>
      <div className="space-y-3">
        {filas.map((f) => (
          <div key={f.nombre}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">{f.nombre}</span>
              <span className="font-bold tabular-nums text-foreground">{f.valor.toLocaleString('es-ES')}</span>
            </div>
            <Barra valor={f.valor} max={max} color={f.color} listo={listo} />
          </div>
        ))}
      </div>
    </div>
  );
}

function InformeCompleto({ informe }: { informe: Informe }) {
  const listo = useListo();
  const { radiografia: r, farmacia } = informe;
  const rojos = r.puntos.filter((p) => p.estado === 'red');
  const resto = r.puntos.filter((p) => p.estado !== 'red');
  const fotos = r.puntos.find((p) => p.key === 'fotos');
  const resenas = r.puntos.find((p) => p.key === 'resenas');

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
          <div className="flex items-center gap-6">
            <Gauge score={r.score} listo={listo} />
            <div>
              {farmacia && (
                <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {farmacia.title}
                </p>
              )}
              <p
                className="mt-2 text-xl font-extrabold leading-tight tracking-tight [text-wrap:balance]"
                style={{ color: scoreColor(r.score) }}
              >
                {scoreVeredicto(r.score)}
              </p>
            </div>
          </div>
          <p className="text-lg font-semibold leading-snug text-foreground [text-wrap:pretty] sm:text-xl">
            {r.titular}
          </p>
        </div>

        <div className="mt-8 grid gap-x-10 gap-y-5 border-t border-border pt-6 sm:grid-cols-2">
          {BLOQUE_META.map(({ key, label }) => {
            const v = r.bloques[key];
            return (
              <div key={key}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(v) }}>
                    {v}
                  </span>
                </div>
                <Barra valor={v} max={100} color={scoreColor(v)} listo={listo} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8">
        <h2 className="text-lg font-extrabold tracking-tight text-foreground">
          Los {r.puntos.length} puntos de tu ficha
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {rojos.length > 0
            ? `${rojos.length} en rojo, primero. Es donde más se nota el cambio.`
            : 'Ninguno en rojo. Revisa los que están en ámbar.'}
        </p>
        <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
          {[...rojos, ...resto].map((p) => (
            <li key={p.key} className="flex items-center gap-3 border-b border-border/70 py-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: ESTADO_COLOR[p.estado] }}
                aria-hidden="true"
              />
              <span className="sr-only">{ESTADO_TEXTO[p.estado]}: </span>
              <span className="flex-1 text-[15px] font-medium text-foreground">{p.label}</span>
              <span className="text-right text-sm">
                <span className="font-bold text-foreground">
                  {p.key === 'categoria' && typeof p.tu === 'string' ? p.tu.replace(/pharmacy/i, 'Farmacia') : p.tu}
                </span>
                {p.zona && <span className="block text-xs text-muted-foreground">{p.zona}</span>}
              </span>
            </li>
          ))}
        </ul>

        {(fotos || resenas) && (
          <div className="mt-10">
            <h2 className="mb-5 text-lg font-extrabold tracking-tight text-foreground">
              Tú, frente a la media de tu zona
            </h2>
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {fotos && (
                <Comparativa
                  titulo="Fotos"
                  tu={Number(fotos.tu) || 0}
                  media={r.zona.medFotos}
                  mejor={r.zona.bestFotos}
                  color={ESTADO_COLOR[fotos.estado]}
                  listo={listo}
                />
              )}
              {resenas && (
                <Comparativa
                  titulo="Reseñas"
                  tu={Number(resenas.tu) || 0}
                  media={r.zona.medVotes}
                  color={ESTADO_COLOR[resenas.estado]}
                  listo={listo}
                />
              )}
            </div>
            {r.zona.n > 0 && (
              <p className="mt-5 text-xs text-muted-foreground">
                Comparado con {r.zona.n} farmacias de tu zona.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default function RadiografiaGoogle() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const cidParam = params.get('cid') ?? '';
  const latParam = params.get('lat') ?? '';
  const lonParam = params.get('lon') ?? '';
  const titleParam = params.get('title') ?? '';

  const [fase, setFase] = useState<Fase>('cargando');
  const [informe, setInforme] = useState<Informe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [candidatos, setCandidatos] = useState<Candidate[]>([]);
  const [nombre, setNombre] = useState(titleParam);
  const [ciudad, setCiudad] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [buscando, setBuscando] = useState(false);
  const formStartRef = useRef<number>(Date.now());
  const claveActiva = useRef<string>('');
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Radiografía de tu Google · farmapro';
    return () => {
      document.title = prev;
    };
  }, []);

  /** Guarda el análisis. Un fallo aquí no tira el informe: ya está en pantalla. */
  const guardar = useCallback(
    async (cid: string, rad: Radiografia, farmacia: Farmacia | null, titulo: string) => {
      if (!user) return null;
      const { data, error: insError } = await supabase
        .from('portal_radiografias')
        .insert({
          user_id: user.id,
          cid,
          title: farmacia?.title ?? titulo ?? null,
          score: Math.round(rad.score),
          payload: { radiografia: rad, farmacia } as unknown as Json,
        })
        .select('created_at')
        .maybeSingle();
      if (insError) {
        console.warn('No se pudo guardar la radiografía', insError.message);
        return null;
      }
      return data?.created_at ?? null;
    },
    [user],
  );

  /** Pide un análisis nuevo a farmapro.es, lo guarda y lo enseña. */
  const analizar = useCallback(
    async (cand: { cid: string; latitude: number | string; longitude: number | string; title: string }) => {
      const { ok, status, data } = await llamarFicha({
        action: 'analizar',
        cid: cand.cid,
        latitude: Number(cand.latitude),
        longitude: Number(cand.longitude),
        title: cand.title,
      });
      if (!ok || !data?.radiografia) {
        return { ok: false as const, mensaje: mensajeError(status, data) };
      }
      const rad = data.radiografia as Radiografia;
      const farmacia = (data.farmacia as Farmacia | undefined) ?? null;
      const guardadoEn = await guardar(cand.cid, rad, farmacia, cand.title);
      setInforme({ radiografia: rad, farmacia, guardadoEn: guardadoEn ?? new Date().toISOString(), cid: cand.cid });
      return { ok: true as const };
    },
    [guardar],
  );

  /** Busca el último análisis guardado de esta ficha, dentro de la vigencia. */
  const buscarGuardado = useCallback(
    async (cid: string): Promise<Informe | null> => {
      if (!user) return null;
      const desde = new Date(Date.now() - DIAS_VIGENCIA * 24 * 60 * 60 * 1000).toISOString();
      const { data, error: selError } = await supabase
        .from('portal_radiografias')
        .select('payload, created_at')
        .eq('user_id', user.id)
        .eq('cid', cid)
        .gte('created_at', desde)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (selError || !data) return null;
      const payload = data.payload as unknown as { radiografia?: Radiografia; farmacia?: Farmacia | null };
      if (!payload?.radiografia?.puntos) return null;
      return {
        radiografia: payload.radiografia,
        farmacia: payload.farmacia ?? null,
        guardadoEn: data.created_at,
        cid,
      };
    },
    [user],
  );

  // Carga inicial según lo que traiga la URL. La clave evita repetir la carga
  // (y volver a pagar el análisis) cuando solo cambia la URL por dentro.
  useEffect(() => {
    if (!user) return;
    const clave = claveDe(user.id, cidParam, latParam, lonParam, reintento);
    if (claveActiva.current === clave) return;
    claveActiva.current = clave;

    if (!cidParam) {
      setFase('buscador');
      return;
    }

    (async () => {
      setFase('cargando');
      setError(null);
      const guardado = await buscarGuardado(cidParam);
      if (claveActiva.current !== clave) return;
      if (guardado) {
        setInforme(guardado);
        setFase('informe');
        return;
      }
      if (!latParam || !lonParam) {
        // Sin coordenadas no se puede analizar: se pasa al buscador.
        setFase('buscador');
        return;
      }
      const res = await analizar({ cid: cidParam, latitude: latParam, longitude: lonParam, title: titleParam });
      if (claveActiva.current !== clave) return;
      if (res.ok) {
        setFase('informe');
      } else {
        setError(res.mensaje);
        setFase('error');
      }
    })();
  }, [user, cidParam, latParam, lonParam, titleParam, reintento, buscarGuardado, analizar]);

  const actualizar = async () => {
    if (!informe || actualizando) return;
    const base = { cid: informe.cid, latitude: latParam, longitude: lonParam, title: informe.farmacia?.title ?? titleParam };
    if (!base.latitude || !base.longitude) {
      setError('Para actualizar hace falta volver a buscar tu farmacia.');
      setFase('buscador');
      return;
    }
    setActualizando(true);
    const res = await analizar(base);
    setActualizando(false);
    if (!res.ok) setError(res.mensaje);
    else setError(null);
  };

  const buscar = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !ciudad.trim()) {
      setError('Pon el nombre de tu farmacia y la ciudad.');
      return;
    }
    setError(null);
    setBuscando(true);
    const { ok, status, data } = await llamarFicha({
      action: 'buscar',
      pharmacyName: nombre,
      city: ciudad,
      website,
      formStartTimestamp: formStartRef.current,
    });
    if (!ok) {
      setBuscando(false);
      setError(mensajeError(status, data));
      return;
    }
    const lista: Candidate[] = data?.candidates ?? [];
    if (lista.length === 0) {
      setBuscando(false);
      setError('No encontramos tu farmacia en Google. Revisa el nombre y la ciudad.');
      return;
    }
    if (lista.length === 1) {
      await elegir(lista[0]);
      setBuscando(false);
      return;
    }
    setCandidatos(lista);
    setFase('elegir');
    setBuscando(false);
  };

  const elegir = async (c: Candidate) => {
    setFase('cargando');
    setError(null);
    const guardado = await buscarGuardado(c.cid);
    if (guardado) {
      setInforme(guardado);
    } else {
      const res = await analizar(c);
      if (!res.ok) {
        setError(res.mensaje);
        setFase('buscador');
        return;
      }
    }
    // Deja la ficha en la URL para que recargar o volver muestre el informe guardado.
    claveActiva.current = claveDe(user?.id ?? '', c.cid, String(c.latitude), String(c.longitude), reintento);
    setParams(
      { cid: c.cid, lat: String(c.latitude), lon: String(c.longitude), title: c.title },
      { replace: true },
    );
    setFase('informe');
  };

  const otraFarmacia = () => {
    setInforme(null);
    setCandidatos([]);
    setError(null);
    claveActiva.current = claveDe(user?.id ?? '', '', '', '', reintento);
    setParams({}, { replace: true });
    setFase('buscador');
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-salvia-soft p-8 shadow-soft">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-salvia text-white">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="inline-flex rounded-full bg-salvia px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-white">
            Radiografía
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
          Radiografía de tu <em className="italic-display">ficha de Google</em>
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Qué ve Google de tu farmacia, punto por punto y frente a tu zona.
        </p>
      </div>

      {/* honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      {fase === 'cargando' && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-6 text-muted-foreground shadow-soft" role="status">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Analizando tu ficha. Son unos segundos.</span>
        </div>
      )}

      {fase === 'error' && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-soft">
          <p className="text-foreground" role="alert">
            {error}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setReintento((n) => n + 1)}>
              Reintentar
            </Button>
            <Button variant="ghost" onClick={otraFarmacia}>
              Buscar otra farmacia
            </Button>
          </div>
        </div>
      )}

      {fase === 'buscador' && (
        <form onSubmit={buscar} className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-foreground">Busca tu farmacia</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Escribe el nombre como aparece en Google y la ciudad. El informe se guarda en tu cuenta.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Tu farmacia
              </span>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Farmacia García"
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Ciudad
              </span>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Zaragoza"
                autoComplete="off"
              />
            </label>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={buscando}>
            {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Analizar mi ficha
          </Button>
        </form>
      )}

      {fase === 'elegir' && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">¿Cuál es la tuya?</h2>
          <div className="grid gap-3">
            {candidatos.map((c) => (
              <button
                key={c.cid}
                type="button"
                onClick={() => elegir(c)}
                className="rounded-md border border-border p-4 text-left transition hover:border-brand hover:bg-accent"
              >
                <span className="block font-semibold text-foreground">{c.title}</span>
                <span className="block text-sm text-muted-foreground">{c.address}</span>
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={otraFarmacia}>
            Volver a buscar
          </Button>
        </div>
      )}

      {fase === 'informe' && informe && (
        <>
          <InformeCompleto key={`${informe.cid}|${informe.guardadoEn}`} informe={informe} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {informe.guardadoEn
                ? `Análisis del ${fechaCorta(informe.guardadoEn)}, guardado en tu cuenta.`
                : 'Análisis guardado en tu cuenta.'}{' '}
              Actualizarlo vuelve a consultar Google.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={actualizar} disabled={actualizando}>
                {actualizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Actualizar
              </Button>
              <Button variant="ghost" onClick={otraFarmacia}>
                Analizar otra farmacia
              </Button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
