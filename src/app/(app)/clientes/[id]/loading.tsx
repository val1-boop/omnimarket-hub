import { Skeleton } from "@/components/ui/skeleton";

// Misma forma que el detalle del cliente: pedidos a la izquierda; sus datos a la derecha.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando cliente">
      <Skeleton className="mb-6 h-4 w-40" />
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mb-8 mt-3 h-8 w-44" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
