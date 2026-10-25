import Link from "next/link";
import { StockBadge } from "@/components/products/stock-badge";
import { buttonVariants } from "@/components/ui/button";
import { getCategoryIcon } from "@/lib/categories";
import { calculateMargin } from "@/lib/finance";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export type CatalogProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceCents: number;
  costCents: number;
  stock: number;
};

export function ProductCard({ product }: { product: CatalogProduct }) {
  const Icon = getCategoryIcon(product.category);
  const margin = calculateMargin(product.priceCents, product.costCents);

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-lilac-200/60"
      data-testid="product-card"
    >
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-lilac-100 via-lilac-50 to-white">
        <Icon
          className="h-14 w-14 text-ink-900 transition-transform duration-300 group-hover:scale-110"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <span className="absolute left-3 top-3 rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-semibold text-white">
          Ganas {formatPercent(margin, 0)}
        </span>
        <StockBadge stock={product.stock} className="absolute right-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-slate-500">
          {product.category} · <span className="font-mono">{product.sku}</span>
        </p>
        <h3 className="mt-1 text-sm font-semibold text-ink-900">{product.name}</h3>
        <p className="mt-3 font-display text-lg font-extrabold text-ink-900">{formatCurrency(product.priceCents)}</p>
        <p className="text-xs text-slate-500">
          Te cuesta {formatCurrency(product.costCents)} · Inventario: {formatNumber(product.stock)}
          {product.stock === 1 ? " pieza" : " piezas"}
        </p>
        <Link
          href={`/productos/${product.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 group-hover:border-ink-900")}
          aria-label={`Editar ${product.name}`}
        >
          Editar
        </Link>
      </div>
    </article>
  );
}