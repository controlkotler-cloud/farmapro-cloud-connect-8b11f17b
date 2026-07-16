export const EventosHeader = () => {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
          La agenda <em className="italic-display">del sector</em>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Congresos, formaciones y citas que merecen hueco.
        </p>
      </div>
    </div>
  );
};
