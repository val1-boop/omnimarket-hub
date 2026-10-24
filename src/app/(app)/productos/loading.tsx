import { Skeleton } from "@/components/ui/skeleton";

// Next.js muestra este esqueleto automáticamente mientras carga cualquier página privada.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando contenido">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-8 h-72 rounded-2xl" />
    </div>
  );
}