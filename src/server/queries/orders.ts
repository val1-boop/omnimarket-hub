import { buildOrderOrderBy, buildOrderWhere, ORDERS_PAGE_SIZE, type OrderFilters } from "@/lib/filters";
import { prisma } from "@/lib/prisma";

// Todas las consultas reciben la tienda: nunca se mezclan pedidos de tiendas distintas.
export async function getOrdersPage(filters: OrderFilters, storeId: string) {
  const where = { ...buildOrderWhere(filters), storeId };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: buildOrderOrderBy(filters.sort),
      skip: (filters.page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      select: {
        id: true,
        number: true,
        status: true,
        totalCents: true,
        createdAt: true,
        customer: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return {
    total,
    pageCount: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)),
    rows: orders.map((order) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      totalCents: order.totalCents,
      createdAt: order.createdAt,
      customerName: order.customer.name,
      itemCount: order._count.items,
    })),
  };
}

export type OrderRow = Awaited<ReturnType<typeof getOrdersPage>>["rows"][number];

export async function getStatusCounts(storeId: string) {
  const rows = await prisma.order.groupBy({ by: ["status"], where: { storeId }, _count: { _all: true } });
  return new Map(rows.map((row) => [row.status, row._count._all]));
}