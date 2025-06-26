
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, ExternalLink, Star, Video, Users, Wrench, ShoppingBag, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { EventosHeader } from '@/components/events/EventosHeader';

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

const eventTypes = [
  { id: 'all', name: 'Todos', icon: Calendar, color: 'from-orange-500 to-orange-600' },
  { id: 'webinar', name: 'Webinars', icon: Video, color: 'from-blue-500 to-blue-600' },
  { id: 'conferencia', name: 'Conferencias', icon: Users, color: 'from-purple-500 to-purple-600' },
  { id: 'workshop', name: 'Workshops', icon: Wrench, color: 'from-green-500 to-green-600' },
  { id: 'feria', name: 'Ferias', icon: ShoppingBag, color: 'from-yellow-500 to-yellow-600' },
  { id: 'curso', name: 'Cursos', icon: BookOpen, color: 'from-indigo-500 to-indigo-600' }
];

const Eventos = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  // Array de imágenes para eventos farmacéuticos
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

  useEffect(() => {
    loadEvents();
  }, [selectedType]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('Loading events from database...');
      
      let query = supabase
        .from('events')
        .select('*')
        .gte('end_date', new Date().toISOString())
        .order('is_featured', { ascending: false })
        .order('start_date', { ascending: true });

      if (selectedType !== 'all') {
        query = query.eq('event_type', selectedType);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Error",
          description: `Error al cargar eventos: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Events loaded:', data?.length || 0);
      setEvents(data || []);
    } catch (error: any) {
      console.error('Exception loading events:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar eventos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  const isToday = (startDate: string) => {
    const today = new Date();
    const eventDate = new Date(startDate);
    return eventDate.toDateString() === today.toDateString();
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'webinar':
        return 'bg-blue-100 text-blue-800';
      case 'conferencia':
        return 'bg-purple-100 text-purple-800';
      case 'workshop':
        return 'bg-green-100 text-green-800';
      case 'feria':
        return 'bg-orange-100 text-orange-800';
      case 'curso':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventImage = (index: number) => {
    return eventImages[index % eventImages.length];
  };

  return (
    <div className="space-y-8">
      <EventosHeader />

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        {/* Categorías rediseñadas estilo recursos */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorías</h2>
          <motion.div 
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {eventTypes.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant={selectedType === category.id ? "default" : "outline"}
                  onClick={() => setSelectedType(category.id)}
                  className={`relative group transition-all duration-300 transform hover:scale-105 ${
                    selectedType === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} shadow-lg mr-2 transition-transform group-hover:scale-110`}>
                    <category.icon className="h-4 w-4 text-white" />
                  </div>
                  {category.name}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {loading ? (
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
        ) : events.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-gray-200 group">
                  <div className="relative overflow-hidden">
                    <img 
                      src={event.image_url || getEventImage(index)} 
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getEventImage(index);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-t-lg"></div>
                    <div className="absolute top-3 left-3 space-y-2">
                      {event.is_featured && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg">
                          <Star className="h-3 w-3 mr-1" />
                          Destacado
                        </Badge>
                      )}
                      {isToday(event.start_date) && (
                        <Badge className="bg-red-600 shadow-lg">
                          Hoy
                        </Badge>
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
                        {isUpcoming(event.start_date) ? 'Registrarse' : 'Ver Evento'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Eventos;
