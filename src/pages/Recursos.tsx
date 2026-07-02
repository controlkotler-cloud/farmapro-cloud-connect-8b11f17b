
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
import { ResourcesHeader } from '@/components/resources/ResourcesHeader';
import { ResourcesSearch } from '@/components/resources/ResourcesSearch';
import { ResourcesCategoryTabs } from '@/components/resources/ResourcesCategoryTabs';
import {
  ResourcesFilters,
  type AccessFilter,
  type SortOrder,
} from '@/components/resources/ResourcesFilters';
import { ResourcesCategorySection } from '@/components/resources/ResourcesCategorySection';
import { ResourcesGrid } from '@/components/resources/ResourcesGrid';

export const Recursos = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { isPaid, isTrial, isLocked, limits } = useEntitlements();
  const { toast } = useToast();
  const { resources, loading } = useResources();

  // IDs de recursos que el usuario YA ha descargado (para no consumir un nuevo
  // hueco del tope gratis al re-descargar lo mismo) y total de descargas.
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [downloadCount, setDownloadCount] = useState(0);

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
      setDownloadCount(ids.length);
      setDownloadedIds(new Set(ids));
    })();
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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedType('todos');
    setAccess('todos');
    setSort('recientes');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedType !== 'todos' ||
    access !== 'todos';

  // Recursos que pasan TODOS los filtros menos la categoría (para poder contar
  // por categoría de forma coherente con el resto de filtros activos).
  const baseFiltered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return resources.filter(r => {
      if (term) {
        const haystack = `${r.title} ${r.description}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (selectedType !== 'todos' && r.type !== selectedType) return false;
      if (access === 'gratis' && r.is_premium) return false;
      if (access === 'premium' && !r.is_premium) return false;
      return true;
    });
  }, [resources, searchTerm, selectedType, access]);

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

  const handleDownload = (resource: Resource) => {
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

    // Periodo de prueba: tope de descargas. Re-descargar algo ya descargado no
    // consume hueco; un recurso nuevo sí, y si ya está en el tope se bloquea.
    if (isTrial && !downloadedIds.has(resource.id) && downloadCount >= limits.resources) {
      toast({
        title: 'Has alcanzado el límite del plan Gratis',
        description: `El plan Gratis incluye ${limits.resources} descargas. Hazte Plus para descargar sin límite.`,
        variant: 'destructive',
        action: pricingCta,
      });
      return;
    }

    // Recurso premium: solo planes de pago / admin (acceso total = isPaid).
    if (resource.is_premium && !isPaid) {
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
      // El bucket y la ruta se extraen de file_url para soportar tanto el bucket
      // público 'recursos' actual como el bucket privado de premium cuando los
      // ficheros premium se muevan allí (la firma pasa por las políticas de Storage).
      const win = window.open('', '_blank');
      const match = resource.file_url.match(/\/storage\/v1\/object\/(?:public\/|sign\/|authenticated\/)?([^/]+)\/(.+)$/);
      const bucket = match?.[1] ?? 'recursos';
      const path = match?.[2] ?? resource.file_url;
      supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60)
        .then(({ data, error }) => {
          if (error || !data?.signedUrl) {
            win?.close();
            toast({ title: 'Error', description: 'No se pudo generar el enlace de descarga.', variant: 'destructive' });
            return;
          }
          if (win) win.location.href = data.signedUrl;
          else window.location.href = data.signedUrl;
        });
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
        setDownloadCount(prev => prev + 1);
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
    </motion.div>
  );
};
