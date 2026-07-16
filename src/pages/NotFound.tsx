import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: La página no existe",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Error 404</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
          Esta página <em className="italic-display">se nos ha traspapelado</em>
        </h1>
        <p className="mt-3 text-muted-foreground">
          No la encontramos donde debería estar. Volvamos a un sitio conocido.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
        >
          Volver al dashboard →
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
