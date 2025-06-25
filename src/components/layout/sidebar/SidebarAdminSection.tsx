
import { useLocation, Link } from 'react-router-dom';
import {
  Settings,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const SidebarAdminSection = () => {
  const location = useLocation();
  const isActive = location.pathname === '/admin';

  return (
    <>
      <div className="my-6 mx-4">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        <div className="flex items-center justify-center -mt-3">
          <div className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full border border-gray-300">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Admin</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <Link
          to="/admin"
          className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
            isActive
              ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 shadow-lg ring-1 ring-red-200 translate-x-1'
              : 'text-gray-500 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-700'
          }`}
        >
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-red-400 to-red-600 rounded-r-full shadow-lg"></div>
          )}
          
          <div className={`relative p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 shadow-lg mr-4 transition-transform group-hover:scale-110`}>
            <Settings className="h-4 w-4 text-white" />
            {isActive && (
              <div className="absolute inset-0 rounded-lg bg-white/20 animate-pulse"></div>
            )}
          </div>
          
          <span className="flex-1 font-semibold tracking-wide">Panel Admin</span>
          
          <ChevronRight
            className={`h-4 w-4 transition-all duration-300 ${
              isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-70 group-hover:translate-x-0'
            }`}
          />
        </Link>
      </div>
    </>
  );
};
