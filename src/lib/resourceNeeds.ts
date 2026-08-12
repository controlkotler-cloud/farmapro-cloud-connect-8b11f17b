import { DollarSign, Clock, Smartphone, MapPin, Users, Lightbulb, type LucideIcon } from 'lucide-react';
import type { Resource } from '@/hooks/useResources';

export interface ResourceNeed {
  id: string;
  label: string;
  Icon: LucideIcon;
  match: (resource: Pick<Resource, 'category' | 'type'>) => boolean;
}

// Reagrupa el catálogo real (category/type) por la necesidad del usuario en
// vez de por la taxonomía interna. Basado en el contenido real sembrado hoy —
// un recurso puede encajar en más de una necesidad (solape intencional).
export const RESOURCE_NEEDS: ResourceNeed[] = [
  {
    id: 'vender-mas',
    label: 'Quiero vender más',
    Icon: DollarSign,
    match: (r) => r.category === 'ventas',
  },
  {
    id: 'poco-tiempo',
    label: 'Tengo poco tiempo',
    Icon: Clock,
    match: (r) => r.type === 'checklist' || r.type === 'plantilla',
  },
  {
    id: 'redes',
    label: 'Quiero mejorar las redes de mi farmacia',
    Icon: Smartphone,
    match: (r) => r.category === 'marketing' && r.type !== 'plantilla',
  },
  {
    id: 'google',
    label: 'Quiero que me encuentren en Google',
    Icon: MapPin,
    match: (r) => r.category === 'digital',
  },
  {
    id: 'equipo',
    label: 'Quiero mejorar la gestión de mi equipo',
    Icon: Users,
    match: (r) => r.category === 'liderazgo',
  },
  {
    id: 'que-publicar',
    label: 'No sé qué publicar',
    Icon: Lightbulb,
    match: (r) => r.category === 'marketing' && r.type === 'plantilla',
  },
];
