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

type PedidosPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Los conteos por paso y la tabla se piden al mismo tiempo, dentro del Suspense,
// así la página no se queda congelada mientras llegan.
async function OrdersResults({ filters }: { filters: OrderFilters }) {
  const [counts, { rows, total, pageCount }] = await Promise.all([getStatusCounts(), getOrdersPage(filters)]);
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