import { isLowStock, stockLabel } from "@/lib/inventory";
import { cn } from "@/lib/utils";

// "Quedan 3" en ámbar cuando se está acabando, "Agotado" en rojo; si hay suficientes no se muestra.
export function StockBadge({ stock, className, always = false }: { stock: number; className?: string; always?: boolean }) {
  if (!always && stock > 0 && !isLowStock(stock)) return null;
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
        stock <= 0 ? "bg-rose-100 text-rose-800" : isLowStock(stock) ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800",
        className,
      )}
      data-testid="stock-badge"
    >
      {stockLabel(stock)}
    </span>
  );
}
