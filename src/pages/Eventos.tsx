
import { useState } from 'react';
import { EventosHeader } from '@/components/events/EventosHeader';
import { EventCategoryFilter } from '@/components/events/EventCategoryFilter';
import { EventGrid } from '@/components/events/EventGrid';
import { useEvents } from '@/hooks/useEvents';

const Eventos = () => {
  const [selectedType, setSelectedType] = useState('all');
  const { events, loading } = useEvents(selectedType);

  return (
    <div className="space-y-8">
      <EventosHeader />

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <EventCategoryFilter 
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />

        <EventGrid 
          events={events}
          loading={loading}
          selectedType={selectedType}
        />
      </div>
    </div>
  );
};

export default Eventos;
