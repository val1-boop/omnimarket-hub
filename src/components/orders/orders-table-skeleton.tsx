import { Skeleton } from "@/components/ui/skeleton";

export function OrdersTableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando pedidos" className="rounded-xl border border-slate-200 bg-white">
      <Skeleton className="h-11 rounded-none rounded-t-xl" />
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-t border-slate-100 px-4 py-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}