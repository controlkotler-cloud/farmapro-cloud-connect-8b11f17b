
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading } = useAuth();

  console.log('AdminProtectedRoute - user:', user?.email, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('AdminProtectedRoute - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </AdminRoute>
  );
};
