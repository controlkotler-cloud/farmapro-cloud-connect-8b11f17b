
interface AuthHeaderProps {
  isRegistering: boolean;
}

export const AuthHeader = ({ isRegistering }: AuthHeaderProps) => {
  return (
    <div className="text-center">
      {/* Enlace discreto de vuelta a la web principal */}
      <div className="mb-4">
        <a
          href="https://farmapro.es"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; volver a farmapro.es
        </a>
      </div>

      <div className="mx-auto mb-6 space-y-3">
        {/* Imagotipo (decorativo: la marca ya la da el logotipo de abajo) */}
        <div className="flex justify-center">
          <img src="/icono-farmapro.svg" alt="" className="w-16 h-16" />
        </div>

        {/* Texto Portal */}
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Portal</p>

        {/* Logotipo */}
        <div className="flex justify-center">
          <img src="/logo-farmapro.svg" alt="farmapro" className="h-8" />
        </div>
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-2 [text-wrap:balance]">
        {isRegistering ? 'Registro' : 'Accede a tu cuenta'}
      </h1>
      {isRegistering && (
        <p className="text-sm text-muted-foreground">
          Crea tu cuenta profesional
        </p>
      )}
    </div>
  );
};
