
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { EventCard } from './EventCard';
import { eventTypes } from './EventCategoryFilter';

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

interface EventGridProps {
  events: Event[];
  loading: boolean;
  selectedType: string;
}

export const EventGrid = ({ events, loading, selectedType }: EventGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="text-center py-12 border-gray-200 shadow-sm">
        <CardContent>
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos disponibles</h3>
          <p className="text-gray-600">
            {selectedType === 'all' 
              ? 'No hay eventos programados en este momento.'
              : `No hay eventos de tipo "${eventTypes.find(t => t.id === selectedType)?.name}" programados.`
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, index) => (
        <EventCard
          key={event.id}
          event={event}
          index={index}
        />
      ))}
    </div>
  );
};
