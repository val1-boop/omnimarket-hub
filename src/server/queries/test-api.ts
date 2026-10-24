import { averageTicketFromTotals, calculateMargin } from "@/lib/finance";
import { formatCurrency, formatOrderNumber } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { DEMO_STORE_ID } from "@/lib/stores";

// Los endpoints de auditoría son públicos: SOLO leen la tienda de demostración, nunca datos privados.
const DEMO = { storeId: DEMO_STORE_ID };
// Los pedidos cancelados no cuentan como venta.
const SOLD = { ...DEMO, status: { not: "CANCELLED" as const } };

/** Métricas de ventas generales + una página de pedidos con su ganancia. */
export async function getAnalyticsPage({ page, limit }: { page: number; limit: number }) {
  const [totals, statusCounts, totalOrders, orders] = await Promise.all([
    prisma.order.aggregate({ where: SOLD, _sum: { totalCents: true, costCents: true }, _count: { _all: true } }),
    prisma.order.groupBy({ by: ["status"], where: DEMO, _count: { _all: true } }),
    prisma.order.count({ where: DEMO }),
    prisma.order.findMany({
      where: DEMO,
      orderBy: [{ createdAt: "desc" }, { number: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        number: true,
        status: true,
        totalCents: true,
        costCents: true,
        createdAt: true,
        customer: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const revenue = totals._sum.totalCents ?? 0;
  const cost = totals._sum.costCents ?? 0;
  const soldOrders = totals._count._all;
  const averageTicket = averageTicketFromTotals(revenue, soldOrders);
  const counts = new Map(statusCounts.map((row) => [row.status, row._count._all]));
  const totalPages = Math.max(1, Math.ceil(totalOrders / limit));

  return {
    summary: {
      currency: "MXN",
      soldOrders,
      revenueCents: revenue,
      revenue: formatCurrency(revenue),
      profitCents: revenue - cost,
      profit: formatCurrency(revenue - cost),
      marginRatio: Number(calculateMargin(revenue, cost).toFixed(4)),
      averageTicketCents: averageTicket,
      averageTicket: formatCurrency(averageTicket),
      ordersByStatus: Object.fromEntries(ORDER_STATUSES.map((status) => [status, counts.get(status) ?? 0])),
    },
    data: orders.map((order) => ({
      id: order.id,
      orderNumber: formatOrderNumber(order.number),
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status],
      customer: order.customer.name,
      items: order._count.items,
      totalCents: order.totalCents,
      costCents: order.costCents,
      profitCents: order.totalCents - order.costCents,
      marginRatio: Number(calculateMargin(order.totalCents, order.costCents).toFixed(4)),
    })),
    pagination: {
      page,
      limit,
      total: totalOrders,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

const kanbanOrderSelect = {
  id: true,
  number: true,
  status: true,
  updatedAt: true,
  customer: { select: { name: true } },
} as const;

type KanbanOrder = {
  id: string;
  number: number;
  status: (typeof ORDER_STATUSES)[number];
  updatedAt: Date;
  customer: { name: string };
};

function toKanbanItem(order: KanbanOrder) {
  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.number),
    status: order.status,
    column: ORDER_STATUS_LABELS[order.status],
    columnIndex: ORDER_STATUSES.indexOf(order.status) + 1,
    customer: order.customer.name,
    updatedAt: order.updatedAt.toISOString(),
  };
}

/** Estado actual de un pedido de la tienda de demostración (por número o por id). */
export async function getKanbanOrderStatus(where: { number: number } | { id: string }) {
  const order = await prisma.order.findFirst({ where: { ...where, ...DEMO }, select: kanbanOrderSelect });
  return order ? toKanbanItem(order) : null;
}

/** Resumen del tablero: cuántos pedidos hay en cada columna y los últimos movidos. */
export async function getKanbanSummary() {
  const [counts, recent] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: DEMO, _count: { _all: true } }),
    prisma.order.findMany({ where: DEMO, orderBy: { updatedAt: "desc" }, take: 5, select: kanbanOrderSelect }),
  ]);
  const totals = new Map(counts.map((row) => [row.status, row._count._all]));

  return {
    columns: ORDER_STATUSES.map((status, index) => ({
      status,
      column: ORDER_STATUS_LABELS[status],
      columnIndex: index + 1,
      orders: totals.get(status) ?? 0,
    })),
    recentlyUpdated: recent.map(toKanbanItem),
  };
}
