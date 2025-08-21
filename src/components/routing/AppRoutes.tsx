
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminProtectedRoute } from './AdminProtectedRoute';
import { Dashboard } from '@/pages/Dashboard';
import { Formacion } from '@/pages/Formacion';
import { Recursos } from '@/pages/Recursos';
import Comunidad from '@/pages/Comunidad';
import { Retos } from '@/pages/Retos';
import Farmacias from '@/pages/Farmacias';
import Empleo from '@/pages/Empleo';
import EmpleoConversaciones from '@/pages/EmpleoConversaciones';
import EmpleoConversacion from '@/pages/EmpleoConversacion';
import Promociones from '@/pages/Promociones';
import Eventos from '@/pages/Eventos';
import Perfil from '@/pages/Perfil';
import CourseView from '@/pages/CourseView';
import CourseQuizView from '@/pages/CourseQuizView';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsuarios from '@/pages/admin/AdminUsuarios';
import AdminCursos from '@/pages/admin/AdminCursos';
import AdminRecursos from '@/pages/admin/AdminRecursos';
import AdminQuizzes from '@/pages/admin/AdminQuizzes';
import AdminComunidad from '@/pages/admin/AdminComunidad';
import AdminRetos from '@/pages/admin/AdminRetos';
import AdminFarmacias from '@/pages/admin/AdminFarmacias';
import AdminEmpleo from '@/pages/admin/AdminEmpleo';
import AdminPromociones from '@/pages/admin/AdminPromociones';
import AdminEventos from '@/pages/admin/AdminEventos';
import AdminConfiguracion from '@/pages/admin/AdminConfiguracion';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/formacion" element={
        <ProtectedRoute>
          <Formacion />
        </ProtectedRoute>
      } />
      
      <Route path="/formacion/:courseSlug" element={
        <ProtectedRoute>
          <CourseView />
        </ProtectedRoute>
      } />
      
      <Route path="/formacion/:courseSlug/quiz/:quizId" element={
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
      
      <Route path="/farmacias" element={
        <ProtectedRoute>
          <Farmacias />
        </ProtectedRoute>
      } />
      
      <Route path="/empleo" element={
        <ProtectedRoute>
          <Empleo />
        </ProtectedRoute>
      } />
      
      <Route path="/empleo/conversaciones" element={
        <ProtectedRoute>
          <EmpleoConversaciones />
        </ProtectedRoute>
      } />
      
      <Route path="/empleo/conversaciones/:conversationId" element={
        <ProtectedRoute>
          <EmpleoConversacion />
        </ProtectedRoute>
      } />
      
      <Route path="/promociones" element={<Promociones />} />
      
      <Route path="/eventos" element={<Eventos />} />
      
      <Route path="/perfil" element={
        <ProtectedRoute>
          <Perfil />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      } />
      
      <Route path="/admin/usuarios" element={
        <AdminProtectedRoute>
          <AdminUsuarios />
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
      
      <Route path="/admin/quizzes" element={
        <AdminProtectedRoute>
          <AdminQuizzes />
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
      
      <Route path="/admin/farmacias" element={
        <AdminProtectedRoute>
          <AdminFarmacias />
        </AdminProtectedRoute>
      } />
      
      <Route path="/admin/empleo" element={
        <AdminProtectedRoute>
          <AdminEmpleo />
        </AdminProtectedRoute>
      } />
      
      <Route path="/admin/promociones" element={
        <AdminProtectedRoute>
          <AdminPromociones />
        </AdminProtectedRoute>
      } />
      
      <Route path="/admin/eventos" element={
        <AdminProtectedRoute>
          <AdminEventos />
        </AdminProtectedRoute>
      } />
      
      <Route path="/admin/configuracion" element={
        <AdminProtectedRoute>
          <AdminConfiguracion />
        </AdminProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
