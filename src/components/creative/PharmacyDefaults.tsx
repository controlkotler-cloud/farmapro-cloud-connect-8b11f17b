import { useRef, useState } from 'react';
import { Check, Store, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { IAFarmaDefaults } from '@/hooks/useIAFarmaDefaults';

const TONE_OPTIONS = ['Cercano y profesional', 'Divertido', 'Serio/científico'];
const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

interface PharmacyDefaultsProps {
  defaults: IAFarmaDefaults;
  onChange: (key: keyof IAFarmaDefaults, value: string) => void;
}

export const PharmacyDefaults = ({ defaults, onChange }: PharmacyDefaultsProps) => {
  const { toast } = useToast();
  const { user, reloadProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sube el logo al bucket público iafarma-logos y lo fija en el perfil.
  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    if (!['image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast({
        title: 'Formato no válido',
        description: 'Sube el logo en PNG (ideal), WebP o SVG, con fondo transparente.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast({ title: 'Logo demasiado grande', description: 'Máximo 2 MB.', variant: 'destructive' });
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.type === 'image/svg+xml' ? 'svg' : file.type === 'image/webp' ? 'webp' : 'png';
      const path = `${user.id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('iafarma-logos')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('iafarma-logos').getPublicUrl(path);
      // Cache-buster: el path es fijo (upsert) y el navegador cachea la URL.
      const url = `${pub.publicUrl}?v=${Date.now()}`;
      onChange('logoUrl', url);
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ iafarma_logo_url: url })
        .eq('id', user.id);
      if (profileError) throw profileError;
      await reloadProfile();
      toast({ title: 'Logo guardado', description: 'Podrás añadirlo a cada imagen que generes.' });
    } catch (err) {
      console.error('Logo upload error:', err);
      toast({
        title: 'No se pudo subir el logo',
        description: err instanceof Error ? err.message : 'Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleLogoRemove = async () => {
    if (!user) return;
    onChange('logoUrl', '');
    await supabase.from('profiles').update({ iafarma_logo_url: null }).eq('id', user.id);
    await reloadProfile();
  };

  // Guarda los datos en el PERFIL (profiles): IAFarma los recuerda en
  // cualquier dispositivo.
  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          pharmacy_name: defaults.farmacia.trim() || null,
          pharmacy_city: defaults.localidad.trim() || null,
          iafarma_tone: defaults.tono || null,
          iafarma_brand_primary: defaults.colorPrimario || null,
          iafarma_brand_secondary: defaults.colorSecundario || null,
        })
        .eq('id', user.id);
      if (error) throw error;
      await reloadProfile();
      toast({
        title: 'Guardado en tu perfil',
        description: 'IAFarma usará estos datos en todos tus dispositivos.',
      });
    } catch (err) {
      console.error('Error saving IAFarma defaults to profile:', err);
      toast({
        title: 'No se pudo guardar',
        description: 'Los datos siguen activos en este navegador. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const hasBrandColors = Boolean(defaults.colorPrimario);

  return (
    <section className="rounded-lg bg-ciruela-soft/60 ring-1 ring-ciruela/20 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Store className="h-4 w-4 text-ciruela" />
        <h2 className="text-sm font-semibold text-foreground">Datos de tu farmacia</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Se rellenan desde tu perfil la primera vez. Edítalos si quieres algo distinto para tus
        piezas; con "Guardar en mi perfil" quedan fijados para todos tus dispositivos.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre de la farmacia</label>
          <Input
            value={defaults.farmacia}
            onChange={e => onChange('farmacia', e.target.value)}
            placeholder="Farmacia..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Localidad</label>
          <Input
            value={defaults.localidad}
            onChange={e => onChange('localidad', e.target.value)}
            placeholder="Ciudad o pueblo..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Tono de comunicación</label>
          <Select value={defaults.tono || ''} onValueChange={v => onChange('tono', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map(o => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {/* Colores corporativos */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Colores de tu marca <span className="font-normal">(opcional)</span>
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="color"
                value={defaults.colorPrimario || '#0a6e4e'}
                onChange={e => onChange('colorPrimario', e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                aria-label="Color principal"
              />
              Principal
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="color"
                value={defaults.colorSecundario || '#f0a24b'}
                onChange={e => onChange('colorSecundario', e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                aria-label="Color secundario"
              />
              Secundario
            </label>
            {hasBrandColors && (
              <button
                type="button"
                onClick={() => { onChange('colorPrimario', ''); onChange('colorSecundario', ''); }}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Quitar
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {hasBrandColors
              ? 'Todas las piezas usarán estos colores como gama principal.'
              : 'Sin fijar: IAFarma varía la paleta en cada pieza según el tema.'}
          </p>
        </div>

        {/* Logo */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Logo de la farmacia <span className="font-normal">(opcional)</span>
          </label>
          <div className="flex items-center gap-3">
            {defaults.logoUrl ? (
              <>
                <span className="inline-flex h-10 items-center rounded border border-border bg-background px-2">
                  <img src={defaults.logoUrl} alt="Logo de la farmacia" className="max-h-8 max-w-[120px] object-contain" />
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={handleLogoRemove} className="text-muted-foreground">
                  <X className="h-3.5 w-3.5 mr-1" /> Quitar
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingLogo}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {uploadingLogo ? 'Subiendo...' : 'Subir logo'}
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleLogoUpload(f);
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            PNG con fondo transparente, mejor en horizontal, mínimo 600 px de ancho (máx. 2 MB).
            Podrás añadirlo a cada imagen que generes.
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="text-ciruela hover:text-ciruela hover:bg-ciruela-soft"
        >
          <Check className="h-3.5 w-3.5 mr-1.5" />
          {saving ? 'Guardando...' : 'Guardar en mi perfil'}
        </Button>
      </div>
    </section>
  );
};
