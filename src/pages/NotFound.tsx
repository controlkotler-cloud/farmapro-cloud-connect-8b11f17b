import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
        <Button asChild variant="brand" size="pill" className="mt-6">
          <Link to="/dashboard">
            Volver al dashboard →
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
