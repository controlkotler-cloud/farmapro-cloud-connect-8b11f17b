
export const FormacionHeader = () => {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
          Formación que <em className="italic-display">se nota en el mostrador</em>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Cursos y píldoras para aplicar en tu farmacia desde hoy.
        </p>
      </div>
    </div>
  );
};
