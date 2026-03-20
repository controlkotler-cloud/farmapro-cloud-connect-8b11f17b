import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ContentType } from '@/hooks/useCreativeChat';
import { useAuth } from '@/hooks/useAuth';
import { QuickTemplates } from './QuickTemplates';

interface ContentFormProps {
  contentType: ContentType;
  isLoading: boolean;
  onSubmit: (message: string) => void;
}

export const ContentForm = ({ contentType, isLoading, onSubmit }: ContentFormProps) => {
  const { profile } = useAuth();
  const [pharmacyName, setPharmacyName] = useState('');
  const [city, setCity] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState('');

  useEffect(() => {
    if (profile?.pharmacy_name) setPharmacyName(profile.pharmacy_name);
    if (profile?.pharmacy_city) setCity(profile.pharmacy_city);
  }, [profile]);

  useEffect(() => {
    setFields({});
    setExtra('');
  }, [contentType]);

  const setField = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickTemplate = (template: string) => {
    const mainField = getMainFieldKey();
    if (mainField) {
      setField(mainField, template);
    }
  };

  const getMainFieldKey = (): string | null => {
    switch (contentType) {
      case 'instagram-post': return 'tema';
      case 'reel-script': return 'tema';
      case 'carousel': return 'tema';
      case 'google-business': return 'mensaje';
      case 'blog': return 'titulo';
      case 'promotion': return 'producto';
      case 'whatsapp': return 'mensaje';
      default: return null;
    }
  };

  const buildMessage = (): string => {
    const parts: string[] = [];
    parts.push(`Tipo de contenido: ${contentType}`);
    if (pharmacyName) parts.push(`Farmacia: ${pharmacyName}`);
    if (city) parts.push(`Población: ${city}`);

    Object.entries(fields).forEach(([key, value]) => {
      if (value) parts.push(`${key}: ${value}`);
    });

    if (extra) parts.push(`Instrucciones adicionales: ${extra}`);
    return parts.join('\n');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = buildMessage();
    if (msg.trim()) onSubmit(msg);
  };

  const canSubmit = () => {
    const mainKey = getMainFieldKey();
    return mainKey ? !!fields[mainKey]?.trim() : true;
  };

  const renderTypeFields = () => {
    switch (contentType) {
      case 'instagram-post':
        return (
          <>
            <Field label="Tema o producto *" value={fields.tema} onChange={v => setField('tema', v)} placeholder="ej: Protección solar, nuevo sérum de niacinamida..." />
            <SelectField label="Objetivo del post" value={fields.objetivo} onChange={v => setField('objetivo', v)} options={['Educar', 'Promocionar servicio', 'Mostrar equipo', 'Engagement']} />
            <SelectField label="Tono" value={fields.tono} onChange={v => setField('tono', v)} options={['Cercano y profesional', 'Divertido', 'Serio/científico']} />
          </>
        );
      case 'reel-script':
        return (
          <>
            <Field label="Tema del reel *" value={fields.tema} onChange={v => setField('tema', v)} placeholder="ej: Mitos sobre protección solar" />
            <SelectField label="Duración deseada" value={fields.duracion} onChange={v => setField('duracion', v)} options={['15-30 segundos', '30-60 segundos', '60-90 segundos']} />
            <SelectField label="¿Quién sale?" value={fields.quien} onChange={v => setField('quien', v)} options={['Farmacéutico/a', 'Solo texto/producto', 'Equipo']} />
          </>
        );
      case 'carousel':
        return (
          <>
            <Field label="Tema del carrusel *" value={fields.tema} onChange={v => setField('tema', v)} placeholder="ej: Rutina de cuidado facial" />
            <SelectField label="Número de slides" value={fields.slides} onChange={v => setField('slides', v)} options={['4', '5', '6', '8', '10']} />
            <SelectField label="Estilo" value={fields.estilo} onChange={v => setField('estilo', v)} options={['Educativo', 'Antes/Después', 'Listado', 'Paso a paso']} />
          </>
        );
      case 'google-business':
        return (
          <>
            <SelectField label="Tipo de post" value={fields.tipo} onChange={v => setField('tipo', v)} options={['Novedad', 'Oferta', 'Evento', 'Actualización']} />
            <Field label="Mensaje principal *" value={fields.mensaje} onChange={v => setField('mensaje', v)} placeholder="ej: Nuevo servicio de análisis dérmico" />
          </>
        );
      case 'blog':
        return (
          <>
            <Field label="Título o tema *" value={fields.titulo} onChange={v => setField('titulo', v)} placeholder="ej: Guía completa de protección solar" />
            <Field label="Palabras clave SEO" value={fields.keywords} onChange={v => setField('keywords', v)} placeholder="ej: farmacia Tarragona, protección solar" />
            <SelectField label="Longitud" value={fields.longitud} onChange={v => setField('longitud', v)} options={['Corto (~400 palabras)', 'Medio (~800 palabras)', 'Largo (~1200 palabras)']} />
          </>
        );
      case 'promotion':
        return (
          <>
            <Field label="Producto o servicio *" value={fields.producto} onChange={v => setField('producto', v)} placeholder="ej: Línea solar Avène" />
            <Field label="Descuento o beneficio" value={fields.descuento} onChange={v => setField('descuento', v)} placeholder="ej: 20% dto, regalo con compra, consulta gratis" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <Input type="date" value={fields.fecha || ''} onChange={e => setField('fecha', e.target.value)} />
            </div>
            <SelectField label="Canal" value={fields.canal} onChange={v => setField('canal', v)} options={['Instagram', 'WhatsApp', 'Escaparate', 'Todos']} />
          </>
        );
      case 'whatsapp':
        return (
          <>
            <SelectField label="Tipo de mensaje" value={fields.tipo} onChange={v => setField('tipo', v)} options={['Recordatorio cita', 'Novedad/producto', 'Promoción', 'Información general']} />
            <Field label="Mensaje principal *" value={fields.mensaje} onChange={v => setField('mensaje', v)} placeholder="ej: Recordatorio de recogida de medicación" />
          </>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <QuickTemplates contentType={contentType} onSelect={handleQuickTemplate} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de tu farmacia</label>
          <Input value={pharmacyName} onChange={e => setPharmacyName(e.target.value)} placeholder="Farmacia..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Población</label>
          <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Ciudad o pueblo..." />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderTypeFields()}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones adicionales (opcional)</label>
        <Textarea
          value={extra}
          onChange={e => setExtra(e.target.value)}
          placeholder="Añade cualquier detalle extra: público objetivo, productos específicos, contexto..."
          className="min-h-[80px] resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || !canSubmit()}
        className="w-full bg-green-500 hover:bg-green-600 text-white"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Generando...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Generar contenido
          </>
        )}
      </Button>
    </form>
  );
};

// Reusable field components
const Field = ({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (v: string) => void; placeholder: string }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <Input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const SelectField = ({ label, value, onChange, options }: { label: string; value?: string; onChange: (v: string) => void; options: string[] }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar..." />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
