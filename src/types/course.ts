
import type { Database } from '@/integrations/supabase/types';

export type CourseCategory = Database['public']['Enums']['course_category'];

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  duration_minutes: number;
  thumbnail_url: string;
  is_premium: boolean;
  created_at: string;
}

export interface CourseEnrollment {
  course_id: string;
  completed_at: string | null;
  started_at: string | null;
}

export interface CategoryItem {
  id: string;
  name: string;
}
