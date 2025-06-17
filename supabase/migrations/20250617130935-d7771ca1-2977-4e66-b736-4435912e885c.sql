
-- Enable RLS for resources table
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to view resources (since they should be publicly accessible)
CREATE POLICY "Anyone can view resources" ON public.resources
FOR SELECT USING (true);

-- Enable RLS for courses table if not already enabled
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to view courses (since they should be publicly accessible)
CREATE POLICY "Anyone can view courses" ON public.courses
FOR SELECT USING (true);

-- Enable RLS for forum_categories table if not already enabled
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

-- Create policy that allows anyone to view forum categories
CREATE POLICY "Anyone can view forum categories" ON public.forum_categories
FOR SELECT USING (true);
