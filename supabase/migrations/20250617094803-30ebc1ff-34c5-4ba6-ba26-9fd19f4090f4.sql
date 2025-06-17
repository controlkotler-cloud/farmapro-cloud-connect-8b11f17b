
-- Create enum types for better data integrity
CREATE TYPE user_role AS ENUM ('freemium', 'estudiante', 'profesional', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired', 'trialing');
CREATE TYPE course_category AS ENUM ('gestion', 'marketing', 'liderazgo', 'atencion_cliente', 'tecnologia');
CREATE TYPE resource_category AS ENUM ('atencion', 'marketing', 'gestion', 'liderazgo', 'finanzas', 'digital');
CREATE TYPE resource_type AS ENUM ('protocolo', 'calculadora', 'plantilla', 'guia', 'checklist', 'manual', 'herramienta');
CREATE TYPE resource_format AS ENUM ('pdf', 'docs', 'url', 'xls', 'video');
CREATE TYPE challenge_type AS ENUM ('course_started', 'course_completed', 'resource_downloaded', 'forum_post', 'forum_reply');

-- Users profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  pharmacy_name TEXT,
  position TEXT,
  student_verification_status TEXT DEFAULT 'pending',
  student_document_url TEXT,
  subscription_role user_role DEFAULT 'freemium',
  subscription_status subscription_status DEFAULT 'trialing',
  stripe_customer_id TEXT,
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan_name TEXT NOT NULL,
  status subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category course_category NOT NULL,
  content TEXT,
  duration_minutes INTEGER,
  is_premium BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User course enrollments
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- Resources table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category resource_category NOT NULL,
  type resource_type NOT NULL,
  format resource_format NOT NULL,
  file_url TEXT,
  download_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User resource downloads
CREATE TABLE resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- Forum categories
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum threads
CREATE TABLE forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT false,
  replies_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum replies
CREATE TABLE forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES forum_replies(id),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum reply likes
CREATE TABLE forum_reply_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reply_id)
);

-- User points and gamification
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenges
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type challenge_type NOT NULL,
  points_reward INTEGER NOT NULL,
  target_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User challenge progress
CREATE TABLE user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  current_count INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Job listings
CREATE TABLE job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  salary_range TEXT,
  contact_email TEXT NOT NULL,
  employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy listings for sale
CREATE TABLE pharmacy_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  price DECIMAL(12,2),
  surface_area INTEGER,
  annual_revenue DECIMAL(12,2),
  description TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  images_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL, -- webinar, feria, etc.
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  registration_url TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotions
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_type TEXT NOT NULL, -- laboratorio, mayorista, proveedor
  discount_details TEXT,
  terms_conditions TEXT,
  valid_until TIMESTAMPTZ,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- challenge_completed, new_reply, etc.
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reply_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for course enrollments
CREATE POLICY "Users can view own enrollments" ON course_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own enrollments" ON course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enrollments" ON course_enrollments FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for resource downloads
CREATE POLICY "Users can view own downloads" ON resource_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own downloads" ON resource_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for forum content
CREATE POLICY "Users can view all threads" ON forum_threads FOR SELECT USING (true);
CREATE POLICY "Users can create threads" ON forum_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own threads" ON forum_threads FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can view all replies" ON forum_replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own replies" ON forum_replies FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can manage own likes" ON forum_reply_likes FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for gamification
CREATE POLICY "Users can view own points" ON user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own points" ON user_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own points" ON user_points FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own challenge progress" ON user_challenge_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own challenge progress" ON user_challenge_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenge progress" ON user_challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for job listings
CREATE POLICY "Users can view active job listings" ON job_listings FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create job listings" ON job_listings FOR INSERT WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Users can update own job listings" ON job_listings FOR UPDATE USING (auth.uid() = employer_id);

-- RLS Policies for pharmacy listings
CREATE POLICY "Users can view active pharmacy listings" ON pharmacy_listings FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create pharmacy listings" ON pharmacy_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own pharmacy listings" ON pharmacy_listings FOR UPDATE USING (auth.uid() = seller_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Initialize user points
  INSERT INTO public.user_points (user_id, total_points, level)
  VALUES (NEW.id, 0, 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert sample data
INSERT INTO forum_categories (name, description, is_premium) VALUES
('Gestión', 'Discusiones sobre gestión farmacéutica', false),
('Marketing', 'Estrategias de marketing para farmacias', false),
('Liderazgo', 'Desarrollo de habilidades directivas', false),
('Atención al Cliente', 'Mejores prácticas en atención', false),
('Tecnología', 'Herramientas digitales para farmacias', false),
('Premium - Casos Exclusivos', 'Casos de estudio exclusivos', true);

INSERT INTO challenges (name, description, type, points_reward, target_count) VALUES
('Primer Curso', 'Completa tu primer curso', 'course_completed', 100, 1),
('Estudiante Dedicado', 'Completa 5 cursos', 'course_completed', 500, 5),
('Explorador de Recursos', 'Descarga tu primer recurso', 'resource_downloaded', 50, 1),
('Coleccionista', 'Descarga 10 recursos', 'resource_downloaded', 300, 10),
('Participante Activo', 'Responde en el foro por primera vez', 'forum_reply', 75, 1),
('Mentor Comunitario', 'Crea tu primer hilo en el foro', 'forum_post', 100, 1),
('Experto Colaborador', 'Realiza 50 respuestas en el foro', 'forum_reply', 1000, 50);

INSERT INTO courses (title, description, category, content, duration_minutes, is_premium, thumbnail_url) VALUES
('DAFO para tu Farmacia', 'Aprende a realizar un análisis DAFO completo de tu farmacia para identificar fortalezas, debilidades, oportunidades y amenazas.', 'gestion', 'Contenido del curso sobre análisis DAFO...', 120, false, '/placeholder.svg'),
('Plan de Marketing Anual', 'Desarrolla un plan de marketing efectivo para tu farmacia con estrategias probadas.', 'marketing', 'Contenido del curso sobre marketing...', 180, false, '/placeholder.svg'),
('Habilidades Directivas Avanzadas', 'Mejora tus habilidades de liderazgo y gestión de equipos en el entorno farmacéutico.', 'liderazgo', 'Contenido del curso sobre liderazgo...', 150, true, '/placeholder.svg'),
('El Poder de la Palabra', 'Domina las técnicas de comunicación efectiva detrás del mostrador.', 'atencion_cliente', 'Contenido del curso sobre atención...', 90, false, '/placeholder.svg'),
('WhatsApp Business para Farmacias', 'Configura y optimiza WhatsApp Business como herramienta de comunicación con tus clientes.', 'tecnologia', 'Contenido del curso sobre WhatsApp...', 60, false, '/placeholder.svg');

INSERT INTO resources (title, description, category, type, format, file_url, is_premium) VALUES
('Protocolo de Atención al Cliente', 'Protocolo completo para brindar una atención excepcional', 'atencion', 'protocolo', 'pdf', '/resources/protocolo-atencion.pdf', false),
('Plantilla Post Redes Sociales', 'Plantilla editable para crear posts atractivos en redes sociales', 'marketing', 'plantilla', 'docs', '/resources/plantilla-rrss.docx', false),
('Calculadora de Rentabilidad', 'Herramienta para calcular la rentabilidad de un lineal', 'gestion', 'calculadora', 'xls', '/resources/calculadora-rentabilidad.xlsx', false),
('Checklist Habilidades Directivas', 'Lista de verificación para evaluar y mejorar habilidades de liderazgo', 'liderazgo', 'checklist', 'pdf', '/resources/checklist-liderazgo.pdf', true),
('Manual Análisis Stock', 'Guía completa para analizar la rentabilidad del stock farmacéutico', 'finanzas', 'manual', 'pdf', '/resources/manual-stock.pdf', true),
('Guía Blog Farmacia', 'Cómo redactar y publicar contenido efectivo en el blog de tu farmacia', 'digital', 'guia', 'pdf', '/resources/guia-blog.pdf', false);

INSERT INTO events (title, description, event_type, start_date, end_date, location, registration_url, image_url, is_featured) VALUES
('Webinar: Futuro de la Farmacia Digital', 'Descubre las tendencias tecnológicas que transformarán las farmacias', 'webinar', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours', 'Online', 'https://farmapro.com/webinar-futuro', '/placeholder.svg', true),
('Feria Farmacéutica Madrid 2024', 'La mayor feria del sector farmacéutico en España', 'feria', NOW() + INTERVAL '30 days', NOW() + INTERVAL '33 days', 'Madrid, España', 'https://feriafarmacia.com', '/placeholder.svg', false),
('Congreso de Atención Farmacéutica', 'Congreso nacional sobre atención farmacéutica y servicios profesionales', 'congreso', NOW() + INTERVAL '60 days', NOW() + INTERVAL '62 days', 'Barcelona, España', 'https://congreso-af.com', '/placeholder.svg', true);

INSERT INTO promotions (title, description, company_name, company_type, discount_details, terms_conditions, valid_until, image_url, is_active) VALUES
('Descuento Especial ISDIN', 'Condiciones especiales en productos de dermocosmética ISDIN para miembros de FarmaPro', 'ISDIN', 'laboratorio', '15% descuento adicional en pedidos superiores a 500€', 'Válido solo para miembros Premium. No acumulable con otras ofertas.', NOW() + INTERVAL '90 days', '/placeholder.svg', true),
('Mejores Condiciones Cofares', 'Acceso a condiciones preferenciales con el mayorista Cofares', 'Cofares', 'mayorista', 'Descuentos especiales y plazos de pago ampliados', 'Exclusivo para miembros Profesional y Premium', NOW() + INTERVAL '120 days', '/placeholder.svg', true),
('Oferta Especial Apotheka', 'Promoción exclusiva en software de gestión farmacéutica', 'Apotheka', 'proveedor', '20% descuento en licencia anual', 'Válido para nuevas contrataciones. Soporte incluido.', NOW() + INTERVAL '60 days', '/placeholder.svg', true);

INSERT INTO job_listings (title, company_name, location, description, requirements, salary_range, contact_email, employer_id, expires_at) VALUES
('Farmacéutico/a Adjunto/a', 'Farmacia Central', 'Madrid Centro', 'Buscamos farmacéutico/a con experiencia para incorporarse a nuestro equipo en farmacia de alto volumen.', 'Colegiado/a en Madrid, experiencia mínima 2 años, conocimientos de dermofarmacia', '28.000€ - 32.000€ anuales', 'rrhh@farmaciacentral.com', (SELECT id FROM profiles LIMIT 1), NOW() + INTERVAL '30 days'),
('Técnico en Farmacia', 'Farmacia San José', 'Valencia', 'Incorporación inmediata para técnico en farmacia con experiencia en atención al cliente.', 'FP en Farmacia, experiencia mínima 1 año, disponibilidad horaria', '20.000€ - 24.000€ anuales', 'contacto@farmaciasanjose.es', (SELECT id FROM profiles LIMIT 1), NOW() + INTERVAL '45 days');

INSERT INTO pharmacy_listings (title, location, price, surface_area, annual_revenue, description, contact_email, seller_id, images_urls) VALUES
('Farmacia en Venta - Centro Histórico', 'Sevilla Centro', 450000.00, 120, 380000.00, 'Farmacia establecida desde 1952 en zona de alto tránsito peatonal. Clientela fidelizada y excelente ubicación comercial.', 'venta@farmaciahistorica.com', (SELECT id FROM profiles LIMIT 1), ARRAY['/placeholder.svg']),
('Oportunidad de Inversión - Farmacia Moderna', 'Barcelona Eixample', 680000.00, 200, 520000.00, 'Farmacia completamente renovada con las últimas tecnologías. Zona residencial de alta capacidad adquisitiva.', 'info@farmaciamoderna.com', (SELECT id FROM profiles LIMIT 1), ARRAY['/placeholder.svg']);
