
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminProtectedRoute } from "./AdminProtectedRoute";
import { Dashboard } from "@/pages/Dashboard";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Subscription from "@/pages/Subscription";
import { Formacion } from "@/pages/Formacion";
import { Recursos } from "@/pages/Recursos";
import Comunidad from "@/pages/Comunidad";
import { Retos } from "@/pages/Retos";
import Empleo from "@/pages/Empleo";
import Farmacias from "@/pages/Farmacias";
import Eventos from "@/pages/Eventos";
import Promociones from "@/pages/Promociones";
import Perfil from "@/pages/Perfil";
import CourseView from "@/pages/CourseView";
import CourseQuizView from "@/pages/CourseQuizView";
import PoliticaCookies from "@/pages/PoliticaCookies";
import PoliticaPrivacidad from "@/pages/PoliticaPrivacidad";
import AvisoLegal from "@/pages/AvisoLegal";
import ContactoSoporte from "@/pages/ContactoSoporte";
import Servicios from "@/pages/Servicios";
import FarmaproImpulso from "@/pages/FarmaproImpulso";
import FaqsContacto from "@/pages/FaqsContacto";
import Blog from "@/pages/Blog";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminCursos from "@/pages/admin/AdminCursos";
import AdminRecursos from "@/pages/admin/AdminRecursos";
import AdminUsuarios from "@/pages/admin/AdminUsuarios";
import AdminEventos from "@/pages/admin/AdminEventos";
import AdminEmpleo from "@/pages/admin/AdminEmpleo";
import AdminFarmacias from "@/pages/admin/AdminFarmacias";
import AdminPromociones from "@/pages/admin/AdminPromociones";
import AdminComunidad from "@/pages/admin/AdminComunidad";
import AdminRetos from "@/pages/admin/AdminRetos";
import AdminConfiguracion from "@/pages/admin/AdminConfiguracion";

export const AppRoutes = () => {
  const { user, loading } = useAuth();

  console.log('AppRoutes - user:', user?.email, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Iniciando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Index />} />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
      />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/perfil" element={
        <ProtectedRoute>
          <Perfil />
        </ProtectedRoute>
      } />
      <Route path="/formacion" element={
        <ProtectedRoute>
          <Formacion />
        </ProtectedRoute>
      } />
      <Route path="/curso/:courseSlug" element={
        <ProtectedRoute>
          <CourseView />
        </ProtectedRoute>
      } />
      <Route path="/curso/:courseSlug/quiz" element={
        <ProtectedRoute>
          <CourseQuizView />
        </ProtectedRoute>
      } />
      <Route path="/recursos" element={
        <ProtectedRoute>
          <Recursos />
        </ProtectedRoute>
      } />
      <Route path="/comunidad" element={
        <ProtectedRoute>
          <Comunidad />
        </ProtectedRoute>
      } />
      <Route path="/retos" element={
        <ProtectedRoute>
          <Retos />
        </ProtectedRoute>
      } />
      <Route path="/empleo" element={
        <ProtectedRoute>
          <Empleo />
        </ProtectedRoute>
      } />
      <Route path="/farmacias" element={
        <ProtectedRoute>
          <Farmacias />
        </ProtectedRoute>
      } />
      <Route path="/eventos" element={
        <ProtectedRoute>
          <Eventos />
        </ProtectedRoute>
      } />
      <Route path="/promociones" element={
        <ProtectedRoute>
          <Promociones />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/cursos" element={
        <AdminProtectedRoute>
          <AdminCursos />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/recursos" element={
        <AdminProtectedRoute>
          <AdminRecursos />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/usuarios" element={
        <AdminProtectedRoute>
          <AdminUsuarios />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/eventos" element={
        <AdminProtectedRoute>
          <AdminEventos />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/empleo" element={
        <AdminProtectedRoute>
          <AdminEmpleo />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/farmacias" element={
        <AdminProtectedRoute>
          <AdminFarmacias />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/promociones" element={
        <AdminProtectedRoute>
          <AdminPromociones />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/comunidad" element={
        <AdminProtectedRoute>
          <AdminComunidad />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/retos" element={
        <AdminProtectedRoute>
          <AdminRetos />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/configuracion" element={
        <AdminProtectedRoute>
          <AdminConfiguracion />
        </AdminProtectedRoute>
      } />
      
      {/* Public Pages */}
      <Route path="/subscription" element={<Subscription />} />
      <Route path="/servicios" element={<Servicios />} />
      <Route path="/farmapro-impulso" element={<FarmaproImpulso />} />
      <Route path="/faqs-contacto" element={<FaqsContacto />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/politica-cookies" element={<PoliticaCookies />} />
      <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
      <Route path="/aviso-legal" element={<AvisoLegal />} />
      <Route path="/contacto-soporte" element={<ContactoSoporte />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
