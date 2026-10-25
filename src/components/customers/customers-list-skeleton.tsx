import { Skeleton } from "@/components/ui/skeleton";

// Misma forma que la lista de clientes mientras llega (al buscar, ordenar o cambiar de página).
export function CustomersListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando clientes">
      <div className="mb-3 flex justify-end">
        <Skeleton className="h-9 w-64 rounded-full" />
      </div>
      <div className="space-y-px overflow-hidden rounded-2xl border border-slate-200/80">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-[72px] rounded-none" />
        ))}
      </div>
    </div>
  );
}
