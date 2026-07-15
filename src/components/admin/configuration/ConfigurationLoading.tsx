
export const ConfigurationLoading = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración General</h1>
        <p className="text-muted-foreground">Ajustes del portal y configuraciones del sistema</p>
      </div>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </div>
  );
};
