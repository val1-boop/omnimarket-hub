import { Store } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Logotipo: cuadro de tinta con la tienda en verde lima + "OmniMarket" + subtítulo, en versión clara u oscura.
export function Logo({ href = "/dashboard", inverted = false }: { href?: string; inverted?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-3" aria-label="OmniMarket, ir al inicio">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          // En modo oscuro el cuadro pasa a verde lima para que no se pierda en el fondo.
          inverted ? "bg-lima-300 text-ink-900" : "keep-dark bg-ink-900 text-lima-300 dark:bg-lima-300 dark:text-ink-900",
        )}
      >
        <Store className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-lg font-extrabold tracking-tight", inverted ? "text-white" : "text-ink-900")}>
          OmniMarket
        </span>
        <span
          className={cn(
            // En celulares muy angostos las letras van un poco más juntas para que quepa el encabezado.
            "mt-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.14em] min-[360px]:tracking-[0.2em]",
            inverted ? "text-lilac-300" : "text-slate-500",
          )}
        >
          De la caja a la puerta
        </span>
      </span>
    </Link>
  );
}
