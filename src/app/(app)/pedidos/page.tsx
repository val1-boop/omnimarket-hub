import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { OrdersSearch, StatusChips, StatusChipsSkeleton, ordersHref } from "@/components/orders/orders-filters";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrdersTableSkeleton } from "@/components/orders/orders-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { buttonVariants } from "@/components/ui/button";
import { parseOrderFilters, type OrderFilters } from "@/lib/filters";
import { getOrdersPage, getStatusCounts } from "@/server/queries/orders";
import { requireStoreContext } from "@/server/store";

type PedidosPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Los conteos por paso y la tabla se piden al mismo tiempo, dentro del Suspense,
// así la página no se queda congelada mientras llegan.
async function OrdersResults({ filters }: { filters: OrderFilters }) {
  const { store } = await requireStoreContext();
  const [counts, { rows, total, pageCount }] = await Promise.all([
    getStatusCounts(store.id),
    getOrdersPage(filters, store.id),
  ]);
  // Tienda sin ningún pedido: en lugar de una tabla vacía, se explica cómo empezar.
  const storeTotal = [...counts.values()].reduce((sum, value) => sum + value, 0);
  if (storeTotal === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center" data-testid="orders-empty">
        <p className="font-display text-base font-bold text-ink-900">
          Todavía no tienes pedidos
        </p>
        <p className="mt-1 text-sm text-slate-500">Cuando registres tu primer pedido, aparecerá aquí.</p>
        <Link href="/pedidos/nuevo" className={buttonVariants({ className: "mt-6" })}>
          Registrar mi primer pedido
        </Link>
      </div>
    );
  }

  return (
    <>
      <StatusChips filters={filters} counts={counts} />
      <OrdersTable rows={rows} />
      {total > 0 && (
        <Pagination
          page={filters.page}
          pageCount={pageCount}
          total={total}
          hrefForPage={(page) => ordersHref(filters, { page })}
        />
      )}
    </>
  );
}

export default async function PedidosPage({ searchParams }: PedidosPageProps) {
  const filters = parseOrderFilters(await searchParams);

  return (
    <>
      <PageHeader
        eyebrow="Tus ventas"
        title="Pedidos"
        description="Marca varios pedidos con la casilla y cámbialos de paso todos a la vez."
        actions={
          <Link href="/pedidos/nuevo" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Nuevo pedido
          </Link>
        }
      />
      <OrdersSearch filters={filters} />
      {/* Cada búsqueda o cambio de página muestra el esqueleto mientras llegan los datos */}
      <Suspense
        key={JSON.stringify(filters)}
        fallback={
          <>
            <StatusChipsSkeleton />
            <OrdersTableSkeleton />
          </>
        }
      >
        <OrdersResults filters={filters} />
      </Suspense>
    </>
  );
}