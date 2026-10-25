import type { OrderStatus } from "@prisma/client";
import Link from "next/link";
import { LiveSearch } from "@/components/live-search";
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
  if (next.sort !== "recientes") params.set("orden", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `/pedidos?${query}` : "/pedidos";
}

export { hrefWith as ordersHref };

type StatusChipsProps = {
  filters: OrderFilters;
  counts: Map<OrderStatus, number>;
};

// Buscador de pedidos: busca mientras escribes y conserva el paso y el orden elegidos.
// No espera a la base de datos, por eso se ve al instante al cambiar de filtro.
export function OrdersSearch({ filters }: { filters: OrderFilters }) {
  const keep: Record<string, string> = {};
  if (filters.status) keep.status = filters.status;
  if (filters.sort !== "recientes") keep.orden = filters.sort;
  return (
    <LiveSearch
      path="/pedidos"
      defaultValue={filters.q}
      keep={keep}
      placeholder="Busca por cliente o número de pedido (ej. OM-00042)"
      label="Buscar pedidos"
    />
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
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:border-ink-900 hover:text-ink-900",
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
