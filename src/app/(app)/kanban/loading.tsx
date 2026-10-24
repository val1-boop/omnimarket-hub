import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando el tablero">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }, (_, column) => (
          <div key={column} className="min-w-56 flex-1 space-y-3 rounded-2xl bg-slate-50 p-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 4 }, (_, card) => (
              <Skeleton key={card} className="h-32 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}