
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Award, BookOpen, BarChart3, Play, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCourseCover } from '@/lib/courseCover';
import { useEntitlements } from '@/hooks/useEntitlements';
import type { Course, CourseEnrollment } from '@/types/course';

interface CourseCardProps {
  course: Course;
  index: number;
  enrollments: CourseEnrollment[];
  canAccessCourse: (course: Course) => boolean;
  onEnroll: (courseSlug: string) => void;
}

// Nivel real del curso (campo difficulty): etiqueta legible + acento único de marca.
// La dificultad es información semántica: conserva escala (verde → miel → terracota)
const DIFFICULTY_STYLES: Record<string, { label: string; className: string }> = {
  principiante: { label: 'Principiante', className: 'bg-brand-soft text-brand-dark' },
  basico: { label: 'Básico', className: 'bg-brand-soft text-brand-dark' },
  intermedio: { label: 'Intermedio', className: 'bg-miel-soft text-foreground border border-miel/40' },
  avanzado: { label: 'Avanzado', className: 'bg-terracota-soft text-terracota' },
};

const getDifficulty = (difficulty?: string) => {
  const key = (difficulty || '').toLowerCase();
  return (
    DIFFICULTY_STYLES[key] || {
      label: difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : 'Sin nivel',
      className: 'bg-muted text-muted-foreground',
    }
  );
};

export const CourseCard = ({ course, index, enrollments, canAccessCourse, onEnroll }: CourseCardProps) => {
  const navigate = useNavigate();
  const { isLocked } = useEntitlements();
  const [imgError, setImgError] = useState(false);
  const isEnrolled = enrollments.some(enrollment => enrollment.course_id === course.id);
  const isCompleted = enrollments.some(enrollment =>
    enrollment.course_id === course.id && enrollment.completed_at !== null
  );
  const canAccess = canAccessCourse(course);
  // Si no puede acceder por estar bloqueado/limitado (no por ser premium con
  // plan distinto), ofrecemos un CTA hacia Precios en vez de un botón muerto.
  const showPlanCta = !canAccess && (isLocked || !course.is_premium);
  const cover = getCourseCover(course.category);
  const difficulty = getDifficulty(course.difficulty);

  // Nº de lecciones: usa total_lessons real si está; si no, cuenta módulos.
  const moduleCount = course.course_modules?.length || 0;
  const totalLessons = course.total_lessons ?? moduleCount;
  const totalDuration = course.course_modules?.reduce((sum, module) => sum + module.duration, 0) || course.duration_minutes;

  const handleClick = () => {
    if (isEnrolled) {
      navigate(`/curso/${course.slug}`);
    } else if (canAccess) {
      onEnroll(course.slug);
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
      {/* Portada: foto si existe; si no, portada por categoría (color + icono) */}
      <div className={`relative h-28 overflow-hidden rounded-t-lg bg-gradient-to-br ${cover.gradient} flex items-center justify-center`}>
        {(course.featured_image_url || course.thumbnail_url) && !imgError ? (
          <img
            src={course.featured_image_url || course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <>
            <cover.Icon className="h-10 w-10 text-white/90" strokeWidth={1.5} />
            <span className="absolute bottom-2 left-3 text-xs font-semibold uppercase tracking-wide text-white/85">
              {cover.label}
            </span>
          </>
        )}
      </div>

      <CardHeader className="flex-grow">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
          <div className="flex flex-col space-y-1 ml-2">
            {course.is_premium ? (
              <Badge className="bg-primary text-primary-foreground text-xs">
                <Award className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            ) : (
              <Badge className="bg-info/15 text-info text-xs hover:bg-info/15">
                Gratis
              </Badge>
            )}
            {isCompleted && (
              <Badge className="bg-success/15 text-success text-xs">
                <Award className="h-3 w-3 mr-1" />
                Completado
              </Badge>
            )}
          </div>
        </div>
        
        <CardDescription className="line-clamp-3 text-sm leading-relaxed">
          {course.description}
        </CardDescription>

        {/* Estadísticas del curso */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
          </div>
          {totalLessons > 0 && (
            <div className="flex items-center">
              <BookOpen className="h-3 w-3 mr-1" />
              {totalLessons} {totalLessons === 1 ? 'lección' : 'lecciones'}
            </div>
          )}
          <div className="flex items-center">
            <BarChart3 className="h-3 w-3 mr-1" />
            <span className={`rounded-full px-2 py-0.5 font-medium ${difficulty.className}`}>
              {difficulty.label}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Mostrar algunos módulos destacados */}
          {course.course_modules && course.course_modules.length > 0 && (
            <div className="text-xs text-muted-foreground mb-3">
              <p className="font-medium mb-1">Incluye:</p>
              <ul className="space-y-1">
                {course.course_modules.slice(0, 2).map((module) => (
                  <li key={module.id} className="flex items-center">
                    <div className="w-1 h-1 bg-brand rounded-full mr-2" />
                    {module.title}
                  </li>
                ))}
                {course.course_modules.length > 2 && (
                  <li className="text-muted-foreground italic">
                    + {course.course_modules.length - 2} módulos más
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Botón de acción */}
          {!canAccess ? (
            showPlanCta ? (
              <Button
                onClick={() => navigate('/precios')}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Lock className="h-4 w-4 mr-2" />
                Hazte Plus
              </Button>
            ) : (
              <Button disabled className="w-full" variant="outline">
                Requiere suscripción Premium
              </Button>
            )
          ) : isEnrolled ? (
            <Button onClick={handleClick} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              {isCompleted ? 'Revisar Curso' : 'Continuar Curso'}
            </Button>
          ) : (
            <Button onClick={handleClick} className="w-full" variant="outline">
              Comenzar Curso
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
