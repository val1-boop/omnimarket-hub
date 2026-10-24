import Link from "next/link";
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
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white" data-testid="product-card">
      <div className="relative flex h-36 items-center justify-center bg-slate-50">
        <Icon className="h-14 w-14 text-navy-900" strokeWidth={1.25} aria-hidden="true" />
        <span className="absolute left-3 top-3 rounded-full bg-navy-900 px-2.5 py-1 text-[10px] font-semibold text-white">
          Ganas {formatPercent(margin, 0)}
        </span>
        {product.stock === 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
            Agotado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-slate-500">
          {product.category} · <span className="font-mono">{product.sku}</span>
        </p>
        <h3 className="mt-1 text-sm font-semibold text-navy-900">{product.name}</h3>
        <p className="mt-3 font-display text-lg font-extrabold text-navy-900">{formatCurrency(product.priceCents)}</p>
        <p className="text-xs text-slate-500">
          Te cuesta {formatCurrency(product.costCents)} · Inventario: {formatNumber(product.stock)}
        </p>
        <Link
          href={`/productos/${product.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
          aria-label={`Editar ${product.name}`}
        >
          Editar
        </Link>
      </div>
    </article>
  );
}