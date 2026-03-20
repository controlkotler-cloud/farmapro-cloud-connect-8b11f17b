import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Formacion from "./pages/Formacion";
import Recursos from "./pages/Recursos";
import Comunidad from "./pages/Comunidad";
import Empleo from "./pages/Empleo";
import Farmacias from "./pages/Farmacias";
import Retos from "./pages/Retos";
import Eventos from "./pages/Eventos";
import Promociones from "./pages/Promociones";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/formacion" element={<ProtectedRoute><Formacion /></ProtectedRoute>} />
            <Route path="/recursos" element={<ProtectedRoute><Recursos /></ProtectedRoute>} />
            <Route path="/comunidad" element={<ProtectedRoute><Comunidad /></ProtectedRoute>} />
            <Route path="/empleo" element={<ProtectedRoute><Empleo /></ProtectedRoute>} />
            <Route path="/farmacias" element={<ProtectedRoute><Farmacias /></ProtectedRoute>} />
            <Route path="/retos" element={<ProtectedRoute><Retos /></ProtectedRoute>} />
            <Route path="/eventos" element={<ProtectedRoute><Eventos /></ProtectedRoute>} />
            <Route path="/promociones" element={<ProtectedRoute><Promociones /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
