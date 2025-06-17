
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  GraduationCap, 
  FileText, 
  Users, 
  Trophy, 
  Briefcase, 
  Building2,
  Calendar,
  Gift,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: GraduationCap, label: 'Formación', path: '/formacion' },
  { icon: FileText, label: 'Recursos', path: '/recursos' },
  { icon: Users, label: 'Comunidad', path: '/comunidad' },
  { icon: Trophy, label: 'Retos', path: '/retos' },
  { icon: Briefcase, label: 'Bolsa de Empleo', path: '/empleo' },
  { icon: Building2, label: 'Farmacias en Venta', path: '/farmacias' },
  { icon: Calendar, label: 'Eventos', path: '/eventos' },
  { icon: Gift, label: 'Promociones', path: '/promociones' },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'profesional': return 'bg-gradient-to-r from-blue-500 to-purple-600';
      case 'estudiante': return 'bg-gradient-to-r from-green-400 to-blue-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600';
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'premium': return 'Premium';
      case 'profesional': return 'Profesional';
      case 'estudiante': return 'Estudiante';
      default: return 'Freemium';
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3 }}
      className="bg-white h-screen shadow-xl border-r border-gray-200 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                FP
              </div>
              <span className="font-bold text-gray-900">FarmaPro</span>
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 h-8 w-8"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Plan Banner */}
      <div className="p-4 border-t border-gray-200">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`p-3 rounded-lg text-white text-center ${getPlanColor(profile?.subscription_role || 'freemium')}`}
        >
          {!collapsed ? (
            <div>
              <p className="text-sm font-medium">Plan Actual</p>
              <p className="text-lg font-bold">{getPlanLabel(profile?.subscription_role || 'freemium')}</p>
            </div>
          ) : (
            <div className="text-xs font-bold">
              {getPlanLabel(profile?.subscription_role || 'freemium').charAt(0)}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
