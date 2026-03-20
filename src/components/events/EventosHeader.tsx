import { motion } from 'framer-motion';
export const EventosHeader = () => {
  return <motion.div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-8 shadow-lg ring-1 ring-orange-200" initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }}>
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-orange-400 to-orange-600 rounded-r-full shadow-lg"></div>
        <div className="ml-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Eventos</h1>
          <p className="text-gray-600">Aquí encontrarás actualizados todos los webinars, conferencias, workshops, cursos y ferias del sector farmacéutico.</p>
        </div>
      </div>
    </motion.div>;
};