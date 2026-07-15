import { useLocation } from "react-router-dom";
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
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Vaya, no encontramos esta página</p>
        <a href="/" className="text-primary hover:text-primary/80 underline">
          Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default NotFound;
