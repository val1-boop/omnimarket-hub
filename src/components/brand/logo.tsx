import { Store } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Logotipo: ícono de tienda + "OMNIMARKET" + subtítulo, en versión clara u oscura.
export function Logo({ href = "/dashboard", inverted = false }: { href?: string; inverted?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-3" aria-label="OmniMarket, ir al inicio">
      <Store className={cn("h-8 w-8", inverted ? "text-white" : "text-navy-900")} strokeWidth={1.5} aria-hidden="true" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-lg font-extrabold tracking-wide",
            inverted ? "text-white" : "text-navy-900",
          )}
        >
          OMNIMARKET
        </span>
        <span
          className={cn(
            "mt-1 text-[10px] font-medium uppercase tracking-[0.2em]",
            inverted ? "text-slate-300" : "text-slate-500",
          )}
        >
          De la caja a la puerta
        </span>
      </span>
    </Link>
  );
}