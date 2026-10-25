import { Skeleton } from "@/components/ui/skeleton";

// Misma forma que el comprobante mientras se busca el pedido: botones arriba y la hoja abajo.
export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8" aria-busy="true" aria-label="Cargando comprobante">
      <div className="mb-6 flex justify-between gap-3">
        <Skeleton className="h-11 w-44 rounded-full" />
        <Skeleton className="h-11 w-56 rounded-full" />
      </div>
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-10">
        <div className="flex justify-between gap-6">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-16 w-36" />
        </div>
        <Skeleton className="h-20" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-10" />
        ))}
        <Skeleton className="ml-auto h-8 w-40" />
      </div>
    </main>
  );
}
