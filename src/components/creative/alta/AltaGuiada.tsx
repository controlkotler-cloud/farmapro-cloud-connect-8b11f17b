import { useCallback, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAltaGuiada, type FichaValidada } from '@/hooks/useAltaGuiada';
import { TONE_OPTIONS } from '@/lib/iafarmaTonos';
import { combinarPaleta, paletaDeUrl } from '@/lib/paleta';
import type { Fuente, PropuestaPerfil } from '@/types/iafarmaPerfil';
import { FichaFarmacia } from './FichaFarmacia';

type Paso = 'datos' | 'buscando' | 'ficha';

interface Props {
  inicial?: Partial<FichaValidada>;
  onTerminar: () => void;
}

const SECCION = 'rounded-lg bg-ciruela-soft/60 ring-1 ring-ciruela/20 p-5';

function fichaVacia(inicial: Partial<FichaValidada> | undefined, form: Formulario): FichaValidada {
  return {
    nombre: form.nombre.trim(),
    localidad: form.localidad.trim(),
    nombreComercial: inicial?.nombreComercial || form.nombre.trim(),
    tono: inicial?.tono && TONE_OPTIONS.includes(inicial.tono) ? inicial.tono : TONE_OPTIONS[0],
    colorPrimario: inicial?.colorPrimario,
    colorSecundario: inicial?.colorSecundario,
    logoUrl: inicial?.logoUrl,
    servicios: inicial?.servicios ?? [],
    marcas: inicial?.marcas ?? [],
    web: form.web.trim() || undefined,
    instagram: form.instagram.trim() || undefined,
    fuentes: {},
  };
}

interface Formulario {
  nombre: string;
  localidad: string;
  web: string;
  instagram: string;
}

const dominio = (web: string) => {
  try {
    return new URL(/^https?:\/\//i.test(web) ? web : `https://${web}`).host;
  } catch {
    return web;
  }
};

export function AltaGuiada({ inicial, onTerminar }: Props) {
  const { toast } = useToast();
  const { buscar, guardar } = useAltaGuiada();
  const [paso, setPaso] = useState<Paso>('datos');
  const [form, setForm] = useState<Formulario>({
    nombre: inicial?.nombre ?? '',
    localidad: inicial?.localidad ?? '',
    web: inicial?.web ?? '',
    instagram: inicial?.instagram ?? '',
  });
  const [ficha, setFicha] = useState<FichaValidada | null>(null);
  const [origen, setOrigen] = useState<Record<string, Fuente>>({});
  const [fallidas, setFallidas] = useState<{ fuente: Fuente; motivo: string }[]>([]);
  const [coloresCss, setColoresCss] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const datosOk = form.nombre.trim().length > 0 && form.localidad.trim().length > 0;
  const hayFuente = form.web.trim().length > 0 || form.instagram.trim().length > 0;

  const aFichaManual = (mensaje?: string) => {
    setFicha(fichaVacia(inicial, form));
    setOrigen({});
    setFallidas([]);
    setColoresCss([]);
    setAviso(mensaje ?? null);
    setPaso('ficha');
  };

  const desdePropuesta = async (p: PropuestaPerfil) => {
    const base = fichaVacia(inicial, form);
    const o: Record<string, Fuente> = {};
    if (p.nombreComercial?.valor) o.nombreComercial = p.nombreComercial.fuente;
    if (p.tono?.valor && TONE_OPTIONS.includes(p.tono.valor)) o.tono = p.tono.fuente;
    if (p.logoProvisional) o.logo = p.logoProvisional.fuente;
    const servicios = p.servicios.map((d) => {
      o[`servicio:${d.valor}`] = d.fuente;
      return d.valor;
    });
    const marcas = p.marcas.map((d) => {
      o[`marca:${d.valor}`] = d.fuente;
      return d.valor;
    });
    const logoUrl = p.logoProvisional?.url ?? base.logoUrl;
    const paleta = combinarPaleta(logoUrl ? await paletaDeUrl(logoUrl) : [], p.coloresCss);

    const nueva: FichaValidada = {
      ...base,
      nombreComercial: p.nombreComercial?.valor || base.nombreComercial,
      tono: o.tono ? p.tono!.valor : base.tono,
      logoUrl,
      logoPath: p.logoProvisional?.path,
      colorPrimario: paleta.primario ?? base.colorPrimario,
      colorSecundario: paleta.primario ? paleta.secundario : base.colorSecundario,
      servicios: servicios.length ? servicios : base.servicios,
      marcas: marcas.length ? marcas : base.marcas,
      web: p.web ?? base.web,
      instagram: p.instagram ?? base.instagram,
      fuentes: {
        web: p.web ?? null,
        instagram: p.instagram ?? null,
        fallidas: p.fuentesFallidas,
        origen: o,
        buscado_at: new Date().toISOString(),
      },
    };
    setFicha(nueva);
    setOrigen(o);
    setFallidas(p.fuentesFallidas);
    setColoresCss(p.coloresCss);
    setAviso(null);
    setPaso('ficha');
  };

  const onBuscar = async () => {
    if (!datosOk) return;
    if (!hayFuente) return aFichaManual();
    setPaso('buscando');
    try {
      const r = await buscar({
        nombre: form.nombre.trim(),
        localidad: form.localidad.trim(),
        web: form.web.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
      });
      if (r.estado === 'limite') return aFichaManual(r.mensaje);
      await desdePropuesta(r.propuesta);
    } catch {
      aFichaManual('No hemos podido buscar tus datos ahora. Rellénalos a mano y podrás volver a buscarlos más tarde.');
    }
  };

  const onLogoCambiado = useCallback(
    async (url: string | undefined) => {
      const paleta = combinarPaleta(url ? await paletaDeUrl(url) : [], coloresCss);
      if (!paleta.primario) return;
      setFicha((f) => (f ? { ...f, colorPrimario: paleta.primario, colorSecundario: paleta.secundario } : f));
    },
    [coloresCss],
  );

  const onGuardar = async () => {
    if (!ficha) return;
    const nombre = ficha.nombre || ficha.nombreComercial.trim();
    if (!nombre || !ficha.localidad.trim()) {
      toast({ title: 'Faltan datos', description: 'Pon al menos el nombre y la localidad.', variant: 'destructive' });
      return;
    }
    setGuardando(true);
    try {
      await guardar({ ...ficha, nombre, fuentes: { ...ficha.fuentes, origen } });
      onTerminar();
    } catch {
      toast({ title: 'No se ha podido guardar', description: 'Inténtalo de nuevo en un momento.', variant: 'destructive' });
    } finally {
      setGuardando(false);
    }
  };

  if (paso === 'buscando') {
    return (
      <section className={SECCION} aria-live="polite">
        <h2 className="text-lg font-semibold">Buscando los datos de tu farmacia</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {form.web.trim() && (
            <li className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span className="min-w-0 truncate">Leyendo tu web ({dominio(form.web.trim())})</span>
            </li>
          )}
          {form.instagram.trim() && (
            <li className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span className="min-w-0 truncate">Leyendo tu Instagram</span>
            </li>
          )}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">Tarda unos segundos.</p>
      </section>
    );
  }

  if (paso === 'ficha' && ficha) {
    return (
      <section className={SECCION}>
        <h2 className="text-lg font-semibold">Así es tu farmacia en IAFarma</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisa cada dato. Lo que cambies aquí es lo que usarán todas tus piezas.
        </p>
        {aviso && <p className="mt-3 rounded-md bg-background px-4 py-3 text-sm ring-1 ring-ciruela/20">{aviso}</p>}
        <div className="mt-5">
          <FichaFarmacia
            ficha={ficha}
            onChange={setFicha}
            origen={origen}
            fuentesFallidas={fallidas}
            onLogoCambiado={onLogoCambiado}
          />
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => setPaso('datos')} disabled={guardando}>
            Volver
          </Button>
          <Button type="button" onClick={onGuardar} disabled={guardando}>
            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Está bien así
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className={SECCION}>
      <h2 className="text-lg font-semibold">Antes de crear, conozcamos tu farmacia</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Con tu logo, tus colores y tu forma de hablar, cada pieza saldrá como tuya.
      </p>
      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onBuscar();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="alta-nombre">Nombre de la farmacia</Label>
            <Input
              id="alta-nombre"
              required
              maxLength={80}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alta-localidad-form">Localidad</Label>
            <Input
              id="alta-localidad-form"
              required
              maxLength={60}
              value={form.localidad}
              onChange={(e) => setForm({ ...form, localidad: e.target.value })}
            />
          </div>
        </div>
        <div className="rounded-md bg-background p-4 ring-1 ring-ciruela/25">
          <p className="text-sm font-medium">Con tu web o tu Instagram lo rellenamos por ti</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="alta-web">Web</Label>
              <Input
                id="alta-web"
                inputMode="url"
                placeholder="tufarmacia.es"
                maxLength={200}
                value={form.web}
                onChange={(e) => setForm({ ...form, web: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alta-instagram">Instagram</Label>
              <Input
                id="alta-instagram"
                placeholder="@tufarmacia"
                maxLength={200}
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="text-left text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
            onClick={() => aFichaManual()}
            disabled={!datosOk}
          >
            Prefiero rellenarlo yo
          </button>
          <Button type="submit" disabled={!datosOk}>
            <Search className="mr-2 h-4 w-4" />
            {hayFuente ? 'Buscar mis datos' : 'Continuar'}
          </Button>
        </div>
      </form>
    </section>
  );
}
