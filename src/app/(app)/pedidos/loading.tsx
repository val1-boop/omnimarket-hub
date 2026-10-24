import { OrdersTableSkeleton } from "@/components/orders/orders-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <Skeleton className="mt-8 h-11" />
      <div className="mt-4 flex gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-28 rounded-full" />
        ))}
      </div>
      <div className="mt-6">
        <OrdersTableSkeleton />
      </div>
    </div>
  );
}