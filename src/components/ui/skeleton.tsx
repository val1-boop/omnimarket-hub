import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Bloque gris animado que ocupa el lugar del contenido mientras carga (en vez de un spinner).
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-testid="skeleton"
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  );
}
// Barra animada que indica que un cambio se está guardando (en vez de un spinner).
// Es un <span> para poder ir dentro de botones y celdas.
export function SavingSkeleton({ className, label = "Guardando…" }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center">
      <span
        aria-hidden="true"
        data-testid="saving-skeleton"
        className={cn("block h-1.5 w-20 animate-pulse rounded-full bg-slate-300", className)}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
