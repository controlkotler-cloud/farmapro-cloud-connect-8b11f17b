
import { motion } from 'framer-motion';
import { BookOpen, Users, Trophy, Target } from 'lucide-react';

export const CourseHeader = () => {
  const stats = [
    { icon: BookOpen, label: 'Cursos', value: '20+', color: 'from-blue-500 to-blue-600' },
    { icon: Users, label: 'Estudiantes', value: '500+', color: 'from-green-500 to-green-600' },
    { icon: Trophy, label: 'Certificados', value: '300+', color: 'from-yellow-500 to-yellow-600' },
    { icon: Target, label: 'Completados', value: '95%', color: 'from-purple-500 to-purple-600' }
  ];

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formación Profesional</h1>
          <p className="text-gray-600">Desarrolla tus habilidades con nuestros cursos especializados</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/20"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color} shadow-md`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
