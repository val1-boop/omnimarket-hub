"use client";

import { LayoutGrid, Search } from "lucide-react";
import { useState } from "react";
import { ProductCard, type CatalogProduct } from "@/components/products/product-card";
import { SectionTitle } from "@/components/section-title";
import { Input } from "@/components/ui/input";
import { getCategoryIcon } from "@/lib/categories";
import { filterProducts } from "@/lib/filters";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductCatalog({ products }: { products: CatalogProduct[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const categories = [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b, "es"));
  const visible = filterProducts(products, { category, query });

  return (
    <div className="space-y-10">
      <section>
        <SectionTitle title="Por categoría" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {[null, ...categories].map((item) => {
            const Icon = item ? getCategoryIcon(item) : LayoutGrid;
            const count = item ? products.filter((product) => product.category === item).length : products.length;
            const active = category === item;
            return (
              <button
                key={item ?? "todas"}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl px-3 py-5 text-center transition-colors",
                  active ? "bg-navy-900 text-white" : "bg-slate-50 text-navy-900 hover:bg-sand-100",
                )}
              >
                <Icon className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-sm font-semibold">{item ?? "Todas"}</span>
                <span className={cn("text-xs", active ? "text-slate-300" : "text-slate-500")}>
                  {formatNumber(count)} productos
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-navy-900">
            {category ?? "Todos los productos"} <span className="text-slate-400">({formatNumber(visible.length)})</span>
          </h2>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busca por nombre o SKU"
              aria-label="Buscar productos"
              className="pl-9"
            />
          </div>
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-wider text-navy-900">Nada por aquí</p>
            <p className="mt-1 text-sm text-slate-500">
              No encontramos productos{query ? ` con “${query}”` : ""}. Prueba con otra palabra o categoría.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}