import { lazy, Suspense, type ComponentType } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminProtectedRoute } from "./AdminProtectedRoute";
import { GratisGate } from "@/components/access/GratisGate";
import { GRATIS_CANDADO } from "@/lib/cuentaGratis";
import { getAccessState } from "@/lib/plans";
import { useModoGratis } from "@/hooks/useModoGratis";

// Cada pantalla se descarga solo cuando se abre (18-11-2026). Antes todo el
// portal iba en un único archivo de 477 KiB y una landing de anuncios como
// /black-friday tardaba 4-6 s en pintarse en móvil.
const named = <K extends string>(loader: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => loader().then((m) => ({ default: m[name] })));

const LoginForm = named(() => import("@/components/auth/LoginForm"), "LoginForm");
const Dashboard = named(() => import("@/pages/Dashboard"), "Dashboard");
const Formacion = named(() => import("@/pages/Formacion"), "Formacion");
const Recursos = named(() => import("@/pages/Recursos"), "Recursos");
const VaultMasterclass = lazy(() => import("@/pages/VaultMasterclass"));
const VaultMasterclassProtocolo = lazy(() => import("@/pages/VaultMasterclassProtocolo"));
const VaultMasterclassWhatsapp = lazy(() => import("@/pages/VaultMasterclassWhatsapp"));
const ResetPassword = named(() => import("@/pages/ResetPassword"), "ResetPassword");
const AvisoLegal = named(() => import("@/pages/Legal"), "AvisoLegal");
const PoliticaPrivacidad = named(() => import("@/pages/Legal"), "PoliticaPrivacidad");
const PoliticaCookies = named(() => import("@/pages/Legal"), "PoliticaCookies");
const ContactoSoporte = named(() => import("@/pages/Legal"), "ContactoSoporte");
const Retos = named(() => import("@/pages/Retos"), "Retos");
const NotFound = lazy(() => import("@/pages/NotFound"));
const Comunidad = lazy(() => import("@/pages/Comunidad"));
const Empleo = lazy(() => import("@/pages/Empleo"));
const Farmacias = lazy(() => import("@/pages/Farmacias"));
const Eventos = lazy(() => import("@/pages/Eventos"));
const Promociones = lazy(() => import("@/pages/Promociones"));
const Precios = lazy(() => import("@/pages/Precios"));
const Rebotica = lazy(() => import("@/pages/Rebotica"));
const Descarga = lazy(() => import("@/pages/Descarga"));
const ReboticaBasesLegales = lazy(() => import("@/pages/ReboticaBasesLegales"));
const Baja = lazy(() => import("@/pages/Baja"));
const Activar = lazy(() => import("@/pages/Activar"));
const Continuar = lazy(() => import("@/pages/Continuar"));
const BlackFriday = lazy(() => import("@/pages/BlackFriday"));
const Perfil = lazy(() => import("@/pages/Perfil"));
const MiFarmacia = lazy(() => import("@/pages/MiFarmacia"));
const CourseView = lazy(() => import("@/pages/CourseView"));
const CourseQuizView = lazy(() => import("@/pages/CourseQuizView"));
const AsistenteCreativo = lazy(() => import("@/pages/AsistenteCreativo"));
const RadiografiaGoogle = lazy(() => import("@/pages/RadiografiaGoogle"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsuarios = lazy(() => import("@/pages/admin/AdminUsuarios"));
const AdminPromociones = lazy(() => import("@/pages/admin/AdminPromociones"));
const AdminComunidad = lazy(() => import("@/pages/admin/AdminComunidad"));
const AdminRetos = lazy(() => import("@/pages/admin/AdminRetos"));
const AdminConfiguracion = lazy(() => import("@/pages/admin/AdminConfiguracion"));
const Invitation = lazy(() => import("@/pages/Invitation"));

// Landings de anuncios: se pintan sin esperar a la sesión ni a system_settings,
// que solo sirven para redirigir rutas privadas. La página gestiona su sesión.
const SIN_ESPERA = new Set(["/black-friday"]);

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

import { PageMeta } from "@/components/seo/PageMeta";


export const AppRoutes = () => {
  const { user, profile, loading } = useAuth();
  const { getSettingsByCategory, isLoading: settingsLoading } = useSystemSettings();
  // Cuenta gratis permanente: con 'permanente' la prueba terminada ya no redirige a /precios.
  const { modo, isLoading: modoLoading } = useModoGratis();
  const { pathname } = useLocation();

  // A1: validation_mode vive en la categoría 'subscription', NO en 'system'
  // (no existe ninguna fila con category='system'). Leerla mal dejaba
  // validationMode en 'beta' eternamente y el corte del plan Gratis era código
  // muerto. Además hizo falta una policy de SELECT en system_settings para
  // usuarios autenticados: antes solo los admin podían leer y todos los demás
  // recibían {}. Mismo origen que C17 (visibilidad de secciones).
  const subscriptionSettings = getSettingsByCategory('subscription');
  const validationMode = subscriptionSettings?.validation_mode || 'beta';

  if ((loading || settingsLoading || modoLoading) && !SIN_ESPERA.has(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Iniciando aplicación...</p>
        </div>
      </div>
    );
  }

  // Expiración del gratis: fuente ÚNICA = getAccessState (created_at + 30 días, o
  // trial_ends_at si una concesión la alarga).
  // (Antes se miraba trial_ends_at/student_valid_until, columnas que nadie escribe.)
  // Solo redirigimos a /precios cuando validation_mode='active' y el acceso está
  // bloqueado; los roles de pago nunca entran aquí (getAccessState devuelve 'paid').
  const accessState = user
    ? getAccessState(profile?.subscription_role ?? null, profile?.created_at ?? null, profile?.trial_ends_at ?? null, modo)
    : null;
  const shouldRedirectToPrecios = validationMode === 'active' && accessState === 'free_locked';

  return (
    <>
    <PageMeta />
    <Suspense fallback={<div className="min-h-screen" />}>
    <Routes>
      {/* Public pricing page */}
      <Route path="/precios" element={<Precios />} />
      {/* La Rebotica: página pública (elegir cajón sin cuenta; abrir exige registro) */}
      <Route path="/rebotica" element={<Rebotica />} />
      {/* Descargable de la quincena vigente de Impulso: público sin cuenta
          mientras dura la ventana (resources.open_until); pasada la ventana,
          la propia página explica que ya solo vive dentro del portal. */}
      <Route path="/descarga/:slug" element={<Descarga />} />
      {/* Consentimiento OAuth para clientes MCP (Claude, ChatGPT, Lovable...) */}
      <Route path="/rebotica/bases-legales" element={<ReboticaBasesLegales />} />
      {/* Páginas legales: públicas, sin sidebar (mismo patrón que /rebotica/bases-legales) */}
      <Route path="/aviso-legal" element={<AvisoLegal />} />
      <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
      <Route path="/politica-cookies" element={<PoliticaCookies />} />
      <Route path="/contacto-soporte" element={<ContactoSoporte />} />

      {/* Baja del resumen de los lunes: pública, se pulsa desde el correo sin sesión */}
      <Route path="/baja" element={<Baja />} />
      {/* Activación de una concesión regalada (portal_grants): la página a la
          que apunta el correo que Alejandro manda cliente a cliente. Pública
          porque el primer clic llega sin cuenta; dentro pide login o registro. */}
      <Route path="/activar" element={<Activar />} />
      <Route path="/continuar" element={<Continuar />} />
      {/* Black Friday 2026: Plus anual a 180 € el primer año (24-11 a 01-12). Pública. */}
      <Route path="/black-friday" element={<BlackFriday />} />
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
          {/* C1: /perfil y /mi-farmacia NO se redirigen. Si a un cliente le
              caduca la suscripción tiene que poder entrar en Perfil →
              Facturación a arreglar su tarjeta; redirigirlo a /precios era una
              trampa cerrada, y además Precios promete que "lo sigues viendo
              todo". */}
        </>
      )}
      
      {/* Sin sesion la raiz lleva al escaparate (planes y que incluye), no a un
          formulario de login: quien llega desde el email todavia no es cliente. */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/precios" replace />} />
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
      {/* Vault de la Rebotica: página oculta, solo con sesión, sin enlaces desde el menú */}
      <Route path="/vault/masterclass-5-palancas" element={
        <ProtectedRoute>
          <VaultMasterclass />
        </ProtectedRoute>
      } />
      <Route path="/vault/masterclass-protocolo-mostrador" element={
        <ProtectedRoute>
          <VaultMasterclassProtocolo />
        </ProtectedRoute>
      } />
      <Route path="/vault/masterclass-whatsapp-mostrador" element={
        <ProtectedRoute>
          <VaultMasterclassWhatsapp />
        </ProtectedRoute>
      } />
      <Route path="/comunidad" element={
        <ProtectedRoute>
          <GratisGate description={GRATIS_CANDADO.comunidad}>
            <Comunidad />
          </GratisGate>
        </ProtectedRoute>
      } />
      <Route path="/retos" element={
        <ProtectedRoute>
          <GratisGate description={GRATIS_CANDADO.retos}>
            <Retos />
          </GratisGate>
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
          <GratisGate description={GRATIS_CANDADO.eventos}>
            <Eventos />
          </GratisGate>
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
      {/* Radiografía de la ficha de Google: informe completo de la herramienta de farmapro.es */}
      <Route path="/radiografia-google" element={
        <ProtectedRoute>
          <RadiografiaGoogle />
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
    </Suspense>
    </>
  );
};