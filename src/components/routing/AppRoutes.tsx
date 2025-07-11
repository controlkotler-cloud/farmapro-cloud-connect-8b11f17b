import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminProtectedRoute } from "./AdminProtectedRoute";
import { Dashboard } from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
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
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminCursos from "@/pages/admin/AdminCursos";
import AdminQuizzes from "@/pages/admin/AdminQuizzes";
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
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
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
      <Route path="/admin/quizzes" element={
        <AdminProtectedRoute>
          <AdminQuizzes />
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
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
