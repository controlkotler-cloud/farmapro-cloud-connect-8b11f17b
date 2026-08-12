export const CommunityHeader = () => {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
          El foro donde <em className="italic-display">la farmacia habla</em>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Dudas, logros y trucos entre compañeros de profesión.
        </p>
        <p className="mt-3 max-w-xl text-sm text-foreground/80">
          ¿Necesitas ayuda con algo? Pregunta a otros profesionales de farmacia, comparte
          experiencias y descubre cómo lo hacen otros.
        </p>
      </div>
    </div>
  );
};
