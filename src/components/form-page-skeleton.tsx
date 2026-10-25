import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto con la misma forma que las páginas de formulario (nuevo pedido, nuevo o editar producto):
// flecha para regresar, título, campos a la izquierda y el resumen con el botón a la derecha.
export function FormPageSkeleton({ fields = 4, statsSlot }: { fields?: number; statsSlot?: ReactNode }) {
  return (
    <div aria-busy="true" aria-label="Cargando formulario">
      <Skeleton className="mb-6 h-4 w-40" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-56" />
      <Skeleton className="mb-8 mt-3 h-4 w-80 max-w-full" />
      {statsSlot}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          {Array.from({ length: fields }, (_, index) => (
            <div key={index}>
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-2 h-11" />
            </div>
          ))}
        </div>
        <div className="h-fit space-y-4 rounded-xl border border-slate-200 bg-lilac-50 p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
