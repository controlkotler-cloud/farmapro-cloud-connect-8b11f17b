
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Clock, Users, ExternalLink, Star } from 'lucide-react';
import { motion } from 'framer-motion';

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

const Eventos = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  const eventTypes = [
    { id: 'all', name: 'Todos los Eventos' },
    { id: 'webinar', name: 'Webinars' },
    { id: 'conferencia', name: 'Conferencias' },
    { id: 'workshop', name: 'Talleres' },
    { id: 'feria', name: 'Ferias' },
    { id: 'curso', name: 'Cursos Presenciales' },
  ];

  useEffect(() => {
    loadEvents();
  }, [selectedType]);

  const loadEvents = async () => {
    setLoading(true);
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
    } else {
      setEvents(data || []);
    }
    setLoading(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
        <p className="text-gray-600">Mantente actualizado con webinars, conferencias y ferias del sector</p>
      </div>

      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList className="grid w-full grid-cols-6">
          {eventTypes.map((type) => (
            <TabsTrigger key={type.id} value={type.id} className="text-xs">
              {type.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedType} className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img 
                        src={event.image_url || "/placeholder.svg"} 
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 left-2 space-y-1">
                        {event.is_featured && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                            <Star className="h-3 w-3 mr-1" />
                            Destacado
                          </Badge>
                        )}
                        {isToday(event.start_date) && (
                          <Badge className="bg-red-600">
                            Hoy
                          </Badge>
                        )}
                      </div>
                      <Badge className={`absolute top-2 right-2 ${getEventTypeColor(event.event_type)}`}>
                        {event.event_type}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <CardDescription>{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(event.start_date)}
                          {event.end_date !== event.start_date && (
                            <span> - {formatDate(event.end_date)}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(event.start_date)}
                        </div>

                        {event.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {event.location}
                          </div>
                        )}

                        <Button 
                          className="w-full mt-4"
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
        </TabsContent>
      </Tabs>

      {events.length === 0 && !loading && (
        <Card className="text-center py-12">
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
      )}
    </div>
  );
};

export default Eventos;
