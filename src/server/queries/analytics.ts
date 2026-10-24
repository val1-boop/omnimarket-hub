import { calculateChange, fillDailySeries, getPeriodRange, type AnalyticsPeriod } from "@/lib/analytics";
import { averageTicketFromTotals, calculateMargin } from "@/lib/finance";
import { prisma } from "@/lib/prisma";

// Los pedidos cancelados no cuentan como venta.
const SOLD = { status: { not: "CANCELLED" as const } };

type CategoryRow = { category: string; revenue: bigint; profit: bigint; pieces: bigint };
type TopProductRow = { id: string; name: string; category: string; pieces: bigint; revenue: bigint };
type DailyRow = { day: string; revenue: bigint; orders: bigint };

export async function getSalesAnalytics(period: AnalyticsPeriod, storeId: string) {
  const { from, previousFrom, dayKeys } = getPeriodRange(period);

  const [history, current, previous, daily, categories, topProducts] = await Promise.all([
    // Fecha del primer pedido registrado: si es más reciente que el inicio del periodo anterior,
    // no hay datos completos para comparar.
    prisma.order.aggregate({ where: { storeId }, _min: { createdAt: true } }),
    prisma.order.aggregate({
      where: { ...SOLD, storeId, createdAt: { gte: from } },
      _sum: { totalCents: true, costCents: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { ...SOLD, storeId, createdAt: { gte: previousFrom, lt: from } },
      _sum: { totalCents: true, costCents: true },
      _count: { _all: true },
    }),
    // Ventas por día, agrupadas con el calendario de la Ciudad de México.
    prisma.$queryRaw<DailyRow[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD') AS day,
             SUM("totalCents")::bigint AS revenue,
             COUNT(*)::bigint AS orders
      FROM "Order"
      WHERE "storeId" = ${storeId} AND status <> 'CANCELLED' AND "createdAt" >= ${from}
      GROUP BY 1
      ORDER BY 1`,
    prisma.$queryRaw<CategoryRow[]>`
      SELECT p.category,
             SUM(oi.quantity * oi."unitPriceCents")::bigint AS revenue,
             SUM(oi.quantity * (oi."unitPriceCents" - oi."unitCostCents"))::bigint AS profit,
             SUM(oi.quantity)::bigint AS pieces
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      JOIN "Product" p ON p.id = oi."productId"
      WHERE o."storeId" = ${storeId} AND o.status <> 'CANCELLED' AND o."createdAt" >= ${from}
      GROUP BY p.category
      ORDER BY revenue DESC`,
    prisma.$queryRaw<TopProductRow[]>`
      SELECT p.id, p.name, p.category,
             SUM(oi.quantity)::bigint AS pieces,
             SUM(oi.quantity * oi."unitPriceCents")::bigint AS revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      JOIN "Product" p ON p.id = oi."productId"
      WHERE o."storeId" = ${storeId} AND o.status <> 'CANCELLED' AND o."createdAt" >= ${from}
      GROUP BY p.id, p.name, p.category
      ORDER BY pieces DESC, revenue DESC
      LIMIT 5`,
  ]);

  const revenue = current._sum.totalCents ?? 0;
  const cost = current._sum.costCents ?? 0;
  const orders = current._count._all;
  const previousRevenue = previous._sum.totalCents ?? 0;
  const previousProfit = previousRevenue - (previous._sum.costCents ?? 0);
  const previousOrders = previous._count._all;
  const canCompare = Boolean(history._min.createdAt && history._min.createdAt <= previousFrom);
  const change = (now: number, before: number) => (canCompare ? calculateChange(now, before) : null);
  const averageTicket = averageTicketFromTotals(revenue, orders);
  const previousAverageTicket = averageTicketFromTotals(previousRevenue, previousOrders);

  return {
    period,
    kpis: {
      revenueCents: revenue,
      profitCents: revenue - cost,
      marginRatio: calculateMargin(revenue, cost),
      orders,
      averageTicketCents: averageTicket,
      changes: {
        revenue: change(revenue, previousRevenue),
        profit: change(revenue - cost, previousProfit),
        orders: change(orders, previousOrders),
        averageTicket: change(averageTicket, previousAverageTicket),
      },
    },
    daily: fillDailySeries(
      dayKeys,
      daily.map((row) => ({ day: row.day, revenueCents: Number(row.revenue), orders: Number(row.orders) })),
    ),
    categories: categories.map((row) => ({
      category: row.category,
      revenueCents: Number(row.revenue),
      profitCents: Number(row.profit),
      pieces: Number(row.pieces),
    })),
    topProducts: topProducts.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      pieces: Number(row.pieces),
      revenueCents: Number(row.revenue),
    })),
  };
}

export type SalesAnalytics = Awaited<ReturnType<typeof getSalesAnalytics>>;