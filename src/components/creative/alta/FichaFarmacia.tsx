import { useRef, useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { TONE_OPTIONS } from '@/lib/iafarmaTonos';
import type { FichaValidada } from '@/hooks/useAltaGuiada';
import type { Fuente } from '@/types/iafarmaPerfil';
import { MuestraCanvas } from './MuestraCanvas';

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_TIPOS = ['image/png', 'image/webp', 'image/svg+xml'];
const MAX_ETIQUETAS = 12;

const ETIQUETA_FUENTE: Record<Fuente, string> = {
  web: 'de tu web',
  instagram: 'de tu Instagram',
  manual: '',
};

const NO_LEIDA: Record<Fuente, string> = {
  web: 'No hemos podido leer tu web',
  instagram: 'No hemos podido leer tu Instagram',
  manual: '',
};

export interface FichaProps {
  ficha: FichaValidada;
  onChange: (f: FichaValidada) => void;
  /** Origen de cada dato: «nombreComercial», «localidad», «tono», «logo» o «servicio:x» / «marca:x». */
  origen: Record<string, Fuente>;
  fuentesFallidas: { fuente: Fuente; motivo: string }[];
  /** Al cambiar el logo, la pantalla recalcula los colores. */
  onLogoCambiado: (url: string | undefined) => void;
}

function DeDonde({ fuente }: { fuente?: Fuente }) {
  if (!fuente || fuente === 'manual') return null;
  return <span className="ml-2 text-xs font-normal text-muted-foreground">{ETIQUETA_FUENTE[fuente]}</span>;
}

function Etiquetas({
  titulo,
  valores,
  prefijo,
  origen,
  onChange,
  placeholder,
}: {
  titulo: string;
  valores: string[];
  prefijo: string;
  origen: Record<string, Fuente>;
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [nuevo, setNuevo] = useState('');
  const anadir = () => {
    const v = nuevo.trim().slice(0, 40);
    if (!v || valores.some((x) => x.toLowerCase() === v.toLowerCase()) || valores.length >= MAX_ETIQUETAS) return;
    onChange([...valores, v]);
    setNuevo('');
  };
  return (
    <div className="space-y-2">
      <Label>{titulo}</Label>
      <div className="flex flex-wrap gap-2">
        {valores.length === 0 && <p className="text-sm text-muted-foreground">Ninguno todavía.</p>}
        {valores.map((v) => {
          const f = origen[`${prefijo}:${v}`];
          return (
            <span
              key={v}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-background px-3 py-1 text-sm ring-1 ring-ciruela/25"
            >
              <span className="truncate">{v}</span>
              {f && f !== 'manual' && <span className="text-xs text-muted-foreground">· {ETIQUETA_FUENTE[f]}</span>}
              <button
                type="button"
                onClick={() => onChange(valores.filter((x) => x !== v))}
                className="-mr-1 rounded-full p-1 text-muted-foreground hover:text-foreground"
                aria-label={`Quitar ${v}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              anadir();
            }
          }}
          placeholder={placeholder}
          maxLength={40}
        />
        <Button type="button" variant="outline" onClick={anadir} disabled={!nuevo.trim()} aria-label={`Añadir a ${titulo}`}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function FichaFarmacia({ ficha, onChange, origen, fuentesFallidas, onLogoCambiado }: FichaProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof FichaValidada>(k: K, v: FichaValidada[K]) => onChange({ ...ficha, [k]: v });

  const subirLogo = (file: File) => {
    if (!LOGO_TIPOS.includes(file.type)) {
      toast({ title: 'Formato no admitido', description: 'Sube el logo en PNG, WebP o SVG.', variant: 'destructive' });
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast({ title: 'Logo demasiado grande', description: 'El máximo es 2 MB.', variant: 'destructive' });
      return;
    }
    const url = URL.createObjectURL(file);
    onChange({ ...ficha, logoFile: file, logoUrl: url, logoPath: undefined });
    onLogoCambiado(url);
  };

  const quitarLogo = () => {
    onChange({ ...ficha, logoFile: undefined, logoUrl: undefined, logoPath: undefined });
    onLogoCambiado(undefined);
  };

  return (
    <div className="space-y-6">
      {fuentesFallidas.length > 0 && (
        <ul className="space-y-1 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {fuentesFallidas.map((f) => (
            <li key={f.fuente}>{NO_LEIDA[f.fuente] || f.motivo}. Revisa estos datos a mano.</li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="min-w-0 space-y-5">
          {/* Logo */}
          <div className="space-y-2">
            <Label>
              Logo <DeDonde fuente={ficha.logoFile ? 'manual' : origen.logo} />
            </Label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background ring-1 ring-black/10">
                {ficha.logoUrl ? (
                  <img src={ficha.logoUrl} alt="Logo de la farmacia" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="px-1 text-center text-xs text-muted-foreground">Sin logo</span>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".png,.webp,.svg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) subirLogo(f);
                  e.target.value = '';
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {ficha.logoUrl ? 'Cambiar' : 'Subir logo'}
              </Button>
              {ficha.logoUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={quitarLogo}>
                  Quitar
                </Button>
              )}
            </div>
            {origen.logo && origen.logo !== 'manual' && !ficha.logoFile && ficha.logoUrl && (
              <p className="text-xs text-muted-foreground">Comprueba que es tu logo y no otra imagen de la página.</p>
            )}
          </div>

          {/* Colores */}
          <div className="grid grid-cols-2 gap-4">
            {(['colorPrimario', 'colorSecundario'] as const).map((k) => (
              <div key={k} className="space-y-2">
                <Label htmlFor={`alta-${k}`}>{k === 'colorPrimario' ? 'Color principal' : 'Color secundario'}</Label>
                <div className="flex items-center gap-2">
                  <input
                    id={`alta-${k}`}
                    type="color"
                    value={ficha[k] || '#ffffff'}
                    onChange={(e) => set(k, e.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded border border-input bg-background p-1"
                  />
                  <span className="truncate font-mono text-xs text-muted-foreground">{ficha[k] || 'sin color'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Nombre comercial y localidad */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="alta-nombre-comercial">
                Nombre en las piezas <DeDonde fuente={origen.nombreComercial} />
              </Label>
              <Input
                id="alta-nombre-comercial"
                value={ficha.nombreComercial}
                onChange={(e) => set('nombreComercial', e.target.value)}
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alta-localidad">
                Localidad <DeDonde fuente={origen.localidad} />
              </Label>
              <Input
                id="alta-localidad"
                value={ficha.localidad}
                onChange={(e) => set('localidad', e.target.value)}
                maxLength={60}
              />
            </div>
          </div>

          {/* Tono */}
          <div className="space-y-2">
            <Label>
              Tono <DeDonde fuente={origen.tono} />
            </Label>
            <Select value={ficha.tono} onValueChange={(v) => set('tono', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Elige el tono" />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Etiquetas
            titulo="Servicios"
            valores={ficha.servicios}
            prefijo="servicio"
            origen={origen}
            onChange={(v) => set('servicios', v)}
            placeholder="Ej.: dermofarmacia, nutrición, SPD"
          />
          <Etiquetas
            titulo="Marcas con las que trabajas"
            valores={ficha.marcas}
            prefijo="marca"
            origen={origen}
            onChange={(v) => set('marcas', v)}
            placeholder="Ej.: La Roche-Posay"
          />
          <p className="text-xs text-muted-foreground">
            Servicios y marcas solo orientan las imágenes: no se escriben en ellas ni salen sus logos.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 md:items-start">
          <MuestraCanvas
            colorPrimario={ficha.colorPrimario}
            colorSecundario={ficha.colorSecundario}
            nombreComercial={ficha.nombreComercial || ficha.nombre}
            logoUrl={ficha.logoUrl}
          />
          <p className="text-xs text-muted-foreground">Vista previa</p>
        </div>
      </div>
    </div>
  );
}
