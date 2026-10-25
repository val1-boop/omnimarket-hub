import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando clientes">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <Skeleton className="mt-8 h-11" />
      <div className="mt-4 space-y-px overflow-hidden rounded-xl border border-slate-200">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-[72px] rounded-none" />
        ))}
      </div>
    </div>
  );
}
