
interface AuthHeaderProps {
  isRegistering: boolean;
}

export const AuthHeader = ({ isRegistering }: AuthHeaderProps) => {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 space-y-3">
        {/* Imagotipo */}
        <div className="flex justify-center">
          <img src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" alt="farmapro imagotipo" className="w-16 h-16" />
        </div>
        
        {/* Texto Portal */}
        <h1 className="text-xl font-bold text-gray-800">Portal</h1>
        
        {/* Logotipo */}
        <div className="flex justify-center">
          <img src="/lovable-uploads/logo_farmapro.svg" alt="farmapro logotipo" className="h-8" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {isRegistering ? 'Registro' : 'Accede a tu cuenta'}
      </h2>
      {isRegistering && (
        <p className="text-sm text-gray-600">
          Crea tu cuenta profesional
        </p>
      )}
    </div>
  );
};
