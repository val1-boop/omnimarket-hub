import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RecentRow = {
  id: string;
  number: number;
  status: OrderStatus;
  createdAt: Date;
  customerName: string;
  quantity: number;
  unitPriceCents: number;
};

type SalesRow = { pieces: bigint | null; revenue: bigint | null; cost: bigint | null; orders: bigint; lastSoldAt: Date | null };

// Cuánto se ha vendido de un producto en su tienda (sin contar pedidos cancelados),
// con los precios y costos del día de cada venta, y sus pedidos más recientes.
export async function getProductSales(productId: string, storeId: string, recentLimit = 10) {
  const [[totals], recent, [{ count: appearsIn }]] = await Promise.all([
    prisma.$queryRaw<SalesRow[]>`
      SELECT SUM(oi.quantity)::bigint AS pieces,
             SUM(oi.quantity * oi."unitPriceCents")::bigint AS revenue,
             SUM(oi.quantity * oi."unitCostCents")::bigint AS cost,
             COUNT(DISTINCT o.id)::bigint AS orders,
             MAX(o."createdAt") AS "lastSoldAt"
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE oi."productId" = ${productId} AND o."storeId" = ${storeId} AND o.status <> 'CANCELLED'`,
    // Un pedido puede traer el mismo producto en más de una línea: se junta en una sola fila.
    prisma.$queryRaw<RecentRow[]>`
      SELECT o.id, o.number, o.status, o."createdAt", c.name AS "customerName",
             SUM(oi.quantity)::int AS quantity,
             MAX(oi."unitPriceCents")::int AS "unitPriceCents"
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      JOIN "Customer" c ON c.id = o."customerId"
      WHERE oi."productId" = ${productId} AND o."storeId" = ${storeId}
      GROUP BY o.id, c.name
      ORDER BY o."createdAt" DESC, o.number DESC
      LIMIT ${recentLimit}`,
    // Incluye cancelados: es en cuántos pedidos aparece, no cuánto se vendió.
    prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(DISTINCT oi."orderId")::int AS count
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE oi."productId" = ${productId} AND o."storeId" = ${storeId}`,
  ]);

  const revenueCents = Number(totals?.revenue ?? 0);
  const costCents = Number(totals?.cost ?? 0);
  return {
    pieces: Number(totals?.pieces ?? 0),
    revenueCents,
    profitCents: revenueCents - costCents,
    soldOrders: Number(totals?.orders ?? 0),
    lastSoldAt: totals?.lastSoldAt ?? null,
    appearsIn,
    recent,
  };
}
