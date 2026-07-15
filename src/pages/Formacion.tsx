import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormacionHeader } from '@/components/course/FormacionHeader';
import { CategoryTabs } from '@/components/course/CategoryTabs';
import { CourseGrid } from '@/components/course/CourseGrid';
import { CourseSection } from '@/components/course/CourseSection';
import { LoadingSkeleton } from '@/components/course/LoadingSkeleton';

type LevelFilter = 'todos' | 'principiante' | 'intermedio' | 'avanzado';
type AccessFilter = 'todos' | 'gratis' | 'premium';
type SortOption = 'recientes' | 'alfabetico' | 'dificultad';

// Orden de categorías para las secciones cuando se muestra "Todos".
const CATEGORY_ORDER = ['ventas', 'marketing', 'gestion', 'liderazgo', 'atencion', 'atencion_cliente', 'tecnologia', 'otros'];

// Peso de dificultad para ordenar de menor a mayor exigencia.
const DIFFICULTY_WEIGHT: Record<string, number> = {
  principiante: 0,
  basico: 0,
  intermedio: 1,
  avanzado: 2,
};

// Niveles reales del catálogo (campo difficulty).
const matchesLevel = (difficulty: string | undefined, level: LevelFilter) => {
  if (level === 'todos') return true;
  const key = (difficulty || '').toLowerCase();
  if (level === 'principiante') return key === 'principiante' || key === 'basico';
  return key === level;
};

export const Formacion = () => {
  const { courses, enrollments, loading, enrollInCourse, canAccessCourse } = useCourses();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [level, setLevel] = useState<LevelFilter>('todos');
  const [access, setAccess] = useState<AccessFilter>('todos');
  const [sort, setSort] = useState<SortOption>('recientes');

  // Contadores por categoría sobre el catálogo completo (no dependen de filtros).
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const course of courses) {
      counts[course.category] = (counts[course.category] || 0) + 1;
    }
    return counts;
  }, [courses]);

  // Cursos destacados ("Empieza por aquí"): solo se muestran sin filtros activos.
  const featuredCourses = useMemo(
    () => courses.filter((course) => course.is_featured),
    [courses],
  );

  // Filtrado en cliente: búsqueda + categoría + nivel + acceso.
  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((course) => {
      if (selectedCategory !== 'all' && course.category !== selectedCategory) return false;
      if (!matchesLevel(course.difficulty, level)) return false;
      if (access === 'gratis' && course.is_premium) return false;
      if (access === 'premium' && !course.is_premium) return false;
      if (term) {
        const haystack = `${course.title} ${course.description ?? ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [courses, search, selectedCategory, level, access]);

  // Ordenación en cliente.
  const sortedCourses = useMemo(() => {
    const list = [...filteredCourses];
    if (sort === 'alfabetico') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'es'));
    } else if (sort === 'dificultad') {
      list.sort(
        (a, b) =>
          (DIFFICULTY_WEIGHT[(a.difficulty || '').toLowerCase()] ?? 99) -
          (DIFFICULTY_WEIGHT[(b.difficulty || '').toLowerCase()] ?? 99),
      );
    } else {
      list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }
    return list;
  }, [filteredCourses, sort]);

  // Agrupación por categoría para la vista "Todos".
  const coursesByCategory = useMemo(() => {
    const groups: Record<string, typeof sortedCourses> = {};
    for (const course of sortedCourses) {
      if (!groups[course.category]) groups[course.category] = [];
      groups[course.category].push(course);
    }
    return groups;
  }, [sortedCourses]);

  const hasActiveFilters =
    search.trim() !== '' || selectedCategory !== 'all' || level !== 'todos' || access !== 'todos';

  // Mostramos la fila de destacados solo en la vista limpia (sin filtros ni búsqueda),
  // para que no compita con resultados acotados.
  const showFeatured = featuredCourses.length > 0 && !hasActiveFilters;

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setLevel('todos');
    setAccess('todos');
    setSort('recientes');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Cabecera */}
      <motion.div
        className="bg-brand-soft rounded-xl p-8 shadow-lg ring-1 ring-brand/20"
        variants={itemVariants}
      >
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-brand rounded-r-full shadow-lg"></div>
          <div className="ml-6">
            <FormacionHeader />
          </div>
        </div>
      </motion.div>

      {/* Buscador */}
      <motion.div variants={itemVariants}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cursos por título o tema..."
            aria-label="Buscar cursos"
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Categorías con contador */}
      <motion.div variants={itemVariants}>
        <CategoryTabs
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          counts={categoryCounts}
          totalCount={courses.length}
        />
      </motion.div>

      {/* Filtros: nivel, acceso y orden */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="font-medium">Filtros</span>
          </div>

          <Select value={level} onValueChange={(v) => setLevel(v as LevelFilter)}>
            <SelectTrigger className="w-[170px]" aria-label="Filtrar por nivel">
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los niveles</SelectItem>
              <SelectItem value="principiante">Principiante</SelectItem>
              <SelectItem value="intermedio">Intermedio</SelectItem>
              <SelectItem value="avanzado">Avanzado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={access} onValueChange={(v) => setAccess(v as AccessFilter)}>
            <SelectTrigger className="w-[150px]" aria-label="Filtrar por acceso">
              <SelectValue placeholder="Acceso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="gratis">Gratis</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-3">
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-[180px]" aria-label="Ordenar cursos">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recientes">Más recientes</SelectItem>
                <SelectItem value="alfabetico">Alfabético (A-Z)</SelectItem>
                <SelectItem value="dificultad">Por dificultad</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Quitar filtros
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Empieza por aquí (destacados) */}
      {showFeatured && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
              <Sparkles className="h-5 w-5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">Empieza por aquí</h2>
              <p className="text-xs text-muted-foreground">Cursos recomendados para arrancar</p>
            </div>
          </div>
          <CourseGrid
            courses={featuredCourses}
            enrollments={enrollments}
            canAccessCourse={canAccessCourse}
            onEnroll={enrollInCourse}
          />
        </motion.div>
      )}

      {/* Resultados */}
      <motion.div variants={itemVariants}>
        {sortedCourses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-4 text-base font-semibold text-foreground">
              No encontramos cursos con estos filtros
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Prueba con otra categoría o nivel, o quita los filtros para ver todo el catálogo.
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                <X className="h-4 w-4 mr-1" />
                Quitar filtros
              </Button>
            )}
          </div>
        ) : selectedCategory === 'all' ? (
          // Vista "Todos": una sección por categoría con cabecera y sub-rejilla.
          <div className="space-y-10">
            {CATEGORY_ORDER.filter((cat) => coursesByCategory[cat]?.length).map((cat) => (
              <CourseSection
                key={cat}
                category={cat}
                courses={coursesByCategory[cat]}
                enrollments={enrollments}
                canAccessCourse={canAccessCourse}
                onEnroll={enrollInCourse}
              />
            ))}
          </div>
        ) : (
          // Categoría concreta: una sola sección.
          <CourseSection
            category={selectedCategory}
            courses={sortedCourses}
            enrollments={enrollments}
            canAccessCourse={canAccessCourse}
            onEnroll={enrollInCourse}
          />
        )}
      </motion.div>
    </motion.div>
  );
};
