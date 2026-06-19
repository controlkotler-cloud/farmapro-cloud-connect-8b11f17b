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
const EVENT_COVER: Record<string, { gradient: string; Icon: LucideIcon }> = {
  webinar: { gradient: 'from-sky-500 to-blue-600', Icon: Video },
  conferencia: { gradient: 'from-indigo-500 to-violet-600', Icon: Users },
  workshop: { gradient: 'from-emerald-500 to-green-600', Icon: Wrench },
  feria: { gradient: 'from-amber-500 to-orange-600', Icon: ShoppingBag },
  curso: { gradient: 'from-fuchsia-500 to-purple-600', Icon: BookOpen },
};

export const EventCard = ({ event, index }: EventCardProps) => {
  const cover = EVENT_COVER[event.event_type] || { gradient: 'from-slate-500 to-slate-700', Icon: Calendar };

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
    switch (type) {
      case 'webinar': return 'bg-blue-100 text-blue-800';
      case 'conferencia': return 'bg-purple-100 text-purple-800';
      case 'workshop': return 'bg-green-100 text-green-800';
      case 'feria': return 'bg-orange-100 text-orange-800';
      case 'curso': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.1 }}
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 border-gray-200 group">
        <div className="relative h-44 overflow-hidden rounded-t-lg">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${cover.gradient} flex items-center justify-center`}>
              <cover.Icon className="h-14 w-14 text-white/90" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          <div className="absolute top-3 left-3 space-y-2">
            {event.is_featured && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg">
                <Star className="h-3 w-3 mr-1" />
                Destacado
              </Badge>
            )}
            {isToday(event.start_date) && (
              <Badge className="bg-red-600 shadow-lg">Hoy</Badge>
            )}
          </div>
          <Badge className={`absolute top-3 right-3 ${getEventTypeColor(event.event_type)} shadow-lg`}>
            {event.event_type}
          </Badge>
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-orange-600 transition-colors">
            {event.title}
          </CardTitle>
          <CardDescription className="line-clamp-3 text-gray-600">
            {event.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-orange-500" />
              {formatDate(event.start_date)}
              {event.end_date !== event.start_date && (
                <span> - {formatDate(event.end_date)}</span>
              )}
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-orange-500" />
              {formatTime(event.start_date)}
            </div>

            {event.location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                {event.location}
              </div>
            )}

            <Button
              className="w-full mt-4 bg-orange-600 hover:bg-orange-700 shadow-lg"
              onClick={() => window.open(event.registration_url, '_blank')}
              disabled={!event.registration_url}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isUpcoming(event.start_date) ? 'Más información' : 'Ver evento'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
