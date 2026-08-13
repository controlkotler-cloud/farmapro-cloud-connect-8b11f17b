import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, MessageSquare, Search } from 'lucide-react';

type Estado = 'enviada' | 'aceptada' | 'rechazada' | 'error_envio';

interface PromotionRequest {
  id: string;
  promotion_id: string | null;
  referencia: string | null;
  nombre: string | null;
  email: string | null;
  farmacia: string | null;
  ciudad: string | null;
  telefono: string | null;
  mensaje: string | null;
  consent_texto_version: string | null;
  consent_at: string | null;
  partner_email: string | null;
  estado: Estado | string;
  created_at: string;
  promotion?: { title: string | null; company_name: string | null } | null;
}

const ESTADO_LABEL: Record<Estado, string> = {
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  error_envio: 'Error de envío',
};

const ESTADO_CLASS: Record<Estado, string> = {
  enviada: 'bg-salvia-soft text-salvia',
  aceptada: 'bg-brand-soft text-brand-dark',
  rechazada: 'bg-muted text-muted-foreground',
  error_envio: 'bg-destructive/10 text-destructive',
};

const ESTADOS: Estado[] = ['enviada', 'aceptada', 'rechazada', 'error_envio'];

const formatFecha = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('es-ES') : '—';

// El separador ';' y el BOM son lo que hace que Excel en español abra el CSV
// con las columnas bien separadas y sin romper las tildes.
const csvCell = (value: string | null | undefined) =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

export const PromotionRequestsList = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState<'todas' | Estado>('todas');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<PromotionRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('promotion_requests')
      .select('*, promotion:promotions(title, company_name)')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      toast({
        title: 'No se han podido cargar las solicitudes',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setRequests((data || []) as unknown as PromotionRequest[]);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter(r => {
      if (estadoFilter !== 'todas' && r.estado !== estadoFilter) return false;
      if (!q) return true;
      return [
        r.referencia,
        r.nombre,
        r.email,
        r.farmacia,
        r.ciudad,
        r.promotion?.title,
      ]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
    });
  }, [requests, estadoFilter, search]);

  const counters = useMemo(
    () => ({
      total: requests.length,
      enviadas: requests.filter(r => r.estado === 'enviada').length,
      aceptadas: requests.filter(r => r.estado === 'aceptada').length,
      errores: requests.filter(r => r.estado === 'error_envio').length,
    }),
    [requests]
  );

  const handleEstadoChange = async (id: string, estado: Estado) => {
    const previous = requests;
    setRequests(prev => prev.map(r => (r.id === id ? { ...r, estado } : r)));

    const { error } = await supabase
      .from('promotion_requests')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setRequests(previous);
      toast({
        title: 'No se ha podido actualizar el estado',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Estado actualizado', description: ESTADO_LABEL[estado] });
  };

  const handleExport = () => {
    const headers = [
      'Referencia',
      'Fecha',
      'Promoción',
      'Empresa',
      'Nombre',
      'Farmacia',
      'Ciudad',
      'Email',
      'Teléfono',
      'Mensaje',
      'Estado',
      'Email del partner',
    ];
    const rows = filtered.map(r =>
      [
        r.referencia,
        formatFecha(r.created_at),
        r.promotion?.title,
        r.promotion?.company_name,
        r.nombre,
        r.farmacia,
        r.ciudad,
        r.email,
        r.telefono,
        r.mensaje,
        ESTADO_LABEL[r.estado as Estado] ?? r.estado,
        r.partner_email,
      ]
        .map(csvCell)
        .join(';')
    );
    const csv = '\uFEFF' + [headers.map(csvCell).join(';'), ...rows].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `solicitudes-promociones-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-32" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-16 text-center">
        <h3 className="text-lg font-bold text-foreground">Aún no hay solicitudes</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Aquí aparecerán las solicitudes que hagan los suscriptores desde la sección
          Promociones del portal. Para que una promoción admita solicitudes tiene que
          tener un correo de partner configurado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
        <span className="text-muted-foreground">
          Total <span className="font-bold text-foreground">{counters.total}</span>
        </span>
        <span className="text-muted-foreground">
          Enviadas <span className="font-bold text-foreground">{counters.enviadas}</span>
        </span>
        <span className="text-muted-foreground">
          Aceptadas <span className="font-bold text-foreground">{counters.aceptadas}</span>
        </span>
        <span className="text-muted-foreground">
          Errores de envío <span className="font-bold text-foreground">{counters.errores}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por referencia, nombre, email, farmacia..."
            className="pl-9"
          />
        </div>
        <Select value={estadoFilter} onValueChange={v => setEstadoFilter(v as 'todas' | Estado)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {ESTADOS.map(e => (
              <SelectItem key={e} value={e}>
                {ESTADO_LABEL[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2 rounded-full" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referencia</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Promoción</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No hay solicitudes que coincidan con el filtro.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.referencia || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatFecha(r.created_at)}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">
                      {r.promotion?.title || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.promotion?.company_name || ''}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">{r.nombre || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {[r.farmacia, r.ciudad].filter(Boolean).join(' · ')}
                    </p>
                  </TableCell>
                  <TableCell>
                    {r.email && (
                      <a
                        href={`mailto:${r.email}`}
                        className="block text-sm text-brand-dark hover:underline"
                      >
                        {r.email}
                      </a>
                    )}
                    {r.telefono && (
                      <a
                        href={`tel:${r.telefono}`}
                        className="block text-xs text-muted-foreground hover:underline"
                      >
                        {r.telefono}
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.estado}
                      onValueChange={v => handleEstadoChange(r.id, v as Estado)}
                    >
                      <SelectTrigger
                        className={`h-8 w-[150px] border-0 text-xs font-medium ${
                          ESTADO_CLASS[r.estado as Estado] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map(e => (
                          <SelectItem key={e} value={e}>
                            {ESTADO_LABEL[e]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.mensaje && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Ver mensaje y consentimiento"
                        onClick={() => setDetail(r)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detail} onOpenChange={open => !open && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitud {detail?.referencia}</DialogTitle>
            <DialogDescription>
              Mensaje del solicitante y evidencia de consentimiento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Mensaje
              </p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">{detail?.mensaje}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Enviada al partner
              </p>
              <p className="mt-1 text-foreground">{detail?.partner_email || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Consentimiento
              </p>
              <p className="mt-1 text-foreground">
                Versión {detail?.consent_texto_version || '—'}
                {detail?.consent_at
                  ? ` · ${new Date(detail.consent_at).toLocaleString('es-ES')}`
                  : ''}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
