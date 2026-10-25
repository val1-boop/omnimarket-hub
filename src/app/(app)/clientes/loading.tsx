import { CustomersListSkeleton } from "@/components/customers/customers-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando clientes">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <Skeleton className="mb-4 mt-8 h-11" />
      <CustomersListSkeleton />
    </div>
  );
}
