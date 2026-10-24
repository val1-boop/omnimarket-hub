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