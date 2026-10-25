import { FormPageSkeleton } from "@/components/form-page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Misma forma que la página del producto: sus números arriba y el formulario abajo.
export default function Loading() {
  return <FormPageSkeleton fields={5} statsSlot={<StatsSkeleton />} />;
}

function StatsSkeleton() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-[84px] rounded-2xl" />
      ))}
    </div>
  );
}
