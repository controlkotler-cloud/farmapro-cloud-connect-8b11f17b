import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { LoginForm } from "@/components/auth/LoginForm";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminProtectedRoute } from "./AdminProtectedRoute";
import { Dashboard } from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import { Formacion } from "@/pages/Formacion";
import { Recursos } from "@/pages/Recursos";
import { getAccessState } from "@/lib/plans";
import Comunidad from "@/pages/Comunidad";
import { Retos } from "@/pages/Retos";
import Empleo from "@/pages/Empleo";
import Farmacias from "@/pages/Farmacias";
import Eventos from "@/pages/Eventos";
import Promociones from "@/pages/Promociones";

import Precios from "@/pages/Precios";
import Rebotica from "@/pages/Rebotica";
import OAuthConsent from "@/pages/OAuthConsent";

/**
 * Destino post-login preservado en ?next= (lo usa el consentimiento OAuth de MCP).
 * Solo se aceptan rutas relativas del mismo origen.
 */
const safeNext = (): string | null => {
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
};
import ReboticaBasesLegales from "@/pages/ReboticaBasesLegales";
import { AvisoLegal, PoliticaPrivacidad, PoliticaCookies, ContactoSoporte } from "@/pages/Legal";
import Perfil from "@/pages/Perfil";
import MiFarmacia from "@/pages/MiFarmacia";
import CourseView from "@/pages/CourseView";
import CourseQuizView from "@/pages/CourseQuizView";
import AsistenteCreativo from "@/pages/AsistenteCreativo";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsuarios from "@/pages/admin/AdminUsuarios";
import AdminPromociones from "@/pages/admin/AdminPromociones";
import AdminComunidad from "@/pages/admin/AdminComunidad";
import AdminRetos from "@/pages/admin/AdminRetos";
import AdminConfiguracion from "@/pages/admin/AdminConfiguracion";
import Invitation from "@/pages/Invitation";
import { ResetPassword } from "@/pages/ResetPassword";
import { PageMeta } from "@/components/seo/PageMeta";


export const AppRoutes = () => {
  const { user, profile, loading } = useAuth();
  const { getSettingsByCategory, isLoading: settingsLoading } = useSystemSettings();

  // Get system settings
  const systemSettings = getSettingsByCategory('system');
  const validationMode = systemSettings?.validation_mode || 'beta';

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Iniciando aplicación...</p>
        </div>
      </div>
    );
  }

  // Expiración del gratis: fuente ÚNICA = getAccessState (created_at + 30 días).
  // (Antes se miraba trial_ends_at/student_valid_until, columnas que nadie escribe.)
  // Solo redirigimos a /precios cuando validation_mode='active' y el acceso está
  // bloqueado; los roles de pago nunca entran aquí (getAccessState devuelve 'paid').
  const accessState = user
    ? getAccessState(profile?.subscription_role ?? null, profile?.created_at ?? null)
    : null;
  const shouldRedirectToPrecios = validationMode === 'active' && accessState === 'free_locked';

  return (
    <>
    <PageMeta />
    <Routes>
      {/* Public pricing page */}
      <Route path="/precios" element={<Precios />} />
      {/* La Rebotica: página pública (elegir cajón sin cuenta; abrir exige registro) */}
      <Route path="/rebotica" element={<Rebotica />} />
      {/* Consentimiento OAuth para clientes MCP (Claude, ChatGPT, Lovable...) */}
      <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
      <Route path="/rebotica/bases-legales" element={<ReboticaBasesLegales />} />
      {/* Páginas legales: públicas, sin sidebar (mismo patrón que /rebotica/bases-legales) */}
      <Route path="/aviso-legal" element={<AvisoLegal />} />
      <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
      <Route path="/politica-cookies" element={<PoliticaCookies />} />
      <Route path="/contacto-soporte" element={<ContactoSoporte />} />
      {/* Team invitation acceptance (public — inner logic requires auth) */}
      <Route path="/invitation" element={<Invitation />} />
      {/* Password recovery link target (public — Supabase establece sesión temporal vía URL) */}
      <Route path="/reset-password" element={<ResetPassword />} />
      
      
      {/* Redirect expired users to precios when they try to access protected routes */}
      {shouldRedirectToPrecios && (
        <>
          <Route path="/dashboard" element={<Navigate to="/precios" replace />} />
          <Route path="/formacion" element={<Navigate to="/precios" replace />} />
          <Route path="/recursos" element={<Navigate to="/precios" replace />} />
          <Route path="/comunidad" element={<Navigate to="/precios" replace />} />
          <Route path="/empleo" element={<Navigate to="/precios" replace />} />
          <Route path="/eventos" element={<Navigate to="/precios" replace />} />
          <Route path="/retos" element={<Navigate to="/precios" replace />} />
          <Route path="/farmacias" element={<Navigate to="/precios" replace />} />
          <Route path="/promociones" element={<Navigate to="/precios" replace />} />
          <Route path="/perfil" element={<Navigate to="/precios" replace />} />
          <Route path="/mi-farmacia" element={<Navigate to="/precios" replace />} />

        </>
      )}
      
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route 
        path="/login" 
        element={user ? <Navigate to={safeNext() ?? "/dashboard"} replace /> : <LoginForm />} 
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
      <Route path="/mi-farmacia" element={
        <ProtectedRoute>
          <MiFarmacia />
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
      <Route path="/asistente-creativo" element={
        <ProtectedRoute>
          <AsistenteCreativo />
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
    </>
  );
};