import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  Star,
  Video,
  Users,
  Wrench,
  ShoppingBag,
  BookOpen,
  Landmark,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string;
  registration_url: string;
  image_url: string;
  is_featured: boolean;
  created_at: string;
}

interface EventCardProps {
  event: Event;
  index: number;
}

// Portada por tipo de evento (color + icono) cuando no hay imagen propia.
// Nada de fotos de stock: coherente con la identidad del portal.
// event_type es texto libre (sin ENUM en BD) — normalizar a minúsculas antes
// de buscar, porque en producción hay valores con mayúscula inicial ("Congreso",
// "Feria", "Jornada") que si no, caen siempre al fallback neutro sin icono.
// Solo hay 5 tokens de marca (brand, miel, terracota, salvia, ciruela) para 7
// tipos de evento: salvia y ciruela se reutilizan una vez cada una.
const EVENT_COVER: Record<string, { bg: string; Icon: LucideIcon }> = {
  webinar: { bg: 'bg-salvia', Icon: Video },
  conferencia: { bg: 'bg-ciruela', Icon: Users },
  congreso: { bg: 'bg-terracota', Icon: Landmark },
  workshop: { bg: 'bg-brand', Icon: Wrench },
  jornada: { bg: 'bg-miel', Icon: GraduationCap },
  feria: { bg: 'bg-salvia', Icon: ShoppingBag },
  curso: { bg: 'bg-ciruela', Icon: BookOpen },
};

export const EventCard = ({ event, index }: EventCardProps) => {
  const [imgError, setImgError] = useState(false);
  const normalizedType = event.event_type?.toLowerCase().trim();
  const cover = EVENT_COVER[normalizedType] || { bg: 'bg-muted', Icon: Calendar };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const isUpcoming = (startDate: string) => new Date(startDate) > new Date();

  const isToday = (startDate: string) => {
    const today = new Date();
    return new Date(startDate).toDateString() === today.toDateString();
  };

  const getEventTypeColor = (type: string) => {
    switch (type?.toLowerCase().trim()) {
      case 'webinar': return 'bg-salvia-soft text-salvia';
      case 'conferencia': return 'bg-ciruela-soft text-ciruela';
      case 'congreso': return 'bg-terracota-soft text-terracota';
      case 'workshop': return 'bg-brand-soft text-brand-dark';
      case 'jornada': return 'bg-miel-soft text-miel';
      case 'feria': return 'bg-salvia-soft text-salvia';
      case 'curso': return 'bg-ciruela-soft text-ciruela';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.1 }}
    >
      <Card className="h-full transition-all hover:shadow-lift group">
        <div className="relative h-44 overflow-hidden rounded-t-lg">
          {event.image_url && !imgError ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`w-full h-full ${cover.bg} flex items-center justify-center`}>
              <cover.Icon className="h-14 w-14 text-primary-foreground/90" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          <div className="absolute top-3 left-3 space-y-2">
            {event.is_featured && (
              <Badge className="rounded-full bg-miel-soft px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-foreground shadow-soft">
                <Star className="h-3 w-3 mr-1 text-miel" />
                Destacado
              </Badge>
            )}
            {isToday(event.start_date) && (
              <Badge className="rounded-full bg-warning px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-warning-foreground shadow-soft">
                Hoy
              </Badge>
            )}
          </div>
          <Badge className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] shadow-soft ${getEventTypeColor(event.event_type)}`}>
            {event.event_type}
          </Badge>
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-terracota transition-colors">
            {event.title}
          </CardTitle>
          <CardDescription className="line-clamp-3 text-muted-foreground">
            {event.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2 text-terracota" />
              {formatDate(event.start_date)}
              {event.end_date !== event.start_date && (
                <span> - {formatDate(event.end_date)}</span>
              )}
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2 text-terracota" />
              {formatTime(event.start_date)}
            </div>

            {event.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2 text-terracota" />
                {event.location}
              </div>
            )}

            <Button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift disabled:pointer-events-none disabled:opacity-50"
              onClick={() => window.open(event.registration_url, '_blank')}
              disabled={!event.registration_url}
            >
              <ExternalLink className="h-4 w-4" />
              {isUpcoming(event.start_date) ? 'Más información' : 'Ver evento'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
