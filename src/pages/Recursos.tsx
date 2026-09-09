
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useResources, type Resource } from '@/hooks/useResources';
import { RESOURCE_CATEGORIES } from '@/lib/resourceCategory';
import { RESOURCE_NEEDS } from '@/lib/resourceNeeds';
import { ResourcesHeader } from '@/components/resources/ResourcesHeader';
import { ResourcesNeedsLanding } from '@/components/resources/ResourcesNeedsLanding';
import { ResourcesSearch } from '@/components/resources/ResourcesSearch';
import { ResourcesCategoryTabs } from '@/components/resources/ResourcesCategoryTabs';
import {
  ResourcesFilters,
  type AccessFilter,
  type SortOrder,
} from '@/components/resources/ResourcesFilters';
import { ResourcesCategorySection } from '@/components/resources/ResourcesCategorySection';
import { ResourcesGrid } from '@/components/resources/ResourcesGrid';
import { FreeDownloadsBanner } from '@/components/resources/FreeDownloadsBanner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const Recursos = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { isPaid, isTrial, isLocked, limits } = useEntitlements();
  const { toast } = useToast();
  const { resources, loading } = useResources();

  // IDs de recursos que el usuario YA ha descargado (para no consumir un nuevo
  // hueco del tope gratis al re-descargar lo mismo) y total de descargas.
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  // Premios de la Rebotica (RPC `rebotica_my_rewards`): recursos premium ya
  // desbloqueados por un premio, y si hay un premio "Recurso premium" pendiente
  // de elegir. Un recurso desbloqueado no cuenta contra el tope del plan Gratis.
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [pendingPick, setPendingPick] = useState<{ expiresAt: string | null } | null>(null);
  const [pickTarget, setPickTarget] = useState<Resource | null>(null);
  const downloadCount = useMemo(
    () => Array.from(downloadedIds).filter((id) => !unlockedIds.has(id)).length,
    [downloadedIds, unlockedIds],
  );

  const loadRewards = async (userId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('rebotica_my_rewards');
    if (error) {
      console.error('Error cargando premios de la Rebotica:', error);
      return;
    }
    if (!userId) return;
    const rows = (data ?? []) as Array<{ titulo: string; resource_id: string | null; redeemed_at: string | null; expires_at: string | null }>;
    const unlocked = new Set<string>();
    let pending: { expiresAt: string | null } | null = null;
    const now = Date.now();
    for (const r of rows) {
      if (!r.titulo?.toLowerCase().startsWith('recurso premium')) continue;
      if (r.resource_id) unlocked.add(r.resource_id);
      else if (!r.redeemed_at && (!r.expires_at || new Date(r.expires_at).getTime() > now)) pending = { expiresAt: r.expires_at };
    }
    setUnlockedIds(unlocked);
    setPendingPick(pending);
  };
  // Diálogo de "límite del plan Gratis alcanzado". Antes era un toast que
  // desaparecía solo y no dejaba claro qué hacer (feedback Francesc 08-09-2026).
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('resource_downloads')
        .select('resource_id')
        .eq('user_id', profile.id);
      if (!active) return;
      if (error) {
        console.error('Error cargando descargas del usuario:', error);
        return;
      }
      const ids = (data || []).map(d => d.resource_id).filter(Boolean) as string[];
      setDownloadedIds(new Set(ids));
    })();
    void loadRewards(profile.id);
    return () => {
      active = false;
    };
  }, [profile?.id]);

  // Estado de filtros en cliente.
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('todos');
  const [access, setAccess] = useState<AccessFilter>('todos');
  const [sort, setSort] = useState<SortOrder>('recientes');
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);

  // Elegir una necesidad reemplaza la navegación por categoría/tipo (son dos
  // formas alternativas de entrar al mismo catálogo, no se combinan).
  const handleSelectNeed = (needId: string | null) => {
    setSelectedNeed(needId);
    setSelectedCategory('all');
    setSelectedType('todos');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedType('todos');
    setAccess('todos');
    setSort('recientes');
    setSelectedNeed(null);
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedType !== 'todos' ||
    access !== 'todos' ||
    selectedNeed !== null;

  // Recursos que pasan TODOS los filtros menos la categoría (para poder contar
  // por categoría de forma coherente con el resto de filtros activos).
  const baseFiltered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const need = selectedNeed ? RESOURCE_NEEDS.find(n => n.id === selectedNeed) : undefined;
    return resources.filter(r => {
      if (term) {
        const haystack = `${r.title} ${r.description}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (need && !need.match(r)) return false;
      if (selectedType !== 'todos' && r.type !== selectedType) return false;
      if (access === 'gratis' && r.is_premium) return false;
      if (access === 'premium' && !r.is_premium) return false;
      return true;
    });
  }, [resources, searchTerm, selectedType, access, selectedNeed]);

  // Contadores por categoría (sobre baseFiltered) para las pestañas.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: baseFiltered.length };
    for (const cat of RESOURCE_CATEGORIES) counts[cat] = 0;
    for (const r of baseFiltered) {
      counts[r.category] = (counts[r.category] ?? 0) + 1;
    }
    return counts;
  }, [baseFiltered]);

  // Opciones de chips de tipo: tipos presentes en el catálogo (filtrado por
  // categoría/acceso/búsqueda salvo el propio tipo) con su contador.
  const typeOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const counts: Record<string, number> = {};
    for (const r of resources) {
      if (term) {
        const haystack = `${r.title} ${r.description}`.toLowerCase();
        if (!haystack.includes(term)) continue;
      }
      if (selectedCategory !== 'all' && r.category !== selectedCategory) continue;
      if (access === 'gratis' && r.is_premium) continue;
      if (access === 'premium' && !r.is_premium) continue;
      counts[r.type] = (counts[r.type] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }, [resources, searchTerm, selectedCategory, access]);

  const totalForTypeChips = useMemo(
    () => typeOptions.reduce((acc, t) => acc + t.count, 0),
    [typeOptions],
  );

  // Lista final (aplica también la categoría) y ordenación.
  const filteredResources = useMemo(() => {
    const list = baseFiltered.filter(
      r => selectedCategory === 'all' || r.category === selectedCategory,
    );
    const sorted = [...list];
    if (sort === 'alfabetico') {
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));
    } else {
      sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return sorted;
  }, [baseFiltered, selectedCategory, sort]);

  // Agrupación por categoría para la vista "Todos".
  const groupedByCategory = useMemo(() => {
    if (selectedCategory !== 'all') return [];
    return RESOURCE_CATEGORIES.map(cat => ({
      category: cat as string,
      items: filteredResources.filter(r => r.category === cat),
    })).filter(group => group.items.length > 0);
  }, [filteredResources, selectedCategory]);

  // CTA reutilizable hacia la página de Precios para los toasts de bloqueo.
  const pricingCta = (
    <ToastAction altText="Ver planes" onClick={() => navigate('/precios')}>
      Hazte Plus
    </ToastAction>
  );

  // Descarga premium firmada. El bucket y la ruta se extraen de file_url para
  // soportar tanto el bucket público 'recursos' como el privado 'recursos-premium'
  // (la firma pasa por las políticas de Storage, que incluyen la del premio).
  const openSignedDownload = (resource: Resource, win: Window | null) => {
    const match = resource.file_url.match(/\/storage\/v1\/object\/(?:public\/|sign\/|authenticated\/)?([^/]+)\/(.+)$/);
    const bucket = match?.[1] ?? 'recursos';
    const path = match?.[2] ?? resource.file_url;
    return supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60)
      .then(({ data, error }) => {
        if (error || !data?.signedUrl) {
          win?.close();
          toast({ title: 'Error', description: 'No se pudo generar el enlace de descarga.', variant: 'destructive' });
          return false;
        }
        if (win) win.location.href = data.signedUrl;
        else window.location.href = data.signedUrl;
        return true;
      });
  };

  // Confirmación del premio "Recurso premium": desbloquea en BD (RPC atómica,
  // marca la apertura como canjeada) y descarga en la misma acción.
  const confirmPick = async () => {
    const resource = pickTarget;
    if (!resource || !profile?.id) return;
    setPickTarget(null);
    const win = window.open('', '_blank');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('rebotica_unlock_resource', { p_resource_id: resource.id });
    if (error) {
      win?.close();
      console.error('Error desbloqueando recurso premium:', error);
      toast({
        title: 'No se ha podido desbloquear',
        description: error.message?.includes('pendiente') ? error.message : 'Inténtalo de nuevo en unos segundos.',
        variant: 'destructive',
      });
      void loadRewards(profile.id);
      return;
    }
    setUnlockedIds((prev) => new Set(prev).add(resource.id));
    setPendingPick(null);
    toast({ title: 'Recurso desbloqueado', description: `${resource.title} es tuyo: descárgalo cuando quieras.` });
    const ok = await openSignedDownload(resource, win);
    if (ok) {
      setDownloadedIds((prev) => new Set(prev).add(resource.id));
      supabase
        .from('resource_downloads')
        .insert([{ user_id: profile.id, resource_id: resource.id, downloaded_at: new Date().toISOString() }])
        .then(({ error: e }) => { if (e) console.error('Error registrando descarga:', e); });
    }
  };

  const handleDownload = (resource: Resource) => {
    // Sin fichero asociado: ni descarga, ni registro, ni consumo de cupo.
    if (!resource.file_url?.trim()) {
      toast({
        title: 'Recurso no disponible',
        description: 'Este recurso todavía no está disponible para descargar.',
        variant: 'destructive',
      });
      return;
    }
    // Control de acceso del plan gratis (v1 en cliente).
    // Gratis caducado: nada de descargas.
    if (isLocked) {
      toast({
        title: 'Tu acceso gratuito ha caducado',
        description: 'Hazte Plus para descargar este y todos los recursos.',
        variant: 'destructive',
        action: pricingCta,
      });
      return;
    }

    // Premio de la Rebotica: recurso premium ya desbloqueado → pasa todos los
    // gates (la política de Storage lo firma aunque el plan sea Gratis).
    const unlockedByReward = resource.is_premium && unlockedIds.has(resource.id);

    // Premio "Recurso premium" pendiente de elegir: este clic ES la elección.
    // Se confirma en un diálogo porque es irreversible (un recurso por premio).
    if (resource.is_premium && !isPaid && !unlockedByReward && pendingPick) {
      setPickTarget(resource);
      return;
    }

    // Periodo de prueba: tope de descargas. Re-descargar algo ya descargado no
    // consume hueco; un recurso nuevo sí, y si ya está en el tope se bloquea.
    if (isTrial && !unlockedByReward && !downloadedIds.has(resource.id) && downloadCount >= limits.resources) {
      setLimitDialogOpen(true);
      return;
    }

    // Recurso premium: solo planes de pago / admin (acceso total = isPaid).
    if (resource.is_premium && !isPaid && !unlockedByReward) {
      toast({
        title: 'Recurso Premium',
        description: 'Necesitas el plan Plus para descargar este recurso.',
        variant: 'destructive',
        action: pricingCta,
      });
      return;
    }

    // 1) Lanzar la descarga DENTRO del gesto del clic (sin await antes), o Safari
    //    y los bloqueadores de pop-ups la bloquean.
    if (resource.is_premium) {
      // Premium: la ventana se abre ya en el gesto y se rellena al firmar la URL.
      openSignedDownload(resource, window.open('', '_blank'));
    } else {
      // Recurso abierto: descarga directa del archivo (mismo origen) sin pop-up.
      const a = document.createElement('a');
      a.href = resource.file_url;
      a.download = resource.file_url.split('/').pop() || resource.title;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    // 2) Registrar la descarga y el progreso del reto EN SEGUNDO PLANO (no bloquea).
    if (profile?.id) {
      // Actualizamos el conteo local del tope gratis: solo cuenta como nueva
      // descarga si no se había descargado antes este recurso.
      if (!downloadedIds.has(resource.id)) {
        setDownloadedIds(prev => new Set(prev).add(resource.id));
      }
      supabase
        .from('resource_downloads')
        .insert([{ user_id: profile.id, resource_id: resource.id, downloaded_at: new Date().toISOString() }])
        .then(({ error }) => { if (error) console.error('Error registrando descarga:', error); });
      import('@/utils/challengeUtils')
        .then(({ updateChallengeProgress }) => updateChallengeProgress(profile.id, 'resource_downloaded', 1))
        .catch((e) => console.error('Error progreso reto:', e));
    }

    toast({
      title: 'Descarga iniciada',
      description: `Has descargado ${resource.title}`,
    });
  };

  const showGrouped = !loading && selectedCategory === 'all' && filteredResources.length > 0;

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <ResourcesHeader />

      {pendingPick && (
        <div className="rounded-xl border border-[#A3D338] bg-[#A3D338]/10 px-4 py-3 text-sm">
          <strong>Tienes un premio de la Rebotica pendiente:</strong> elige un recurso Premium y
          pulsa descargar. Es tuyo sin ser Plus.
          {pendingPick.expiresAt && (
            <> Tienes hasta el {new Date(pendingPick.expiresAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}.</>
          )}
        </div>
      )}

      {isTrial && (
        <FreeDownloadsBanner
          used={downloadCount}
          limit={limits.resources}
          onSeePlans={() => navigate('/precios')}
        />
      )}

      <ResourcesNeedsLanding selectedNeed={selectedNeed} onSelectNeed={handleSelectNeed} />

      <ResourcesSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <ResourcesCategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        counts={categoryCounts}
      />

      <ResourcesFilters
        typeOptions={typeOptions}
        totalCount={totalForTypeChips}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        access={access}
        onAccessChange={setAccess}
        sort={sort}
        onSortChange={setSort}
      />

      {showGrouped ? (
        <div className="space-y-10">
          {groupedByCategory.map(group => (
            <ResourcesCategorySection
              key={group.category}
              category={group.category}
              resources={group.items}
              onDownload={handleDownload}
            />
          ))}
        </div>
      ) : (
        <ResourcesGrid
          resources={filteredResources}
          loading={loading}
          searchTerm={searchTerm}
          onDownload={handleDownload}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      )}

      <AlertDialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Has usado tus {limits.resources} descargas del plan Gratis</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  El plan Gratis incluye {limits.resources} recursos. Los que ya has descargado puedes
                  volver a bajarlos cuando quieras.
                </p>
                <p>
                  Con el plan Plus descargas todos los recursos del portal sin límite, y además
                  tienes los cursos Premium e IAFarma sin tope.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir con el plan Gratis</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/precios')}>Ver planes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pickTarget} onOpenChange={(open) => { if (!open) setPickTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Usar tu premio de la Rebotica en este recurso?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Tu premio «Recurso premium desbloqueado» vale para UN recurso, y no se puede cambiar
                  después. Si confirmas, <strong>{pickTarget?.title}</strong> queda desbloqueado para ti
                  para siempre y se descarga ahora mismo.
                </p>
                {pendingPick?.expiresAt && (
                  <p>
                    Si prefieres mirar otros, tienes hasta el{' '}
                    {new Date(pendingPick.expiresAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })} para elegir.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir mirando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPick}>Sí, este es mi recurso</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};
