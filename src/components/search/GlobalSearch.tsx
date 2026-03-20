
import { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, FileText, MessageSquare, Loader2, Gift, Calendar, Briefcase, Building, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

interface SearchResult {
  id: string;
  title: string;
  type: 'course' | 'resource' | 'thread' | 'promotion' | 'event' | 'job' | 'pharmacy' | 'challenge';
  description?: string;
  category?: string;
  slug?: string;
}

export const GlobalSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const { isEmpleoVisible, isFarmaciasVisible } = useSectionVisibility();

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Realizar búsqueda cuando cambia el query
  useEffect(() => {
    const searchWithDelay = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchWithDelay);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Buscar en cursos (incluir slug para navegación directa)
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, description, category, slug')
        .or(`title.ilike.%${query}%, description.ilike.%${query}%`)
        .limit(3);

      if (courses) {
        searchResults.push(...courses.map(course => ({
          id: course.id,
          title: course.title,
          type: 'course' as const,
          description: course.description,
          category: course.category,
          slug: course.slug
        })));
      }

      // Buscar en recursos
      const { data: resources } = await supabase
        .from('resources')
        .select('id, title, description, category')
        .or(`title.ilike.%${query}%, description.ilike.%${query}%`)
        .limit(3);

      if (resources) {
        searchResults.push(...resources.map(resource => ({
          id: resource.id,
          title: resource.title,
          type: 'resource' as const,
          description: resource.description,
          category: resource.category
        })));
      }

      // Buscar en foros
      const { data: threads } = await supabase
        .from('forum_threads')
        .select('id, title, content')
        .or(`title.ilike.%${query}%, content.ilike.%${query}%`)
        .limit(3);

      if (threads) {
        searchResults.push(...threads.map(thread => ({
          id: thread.id,
          title: thread.title,
          type: 'thread' as const,
          description: stripMarkdown(thread.content?.substring(0, 100) || '') + '...'
        })));
      }

      // Buscar en promociones
      const { data: promotions } = await supabase
        .from('promotions')
        .select('id, title, description, company_name')
        .eq('is_active', true)
        .or(`title.ilike.%${query}%, description.ilike.%${query}%, company_name.ilike.%${query}%`)
        .limit(3);

      if (promotions) {
        searchResults.push(...promotions.map(promotion => ({
          id: promotion.id,
          title: promotion.title,
          type: 'promotion' as const,
          description: promotion.description,
          category: promotion.company_name
        })));
      }

      // Buscar en eventos
      const { data: events } = await supabase
        .from('events')
        .select('id, title, description, location')
        .gte('end_date', new Date().toISOString())
        .or(`title.ilike.%${query}%, description.ilike.%${query}%, location.ilike.%${query}%`)
        .limit(3);

      if (events) {
        searchResults.push(...events.map(event => ({
          id: event.id,
          title: event.title,
          type: 'event' as const,
          description: event.description,
          category: event.location
        })));
      }

      // Buscar en empleos (solo si está visible)
      if (isEmpleoVisible()) {
        const { data: jobs } = await supabase
          .from('job_listings_public')
          .select('id, title, description, company_name')
          .eq('is_active', true)
          .or(`title.ilike.%${query}%, description.ilike.%${query}%, company_name.ilike.%${query}%`)
          .limit(3);

        if (jobs) {
          searchResults.push(...jobs.map(job => ({
            id: job.id,
            title: job.title,
            type: 'job' as const,
            description: job.description,
            category: job.company_name
          })));
        }
      }

      // Buscar en farmacias (solo si está visible)
      if (isFarmaciasVisible()) {
        const { data: pharmacies } = await supabase
          .from('pharmacy_listings_public')
          .select('id, title, description, location')
          .eq('is_active', true)
          .or(`title.ilike.%${query}%, description.ilike.%${query}%, location.ilike.%${query}%`)
          .limit(3);

        if (pharmacies) {
          searchResults.push(...pharmacies.map(pharmacy => ({
            id: pharmacy.id,
            title: pharmacy.title,
            type: 'pharmacy' as const,
            description: pharmacy.description,
            category: pharmacy.location
          })));
        }
      }

      // Buscar en retos
      const { data: challenges } = await supabase
        .from('challenges')
        .select('id, name, description')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
        .limit(3);

      if (challenges) {
        searchResults.push(...challenges.map(challenge => ({
          id: challenge.id,
          title: challenge.name,
          type: 'challenge' as const,
          description: challenge.description
        })));
      }

      setResults(searchResults);
      setShowResults(searchResults.length > 0);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery('');
    
    switch (result.type) {
      case 'course':
        if (result.slug) {
          navigate(`/curso/${result.slug}`);
        } else {
          navigate('/formacion');
        }
        break;
      case 'resource':
        navigate('/recursos');
        break;
      case 'thread':
        navigate('/comunidad');
        break;
      case 'promotion':
        navigate('/promociones');
        break;
      case 'event':
        navigate('/eventos');
        break;
      case 'job':
        navigate('/empleo');
        break;
      case 'pharmacy':
        navigate('/farmacias');
        break;
      case 'challenge':
        navigate('/retos');
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'resource':
        return <FileText className="h-4 w-4" />;
      case 'thread':
        return <MessageSquare className="h-4 w-4" />;
      case 'promotion':
        return <Gift className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'job':
        return <Briefcase className="h-4 w-4" />;
      case 'pharmacy':
        return <Building className="h-4 w-4" />;
      case 'challenge':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'course':
        return 'Formación';
      case 'resource':
        return 'Recurso';
      case 'thread':
        return 'Comunidad';
      case 'promotion':
        return 'Promoción';
      case 'event':
        return 'Evento';
      case 'job':
        return 'Empleo';
      case 'pharmacy':
        return 'Farmacia';
      case 'challenge':
        return 'Reto';
      default:
        return '';
    }
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-xl mx-0 md:mx-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar en farmapro..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="pl-10 pr-4 py-2 w-full"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <Command>
            <CommandList className="max-h-80">
              {results.length === 0 ? (
                <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              ) : (
                <>
                  {/* Agrupar por tipo */}
                  {results.filter(r => r.type === 'course').length > 0 && (
                    <CommandGroup heading="Formación">
                      {results.filter(r => r.type === 'course').map((result) => (
                        <CommandItem
                          key={`course-${result.id}`}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-start gap-3 p-3 cursor-pointer"
                        >
                          {getIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{result.title}</div>
                            {result.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {result.description}
                              </div>
                            )}
                            <div className="text-xs text-blue-600 mt-1">
                              {getTypeLabel(result.type)}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.filter(r => r.type === 'resource').length > 0 && (
                    <CommandGroup heading="Recursos">
                      {results.filter(r => r.type === 'resource').map((result) => (
                        <CommandItem
                          key={`resource-${result.id}`}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-start gap-3 p-3 cursor-pointer"
                        >
                          {getIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{result.title}</div>
                            {result.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {result.description}
                              </div>
                            )}
                            <div className="text-xs text-green-600 mt-1">
                              {getTypeLabel(result.type)}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.filter(r => r.type === 'thread').length > 0 && (
                    <CommandGroup heading="Comunidad">
                      {results.filter(r => r.type === 'thread').map((result) => (
                        <CommandItem
                          key={`thread-${result.id}`}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-start gap-3 p-3 cursor-pointer"
                        >
                          {getIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{result.title}</div>
                            {result.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {result.description}
                              </div>
                            )}
                            <div className="text-xs text-purple-600 mt-1">
                              {getTypeLabel(result.type)}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.filter(r => r.type === 'promotion').length > 0 && (
                    <CommandGroup heading="Promociones">
                      {results.filter(r => r.type === 'promotion').map((result) => (
                        <CommandItem
                          key={`promotion-${result.id}`}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-start gap-3 p-3 cursor-pointer"
                        >
                          {getIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{result.title}</div>
                            {result.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {result.description}
                              </div>
                            )}
                            <div className="text-xs text-orange-600 mt-1">
                              {getTypeLabel(result.type)}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.filter(r => r.type === 'event').length > 0 && (
                    <CommandGroup heading="Eventos">
                      {results.filter(r => r.type === 'event').map((result) => (
                        <CommandItem
                          key={`event-${result.id}`}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-start gap-3 p-3 cursor-pointer"
                        >
                          {getIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{result.title}</div>
                            {result.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {result.description}
                              </div>
                            )}
                            <div className="text-xs text-teal-600 mt-1">
                              {getTypeLabel(result.type)}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.filter(r => r.type === 'job').length > 0 && (
                    <CommandGroup heading="Empleo">
                      {results.filter(r => r.type === 'job').map((result) => (
                        <CommandItem
                          key={`job-${result.id}`}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-start gap-3 p-3 cursor-pointer"
                        >
                          {getIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{result.title}</div>
                            {result.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {result.description}
                              </div>
                            )}
                            <div className="text-xs text-indigo-600 mt-1">
                              {getTypeLabel(result.type)}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.filter(r => r.type === 'pharmacy').length > 0 && (
                    <CommandGroup heading="Farmacias">
                      {results.filter(r => r.type === 'pharmacy').map((result) => (
                        <CommandItem
                          key={`pharmacy-${result.id}`}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-start gap-3 p-3 cursor-pointer"
                        >
                          {getIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{result.title}</div>
                            {result.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {result.description}
                              </div>
                            )}
                            <div className="text-xs text-pink-600 mt-1">
                              {getTypeLabel(result.type)}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {results.filter(r => r.type === 'challenge').length > 0 && (
                    <CommandGroup heading="Retos">
                      {results.filter(r => r.type === 'challenge').map((result) => (
                        <CommandItem
                          key={`challenge-${result.id}`}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-start gap-3 p-3 cursor-pointer"
                        >
                          {getIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{result.title}</div>
                            {result.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {result.description}
                              </div>
                            )}
                            <div className="text-xs text-yellow-600 mt-1">
                              {getTypeLabel(result.type)}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};
