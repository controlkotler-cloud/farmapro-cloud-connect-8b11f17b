
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
  const eventImages = [
    'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1473091534298-04dcbce3278c?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&auto=format'
  ];

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
          eventImages={eventImages}
        />
      ))}
    </div>
  );
};
