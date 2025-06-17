
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, Star, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type CourseCategory = Database['public']['Enums']['course_category'];

interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  duration_minutes: number;
  thumbnail_url: string;
  is_premium: boolean;
  created_at: string;
}

const Formacion = () => {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: Array<{ id: string; name: string }> = [
    { id: 'all', name: 'Todos los Cursos' },
    { id: 'gestion', name: 'Gestión Farmacéutica' },
    { id: 'marketing', name: 'Marketing y Ventas' },
    { id: 'liderazgo', name: 'Liderazgo' },
    { id: 'atencion_cliente', name: 'Atención al Cliente' },
    { id: 'tecnologia', name: 'Tecnología' },
  ];

  useEffect(() => {
    loadCourses();
  }, [selectedCategory]);

  const loadCourses = async () => {
    setLoading(true);
    let query = supabase.from('courses').select('*').order('created_at', { ascending: false });
    
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory as CourseCategory);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading courses:', error);
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const enrollInCourse = async (courseId: string) => {
    if (!profile?.id) return;

    const { error } = await supabase
      .from('course_enrollments')
      .insert([{
        user_id: profile.id,
        course_id: courseId,
        started_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error enrolling in course:', error);
    } else {
      // Add points for starting a course
      await supabase.rpc('add_user_points', {
        user_id: profile.id,
        points: 50
      });
    }
  };

  const canAccessCourse = (course: Course) => {
    if (!course.is_premium) return true;
    return profile?.subscription_role && profile.subscription_role !== 'freemium';
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Formación Continua</h1>
        <p className="text-gray-600">Desarrolla tus competencias profesionales con nuestros cursos especializados</p>
      </div>

      <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
        <TabsList className="grid w-full grid-cols-6">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img 
                        src={course.thumbnail_url || "/placeholder.svg"} 
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      {course.is_premium && (
                        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500">
                          <Star className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
                        </div>
                        <Badge variant="outline">{course.category}</Badge>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => enrollInCourse(course.id)}
                        disabled={!canAccessCourse(course)}
                      >
                        {!canAccessCourse(course) ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Requiere Premium
                          </>
                        ) : (
                          'Comenzar Curso'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Formacion;
