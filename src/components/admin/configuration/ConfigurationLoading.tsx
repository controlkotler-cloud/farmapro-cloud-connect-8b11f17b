
export const ConfigurationLoading = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración General</h1>
        <p className="text-gray-600">Ajustes del portal y configuraciones del sistema</p>
      </div>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    </div>
  );
};
