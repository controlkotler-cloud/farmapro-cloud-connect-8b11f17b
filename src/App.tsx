import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dashboard } from "@/pages/Dashboard";
import { CookieManager } from "@/components/cookies/CookieManager";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Subscription from "./pages/Subscription";
import Formacion from "./pages/Formacion";
import Recursos from "./pages/Recursos";
import Comunidad from "./pages/Comunidad";
import Retos from "./pages/Retos";
import Empleo from "./pages/Empleo";
import Farmacias from "./pages/Farmacias";
import Eventos from "./pages/Eventos";
import Promociones from "./pages/Promociones";
import Perfil from "./pages/Perfil";
import CourseView from "./pages/CourseView";
import CourseQuizView from "./pages/CourseQuizView";
import PoliticaCookies from "./pages/PoliticaCookies";
import PoliticaPrivacidad from "./pages/PoliticaPrivacidad";
import AvisoLegal from "./pages/AvisoLegal";
import ContactoSoporte from "./pages/ContactoSoporte";
import Servicios from "./pages/Servicios";
import FarmaproImpulso from "./pages/FarmaproImpulso";
import FaqsContacto from "./pages/FaqsContacto";
import Blog from "./pages/Blog";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCursos from "./pages/admin/AdminCursos";
import AdminRecursos from "./pages/admin/AdminRecursos";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!user) {
    return <LoginForm />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Index />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginForm />} />
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
      <Route path="/curso/:courseId" element={
        <ProtectedRoute>
          <CourseView />
        </ProtectedRoute>
      } />
      <Route path="/curso/:courseId/quiz" element={
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
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/cursos" element={
        <ProtectedRoute>
          <AdminCursos />
        </ProtectedRoute>
      } />
      <Route path="/admin/recursos" element={
        <ProtectedRoute>
          <AdminRecursos />
        </ProtectedRoute>
      } />
      
      {/* Páginas públicas */}
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AppRoutes />
          <CookieManager />
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
