import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { OrdersFilters, ordersHref } from "@/components/orders/orders-filters";
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

async function OrdersResults({ filters }: { filters: OrderFilters }) {
  const { rows, total, pageCount } = await getOrdersPage(filters);
  return (
    <>
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
  const counts = await getStatusCounts();

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
      <OrdersFilters filters={filters} counts={counts} />
      {/* Cada búsqueda o cambio de página muestra el esqueleto mientras llegan los datos */}
      <Suspense key={JSON.stringify(filters)} fallback={<OrdersTableSkeleton />}>
        <OrdersResults filters={filters} />
      </Suspense>
    </>
  );
}