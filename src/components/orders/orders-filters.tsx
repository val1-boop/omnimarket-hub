import type { OrderStatus } from "@prisma/client";
import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderFilters } from "@/lib/filters";
import { formatNumber } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/lib/order-status";
import { cn } from "@/lib/utils";

function hrefWith(filters: OrderFilters, changes: Partial<OrderFilters>) {
  const next = { ...filters, page: 1, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `/pedidos?${query}` : "/pedidos";
}

export { hrefWith as ordersHref };

type StatusChipsProps = {
  filters: OrderFilters;
  counts: Map<OrderStatus, number>;
};

// Buscador: funciona como un formulario normal, así la búsqueda queda en la dirección.
// No espera a la base de datos, por eso se ve al instante al cambiar de filtro.
export function OrdersSearch({ filters }: { filters: OrderFilters }) {
  return (
    <form action="/pedidos" className="mb-4 flex flex-col gap-3 sm:flex-row">
      {filters.status && <input type="hidden" name="status" value={filters.status} />}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <Input
          name="q"
          defaultValue={filters.q}
          placeholder="Busca por cliente o número de pedido (ej. OM-00042)"
          aria-label="Buscar pedidos"
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Buscar</Button>
        {filters.q && (
          <Link
            href={hrefWith(filters, { q: "" })}
            className="inline-flex h-11 items-center px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-navy-900"
          >
            Limpiar
          </Link>
        )}
      </div>
    </form>
  );
}

// Botones para filtrar por paso, con cuántos pedidos hay en cada uno.
export function StatusChips({ filters, counts }: StatusChipsProps) {
  const totalCount = [...counts.values()].reduce((sum, value) => sum + value, 0);
  const chips: { status?: OrderStatus; label: string; count: number }[] = [
    { label: "Todos", count: totalCount },
    ...ORDER_STATUSES.map((status) => ({ status, label: ORDER_STATUS_LABELS[status], count: counts.get(status) ?? 0 })),
  ];

  return (
    <nav aria-label="Filtrar por paso" className="mb-6 flex flex-wrap gap-2">
      {chips.map((chip) => {
        const active = filters.status === chip.status;
        return (
          <Link
            key={chip.label}
            href={hrefWith(filters, { status: chip.status })}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "border-navy-900 bg-navy-900 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:border-navy-900 hover:text-navy-900",
            )}
          >
            {chip.label} <span className="opacity-70">({formatNumber(chip.count)})</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function StatusChipsSkeleton() {
  return (
    <div aria-hidden="true" className="mb-6 flex flex-wrap gap-2">
      {Array.from({ length: ORDER_STATUSES.length + 1 }, (_, index) => (
        <Skeleton key={index} className="h-8 w-28 rounded-full" />
      ))}
    </div>
  );
}
